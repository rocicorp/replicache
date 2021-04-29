use super::types::OpenRequest;
use super::Rpc;
use crate::dag;
use crate::embed::connection;
use crate::kv::idbstore::IdbStore;
use crate::kv::memstore::MemStore;
use crate::kv::Store;
use crate::sync;
use crate::util::rlog;
use crate::util::rlog::LogContext;
use crate::util::to_debug;
use async_std::sync::{channel, Mutex, Receiver, Sender};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::spawn_local;

lazy_static! {
    static ref RPC_COUNTER: AtomicU32 = AtomicU32::new(1);
}

pub struct Request {
    pub lc: LogContext,
    db_name: String,
    pub rpc: Rpc,
    pub data: JsValue,
    pub response: Sender<Response>,
}

unsafe impl Send for Request {}

type Response = Result<JsValue, JsValue>;

lazy_static! {
    static ref SENDER: Mutex<Sender::<Request>> = {
        let (tx, rx) = channel::<Request>(1);
        spawn_local(dispatch_loop(rx));
        Mutex::new(tx)
    };
}

type ConnMap = HashMap<String, Sender<Request>>;

async fn dispatch_loop(rx: Receiver<Request>) {
    let mut conns: ConnMap = HashMap::new();

    loop {
        let req = match rx.recv().await {
            Ok(req) => req,
            Err(why) => {
                error!("", "Dispatch loop recv failed: {}", why);
                continue;
            }
        };

        let response = match req.rpc {
            Rpc::Open => Some(do_open(&mut conns, &req).await),
            Rpc::Close => Some(do_close(&mut conns, &req).await),
            Rpc::Debug => Some(do_debug(&conns, &req).await),
            _ => None,
        };
        if let Some(response) = response {
            req.response.send(response).await;
            continue;
        }
        match conns.get(&req.db_name[..]) {
            Some(tx) => tx.send(req).await,
            None => {
                req.response
                    .send(Err(JsValue::from_str(&format!(
                        "\"{}\" not open",
                        req.db_name
                    ))))
                    .await;
            }
        };
    }
}

pub async fn dispatch(db_name: String, rpc: Rpc, data: JsValue) -> Response {
    let lc = LogContext::new();
    let rpc_id = RPC_COUNTER.fetch_add(1, Ordering::Relaxed).to_string();
    lc.add_context("rpc_id", rpc_id.as_str());
    lc.add_context("rpc", &format!("{:?}", rpc));
    lc.add_context("db", &db_name);
    debug!(lc, "-> data={:?}", &data);
    let timer = rlog::Timer::new();

    let (sender, receiver) = channel::<Response>(1);
    let request = Request {
        lc: lc.clone(),
        db_name: db_name.clone(),
        rpc,
        data,
        response: sender,
    };
    SENDER.lock().await.send(request).await;
    let receive_result = receiver.recv().await;
    let result = match receive_result {
        Err(e) => Err(JsValue::from_str(&e.to_string())),
        Ok(v) => v,
    };
    debug!(
        lc,
        "<- elapsed={}ms result={:?}",
        timer.elapsed_ms(),
        result
    );
    result
}

async fn do_open(conns: &mut ConnMap, req: &Request) -> Response {
    if req.db_name.is_empty() {
        return Err("db_name must be non-empty".into());
    }
    if conns.contains_key(&req.db_name[..]) {
        return Err(format!(
            "Database \"{}\" has already been opened. Please close it before opening it again",
            req.db_name
        )
        .into());
    }

    let open_req = serde_wasm_bindgen::from_value::<OpenRequest>(req.data.clone())
        .map_err(|e| JsValue::from_str(&format!("Failed to read open request options: {}", e)))?;

    let kv: Box<dyn Store> = if open_req.use_memstore {
        Box::new(MemStore::new())
    } else {
        match IdbStore::new(&req.db_name[..]).await {
            Err(e) => {
                return Err(JsValue::from_str(&format!(
                    "Failed to open \"{}\": {}",
                    req.db_name, e
                )))
            }
            Ok(store) => Box::new(store),
        }
    };

    let client_id = sync::client_id::init(kv.as_ref(), req.lc.clone())
        .await
        .map_err(to_debug)?;

    let (sender, receiver) = channel::<Request>(1);
    spawn_local(connection::process(
        dag::Store::new(kv),
        receiver,
        client_id.clone(),
        req.lc.clone(),
    ));
    conns.insert(req.db_name.clone(), sender);
    Ok(client_id.into())
}

async fn do_close(conns: &mut ConnMap, req: &Request) -> Response {
    let tx = match conns.get(&req.db_name[..]) {
        None => return Ok("".into()),
        Some(v) => v,
    };
    let (tx2, rx2) = channel::<Response>(1);
    tx.send(Request {
        lc: req.lc.clone(),
        db_name: req.db_name.clone(),
        rpc: Rpc::Close,
        data: "".into(),
        response: tx2,
    })
    .await;
    let _ = rx2.recv().await;
    conns.remove(&req.db_name);
    Ok("".into())
}

async fn do_debug(conns: &ConnMap, req: &Request) -> Response {
    match req.data.as_string().as_deref() {
        Some("open_dbs") => Ok(JsValue::from_str(&to_debug(conns.keys()))),
        _ => Err("Debug command not defined".into()),
    }
}
