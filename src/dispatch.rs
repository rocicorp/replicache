#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

use crate::kv::idbstore::IdbStore;
use crate::kv::Store;
use async_std::sync::{channel, Receiver, Sender};
use log::warn;
use nanoserde::{DeJson, SerJson};
use std::collections::HashMap;
use std::sync::Mutex;
use wasm_bindgen_futures::spawn_local;

struct Request {
    db_name: String,
    rpc: String,
    data: String,
    response: Sender<Response>,
}

type Response = Result<String, String>;

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
            Err(why) => warn!("Dispatch loop recv failed: {}", why),
            Ok(req) => {
                let response = match req.rpc.as_str() {
                    "open" => Some(dispatcher.open(&req).await),
                    "close" => Some(dispatcher.close(&req).await),
                    "debug" => Some(dispatcher.debug(&req).await),
                    _ => None,
                };
                if let Some(response) = response {
                    req.response.send(response).await;
                    continue;
                }
                let db = match dispatcher.connections.get_mut(&req.db_name[..]) {
                    Some(v) => v,
                    None => {
                        let err = Err(format!("\"{}\" not open", req.db_name));
                        req.response.send(err).await;
                        continue;
                    }
                };
                let response = match req.rpc.as_str() {
                    "has" => Dispatcher::has(&**db, &req.data).await,
                    "get" => Dispatcher::get(&**db, &req.data).await,
                    "put" => Dispatcher::put(&mut **db, &req.data).await,
                    _ => Err("Unsupported rpc name".into()),
                };
                req.response.send(response).await;
            }
        }
    }
}

#[derive(DeJson)]
struct GetRequest {
    key: String,
}

#[derive(SerJson)]
struct GetResponse {
    value: Option<String>,
    has: bool, // Second to avoid trailing comma if value == None.
}

#[derive(DeJson)]
struct PutRequest {
    key: String,
    value: String,
}

struct Dispatcher {
    connections: HashMap<String, Box<dyn Store>>,
}

impl Dispatcher {
    async fn open(&mut self, req: &Request) -> Response {
        if req.db_name.is_empty() {
            return Err("db_name must be non-empty".into());
        }
        if self.connections.contains_key(&req.db_name[..]) {
            return Ok("".into());
        }
        match IdbStore::new(&req.db_name[..]).await {
            Err(e) => {
                return Err(format!("Failed to open \"{}\": {}", req.db_name, e));
            }
            Ok(v) => {
                if let Some(v) = v {
                    self.connections.insert(req.db_name.clone(), Box::new(v));
                }
            }
        }
        Ok("".into())
    }

    async fn close(&mut self, req: &Request) -> Response {
        if !self.connections.contains_key(&req.db_name[..]) {
            return Ok("".into());
        }
        self.connections.remove(&req.db_name);

        Ok("".into())
    }

    async fn has(db: &dyn Store, data: &str) -> Response {
        let req: GetRequest = match DeJson::deserialize_json(data) {
            Ok(v) => v,
            Err(_) => return Err("Failed to parse request".into()),
        };
        match db.has(&req.key).await {
            Ok(v) => Ok(SerJson::serialize_json(&GetResponse {
                has: v,
                value: None,
            })),
            Err(e) => Err(format!("{}", e)),
        }
    }

    async fn get(db: &dyn Store, data: &str) -> Response {
        let req: GetRequest = match DeJson::deserialize_json(data) {
            Ok(v) => v,
            Err(_) => return Err("Failed to parse request".into()),
        };
        match db.get(&req.key).await {
            Ok(Some(v)) => match std::str::from_utf8(&v[..]) {
                Ok(v) => Ok(SerJson::serialize_json(&GetResponse {
                    has: true,
                    value: Some(v.into()),
                })),
                Err(e) => Err(e.to_string()),
            },
            Ok(None) => Ok(SerJson::serialize_json(&GetResponse {
                has: false,
                value: None,
            })),
            Err(e) => Err(format!("{}", e)),
        }
    }

    async fn put(db: &mut dyn Store, data: &str) -> Response {
        let req: PutRequest = match DeJson::deserialize_json(data) {
            Ok(v) => v,
            Err(_) => return Err("Failed to parse request".into()),
        };
        match db.put(&req.key, &req.value.into_bytes()).await {
            Ok(_) => Ok("".into()),
            Err(e) => Err(format!("{}", e)),
        }
    }

    async fn debug(&self, req: &Request) -> Response {
        match req.data.as_str() {
            "open_dbs" => Ok(format!("{:?}", self.connections.keys())),
            _ => Err("Debug command not defined".into()),
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
        Err(e) => return Err(e.to_string()),
    }
    match rx.recv().await {
        Err(e) => Err(e.to_string()),
        Ok(v) => v,
    }
}
