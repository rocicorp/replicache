use crate::db;
use crate::util::rlog;
use serde::Deserialize;
use serde_json::json;
use std::default::Default;

const OP_ADD: &str = "add";
const OP_REMOVE: &str = "remove";
const OP_REPLACE: &str = "replace";

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
pub struct Operation {
    pub op: String,
    pub path: String,
    #[serde(default)]
    pub value: serde_json::Value,
}

pub async fn apply(db_write: &mut db::Write<'_>, patch: &[Operation]) -> Result<(), PatchError> {
    use PatchError::*;
    for op in patch.iter() {
        // Special case `{"op": "replace", "path": "", "value": {}}`
        // which means replace the root with a new map, in other words, clear
        // the map.
        if op.path.is_empty() {
            if op.op == OP_REPLACE && op.value == json!({}) {
                db_write.clear().await.map_err(ClearError)?;
                continue;
            }
            return Err(InvalidPath(op.path.clone()));
        }

        let mut chars = op.path.chars();
        if chars.next() != Some('/') {
            return Err(InvalidPath(op.path.clone()));
        }
        let key = json_pointer_unescape(chars.as_str()).as_bytes().to_vec();

        match op.op.as_str() {
            OP_ADD | OP_REPLACE => {
                let value = serde_json::to_vec(&op.value).map_err(InvalidValue)?;
                db_write
                    .put(rlog::LogContext::new(), key, value)
                    .await
                    .map_err(PutError)?;
            }
            // Should we error if we try to remove a key that doesn't exist?
            OP_REMOVE => {
                db_write
                    .del(rlog::LogContext::new(), key)
                    .await
                    .map_err(DelError)?;
            }
            _ => return Err(InvalidOp(op.op.to_string())),
        };
    }
    Ok(())
}

fn json_pointer_unescape(s: &str) -> String {
    s.replace("~1", "/").replace("~0", "~")
}

#[derive(Debug)]
pub enum PatchError {
    ClearError(db::ClearError),
    DelError(db::DelError),
    InvalidOp(String),
    InvalidPath(String),
    InvalidValue(serde_json::Error),
    PutError(db::PutError),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use crate::util::to_debug;
    use std::collections::HashMap;
    use str_macro::str;

    macro_rules! map(
        { $($key:expr => $value:expr),+ } => {
            {
                let mut m = ::std::collections::HashMap::new();
                $(
                    m.insert($key, $value);
                )+
                m
            }
         };
    );

    #[async_std::test]
    async fn test_patch() {
        let store = dag::Store::new(Box::new(MemStore::new()));

        struct Case<'a> {
            name: &'a str,
            patch: Vec<serde_json::Value>,
            exp_err: Option<&'a str>,
            // Note: the test inserts "key" => "value" into the map prior to
            // calling apply() so we can check if top-level removes work.
            exp_map: Option<HashMap<&'a str, &'a str>>,
        }
        let cases = [
            Case {
                name: "insert",
                patch: vec![json!({"op": "add", "path": "/foo", "value": "bar"})],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "foo" => "\"bar\"")),
            },
            Case {
                name: "remove",
                patch: vec![json!({"op": "remove", "path": "/key"})],
                exp_err: None,
                exp_map: Some(HashMap::new()),
            },
            Case {
                name: "replace",
                patch: vec![json!({"op": "replace", "path": "/key", "value": "newvalue"})],
                exp_err: None,
                exp_map: Some(map!("key" => "\"newvalue\"")),
            },
            Case {
                name: "insert empty key",
                patch: vec![json!({"op": "add", "path": "/", "value": "empty"})],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "" => "\"empty\"")),
            },
            Case {
                name: "insert/replace empty key",
                patch: vec![
                    json!({"op": "add", "path": "/", "value": "empty"}),
                    json!({"op": "replace", "path": "/", "value": "changed"}),
                ],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "" => "\"changed\"")),
            },
            Case {
                name: "insert/remove empty key",
                patch: vec![
                    json!({"op": "add", "path": "/", "value": "empty"}),
                    json!({"op": "remove", "path": "/"}),
                ],
                exp_err: None,
                exp_map: Some(map!("key" => "value")),
            },
            // Remove once all the other layers no longer depend on this.
            Case {
                name: "top-level remove",
                patch: vec![json!({"op": "replace", "path": "", "value": {}})],
                exp_err: None,
                exp_map: Some(HashMap::new()),
            },
            Case {
                name: "compound ops",
                patch: vec![
                    json!({"op": "add", "path": "/foo", "value": "bar"}),
                    json!({"op": "replace", "path": "/key", "value": "newvalue"}),
                    json!({"op": "add", "path": "/baz", "value": "baz"}),
                ],
                exp_err: None,
                exp_map: Some(map!("foo" => "\"bar\"",
                    "key" => "\"newvalue\"",
                    "baz" => "\"baz\"")),
            },
            Case {
                name: "escape 1",
                patch: vec![json!({"op": "add", "path": "/~1", "value": "bar"})],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "/" => "\"bar\"")),
            },
            Case {
                name: "escape 2",
                patch: vec![json!({"op": "add", "path": "/~0", "value": "bar"})],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "~" => "\"bar\"")),
            },
            Case {
                name: "invalid op",
                patch: vec![json!({"op": "BOOM", "path": "/key"})],
                exp_err: Some("InvalidOp"),
                exp_map: None,
            },
            Case {
                name: "invalid path",
                patch: vec![json!({"op": "add", "path": "BOOM", "value": true})],
                exp_err: Some("InvalidPath"),
                exp_map: None,
            },
        ];

        for c in cases.iter() {
            let mut chain: Chain = vec![];
            add_genesis(&mut chain, &store).await;
            let dag_write = store.write(LogContext::new()).await.unwrap();
            let mut db_write = db::Write::new_snapshot(
                db::Whence::Hash(chain[0].chunk().hash().to_string()),
                1,
                str!("cookie"),
                dag_write,
                db::read_indexes(&chain[0]),
            )
            .await
            .unwrap();
            db_write
                .put(
                    rlog::LogContext::new(),
                    "key".as_bytes().to_vec(),
                    "value".as_bytes().to_vec(),
                )
                .await
                .unwrap();
            let ops: Vec<Operation> = c
                .patch
                .clone()
                .into_iter()
                .map(|v| serde_json::from_value(v).unwrap())
                .collect();
            let result = apply(&mut db_write, &ops).await;
            match c.exp_err {
                Some(err_str) => assert!(to_debug(result.unwrap_err()).contains(err_str)),
                None => {
                    match c.exp_map.as_ref() {
                        None => panic!("expected a map"),
                        Some(map) => {
                            for (k, v) in map {
                                assert_eq!(
                                    Some(v.as_bytes()),
                                    db_write.as_read().get(k.as_bytes()),
                                    "{}",
                                    c.name
                                );
                            }
                            if map.len() == 0 {
                                assert!(!db_write.as_read().has("key".as_bytes()));
                            }
                        }
                    };
                }
            }
        }
    }
}
