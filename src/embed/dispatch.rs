use crate::dag;
use crate::embed::connection;
use crate::kv::idbstore::IdbStore;
use crate::kv::{Store, StoreError};
use crate::util::rlog;
use crate::util::rlog::LogContext;
use crate::util::to_debug;
use crate::util::uuid::uuid;
use async_std::sync::{channel, Mutex, Receiver, Sender};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_futures::spawn_local;

#[cfg(not(target_arch = "wasm32"))]
use async_std::task::spawn_local;

lazy_static! {
    static ref RPC_COUNTER: AtomicU32 = AtomicU32::new(1);
}

pub struct Request {
    pub lc: LogContext,
    db_name: String,
    pub rpc: String,
    pub data: String,
    pub response: Sender<Response>,
}

type Response = Result<String, String>;

lazy_static! {
    static ref SENDER: Mutex<Sender::<Request>> = {
        let (tx, rx) = channel::<Request>(1);

        #[cfg(target_arch = "wasm32")]
        spawn_local(dispatch_loop(rx));

        #[cfg(not(target_arch = "wasm32"))]
        std::thread::spawn(move || {
            async_std::task::block_on(dispatch_loop(rx));
        });

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

        let response = match req.rpc.as_str() {
            "open" => Some(do_open(&mut conns, &req).await),
            "close" => Some(do_close(&mut conns, &req).await),
            "drop" => Some(do_drop(&mut conns, &req).await),
            "debug" => Some(do_debug(&conns, &req).await),
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
                    .send(Err(format!("\"{}\" not open", req.db_name)))
                    .await;
            }
        };
    }
}

pub async fn dispatch(db_name: String, rpc: String, data: wasm_bindgen::JsValue) -> Response {
    let data = data.as_string().unwrap();
    let lc = LogContext::new();
    let rpc_id = RPC_COUNTER.fetch_add(1, Ordering::Relaxed).to_string();
    lc.add_context("rpc_id", rpc_id.as_str());
    lc.add_context("rpc", &rpc);
    lc.add_context("db", &db_name);
    debug!(lc, "-> data={}", &data);
    let timer = rlog::Timer::new().map_err(to_debug)?;

    let (tx, rx) = channel::<Response>(1);
    let request = Request {
        lc: lc.clone(),
        db_name: db_name.clone(),
        rpc: rpc.clone(),
        data,
        response: tx,
    };
    SENDER.lock().await.send(request).await;
    let receive_result = rx.recv().await;
    let result = match receive_result {
        Err(e) => Err(e.to_string()),
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
        return Ok("".into());
    }

    let kv: Box<dyn Store> = match &req.db_name[..] {
        #[cfg(not(target_arch = "wasm32"))]
        "mem" => Box::new(crate::kv::memstore::MemStore::new()),
        _ => match IdbStore::new(&req.db_name[..]).await {
            Err(e) => return Err(format!("Failed to open \"{}\": {}", req.db_name, e)),
            Ok(v) => match v {
                None => return Err(format!("Didn't open \"{}\"", req.db_name)),
                Some(v) => Box::new(v),
            },
        },
    };

    let client_id = init_client_id(kv.as_ref(), req.lc.clone())
        .await
        .map_err(to_debug)?;

    let (tx, rx) = channel::<Request>(1);
    spawn_local(connection::process(
        dag::Store::new(kv),
        rx,
        client_id,
        req.lc.clone(),
    ));
    conns.insert(req.db_name.clone(), tx);
    Ok("".into())
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
        rpc: "close".into(),
        data: "".into(),
        response: tx2,
    })
    .await;
    let _ = rx2.recv().await;
    conns.remove(&req.db_name);
    Ok("".into())
}

async fn do_drop(_: &mut ConnMap, req: &Request) -> Response {
    match &req.db_name[..] {
        #[cfg(not(target_arch = "wasm32"))]
        "mem" => Ok("".into()),
        _ => {
            IdbStore::drop_store(&req.db_name, req.lc.clone())
                .await
                .map_err(|e| e.to_string())?;
            Ok("".into())
        }
    }
}

async fn do_debug(conns: &ConnMap, req: &Request) -> Response {
    match req.data.as_str() {
        "open_dbs" => Ok(to_debug(conns.keys())),
        _ => Err("Debug command not defined".into()),
    }
}

#[derive(Debug)]
enum InitClientIdError {
    CommitErr(StoreError),
    GetErr(StoreError),
    InvalidUtf8(std::string::FromUtf8Error),
    OpenErr(StoreError),
    PutClientIdErr(StoreError),
}

async fn init_client_id(s: &dyn Store, lc: LogContext) -> Result<String, InitClientIdError> {
    use InitClientIdError::*;

    const CID_KEY: &str = "sys/cid";
    let cid = s.get(CID_KEY).await.map_err(GetErr)?;
    if let Some(cid) = cid {
        let s = String::from_utf8(cid).map_err(InvalidUtf8)?;
        return Ok(s);
    }
    let wt = s.write(lc).await.map_err(OpenErr)?;
    let uuid = uuid();
    wt.put(CID_KEY, &uuid.as_bytes())
        .await
        .map_err(PutClientIdErr)?;
    wt.commit().await.map_err(CommitErr)?;
    Ok(uuid)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;

    #[async_std::test]
    async fn test_init_client_id() {
        let ms = Box::new(MemStore::new());
        let cid1 = init_client_id(ms.as_ref(), LogContext::new())
            .await
            .unwrap();
        let cid2 = init_client_id(ms.as_ref(), LogContext::new())
            .await
            .unwrap();
        assert_eq!(cid1, cid2);
        let ms = Box::new(MemStore::new());
        let cid3 = init_client_id(ms.as_ref(), LogContext::new())
            .await
            .unwrap();
        assert_ne!(cid1, cid3);
    }
}
