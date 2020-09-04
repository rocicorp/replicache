use crate::dag;
use crate::embed::connection;
use crate::kv::idbstore::IdbStore;
use crate::kv::Store;
use async_std::sync::{channel, Mutex, Receiver, Sender};
use log::warn;
use std::collections::HashMap;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_futures::spawn_local;

#[cfg(not(target_arch = "wasm32"))]
use async_std::task::spawn_local;

pub struct Request {
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
                warn!("Dispatch loop recv failed: {}", why);
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

pub async fn dispatch(db_name: String, rpc: String, data: String) -> Response {
    let (tx, rx) = channel::<Response>(1);
    let request = Request {
        db_name,
        rpc,
        data,
        response: tx,
    };
    SENDER.lock().await.send(request).await;
    match rx.recv().await {
        Err(e) => Err(e.to_string()),
        Ok(v) => v,
    }
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

    let (tx, rx) = channel::<Request>(1);
    spawn_local(connection::process(dag::Store::new(kv), rx));
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
            IdbStore::drop_store(&req.db_name)
                .await
                .map_err(|e| e.to_string())?;
            Ok("".into())
        }
    }
}

async fn do_debug(conns: &ConnMap, req: &Request) -> Response {
    match req.data.as_str() {
        "open_dbs" => Ok(format!("{:?}", conns.keys())),
        _ => Err("Debug command not defined".into()),
    }
}
