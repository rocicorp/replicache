use crate::idbstore::IdbStore;
use async_std::sync::{channel, Receiver, Sender};
use std::collections::HashMap;
use std::sync::Mutex;
use wasm_bindgen_futures::spawn_local;

type Response = Result<String, String>;

struct Request {
    db_name: String,
    rpc: String,
    data: String,
    response: Sender<Response>,
}

lazy_static! {
    static ref SENDER: Mutex<Sender::<Request>> = {
        let (tx, rx) = channel::<Request>(1);
        spawn_local(dispatch_loop(rx));
        Mutex::new(tx)
    };
}

async fn dispatch_loop(rx: Receiver<Request>) {
    let mut dispatcher = Dispatcher {
        connections: HashMap::new(),
    };

    loop {
        match rx.recv().await {
            Err(why) => log!("Recv failed: {}", why),
            Ok(req) => {
                let response = match req.rpc.as_str() {
                    "open" => dispatcher.open(&req).await,
                    "close" => dispatcher.close(&req).await,
                    "debug" => dispatcher.debug(&req).await,
                    _ => Err("Unsupported rpc name".to_string()),
                };
                req.response.send(response).await;
            }
        }
    }
}

struct Dispatcher {
    connections: HashMap<String, IdbStore>,
}

impl Dispatcher {
    async fn open(&mut self, req: &Request) -> Response {
        if req.db_name.is_empty() {
            return Err("db_name must be non-empty".to_string());
        }
        if self.connections.contains_key(&req.db_name[..]) {
            return Ok("".to_string());
        }
        match IdbStore::new(&req.db_name[..]).await {
            Err(v) => {
                log!("Failed to open! {:?}", v);
                return Err("Failed to open failed!".to_string());
            }
            Ok(v) => {
                if let Some(v) = v {
                    self.connections.insert(req.db_name.clone(), v);
                }
            }
        }
        Ok("".to_string())
    }

    async fn close(&mut self, req: &Request) -> Response {
        if !self.connections.contains_key(&req.db_name[..]) {
            return Ok("".to_string());
        }
        self.connections.remove(&req.db_name);

        Ok("".to_string())
    }

    async fn debug(&mut self, req: &Request) -> Response {
        match req.data.as_str() {
            "open_dbs" => Ok(format!("{:?}", self.connections.keys())),
            _ => Err("Debug command not defined".to_string()),
        }
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
    match SENDER.lock() {
        Ok(v) => v.send(request).await,
        Err(v) => return Err(v.to_string()),
    }
    match rx.recv().await {
        Err(v) => Err(v.to_string()),
        Ok(v) => v,
    }
}
