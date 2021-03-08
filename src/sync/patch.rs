use crate::db;
use crate::util::rlog;
use serde::Deserialize;

#[derive(Deserialize)]
#[cfg_attr(test, derive(Clone, Debug, PartialEq))]
#[serde(tag = "op")]
pub enum Operation {
    #[serde(rename = "put")]
    Put {
        key: String,
        value: serde_json::Value,
    },
    #[serde(rename = "del")]
    Del { key: String },
    #[serde(rename = "clear")]
    Clear,
}

pub async fn apply(db_write: &mut db::Write<'_>, patch: &[Operation]) -> Result<(), PatchError> {
    use PatchError::*;
    for op in patch.iter() {
        match op {
            Operation::Put { key, value } => {
                let key = key.as_bytes().to_vec();
                let value = serde_json::to_vec(value).map_err(InvalidValue)?;
                db_write
                    .put(rlog::LogContext::new(), key, value)
                    .await
                    .map_err(PutError)?;
            }
            Operation::Del { key } => {
                // Note it is not an error to del a key that does not exist.
                let key = key.as_bytes().to_vec();
                db_write
                    .del(rlog::LogContext::new(), key)
                    .await
                    .map_err(DelError)?;
            }
            Operation::Clear => {
                db_write.clear().await.map_err(ClearError)?;
            }
        }
    }
    Ok(())
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
    use serde_json::json;
    use std::collections::HashMap;

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
            patch: serde_json::Value,
            exp_err: Option<&'a str>,
            // Note: the test inserts "key" => "value" into the map prior to
            // calling apply() so we can check if top-level removes work.
            exp_map: Option<HashMap<&'a str, &'a str>>,
        }
        let cases = [
            Case {
                name: "put",
                patch: json!([{"op": "put", "key": "foo", "value": "bar"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "foo" => "\"bar\"")),
            },
            Case {
                name: "del",
                patch: json!([{"op": "del", "key": "key"}]),
                exp_err: None,
                exp_map: Some(HashMap::new()),
            },
            Case {
                name: "replace",
                patch: json!([{"op": "put", "key": "key", "value": "newvalue"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "\"newvalue\"")),
            },
            Case {
                name: "put empty key",
                patch: json!([{"op": "put", "key": "", "value": "empty"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "" => "\"empty\"")),
            },
            Case {
                name: "put/replace empty key",
                patch: json!([
                    {"op": "put", "key": "", "value": "empty"},
                    {"op": "put", "key": "", "value": "changed"}
                ]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "" => "\"changed\"")),
            },
            Case {
                name: "put/remove empty key",
                patch: json!([
                    {"op": "put", "key": "", "value": "empty"},
                    {"op": "del", "key": ""}
                ]),
                exp_err: None,
                exp_map: Some(map!("key" => "value")),
            },
            Case {
                name: "top-level clear",
                patch: json!([{"op": "clear"}]),
                exp_err: None,
                exp_map: Some(HashMap::new()),
            },
            Case {
                name: "compound ops",
                patch: json!([
                    {"op": "put", "key": "foo", "value": "bar"},
                    {"op": "put", "key": "key", "value": "newvalue"},
                    {"op": "put", "key": "baz", "value": "baz"}
                ]),
                exp_err: None,
                exp_map: Some(map!("foo" => "\"bar\"",
                    "key" => "\"newvalue\"",
                    "baz" => "\"baz\"")),
            },
            Case {
                name: "no escaping 1",
                patch: json!([{"op": "put", "key": "~1", "value": "bar"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "~1" => "\"bar\"")),
            },
            Case {
                name: "no escaping 2",
                patch: json!([{"op": "put", "key": "~0", "value": "bar"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "~0" => "\"bar\"")),
            },
            Case {
                name: "no escaping 3",
                patch: json!([{"op": "put", "key": "/", "value": "bar"}]),
                exp_err: None,
                exp_map: Some(map!("key" => "value", "/" => "\"bar\"")),
            },
            Case {
                name: "invalid op",
                patch: json!([{"op": "BOOM", "key": "key"}]),
                exp_err: Some("unknown variant `BOOM`, expected one of `put`, `del`, `clear`"),
                exp_map: None,
            },
            Case {
                name: "invalid key",
                patch: json!([{"op": "put", "key": 42, "value": true}]),
                exp_err: Some("invalid type: integer `42`, expected a string"),
                exp_map: None,
            },
            Case {
                name: "missing value",
                patch: json!([{"op": "put", "key": "k"}]),
                exp_err: Some("missing field `value`"),
                exp_map: None,
            },
            Case {
                name: "missing key for del",
                patch: json!([{"op": "del"}]),
                exp_err: Some("missing field `key`"),
                exp_map: None,
            },
            Case {
                name: "make sure we do not apply parts of the patch",
                patch: json!([{"op": "put", "key": "k", "value": 42}, {"op": "del"}]),
                exp_err: Some("missing field `key`"),
                exp_map: Some(map!("key" => "value")),
            },
        ];

        for c in cases.iter() {
            let mut chain: Chain = vec![];
            add_genesis(&mut chain, &store).await;
            let dag_write = store.write(LogContext::new()).await.unwrap();
            let mut db_write = db::Write::new_snapshot(
                db::Whence::Hash(chain[0].chunk().hash().to_string()),
                1,
                json!("cookie"),
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

            let ops = serde_json::from_value::<Vec<Operation>>(c.patch.clone());
            match ops {
                Err(e) => {
                    // JSON error
                    assert!(c.exp_err.is_some(), "Expected an error for {}", c.name);
                    assert!(to_debug(e).contains(c.exp_err.unwrap()), "{}", c.name);
                }
                Ok(ops) => {
                    let result = apply(&mut db_write, &ops).await;
                    if let Some(err_str) = c.exp_err {
                        assert!(to_debug(result.unwrap_err()).contains(err_str));
                    }
                }
            }

            if let Some(map) = c.exp_map.as_ref() {
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
        }
    }
}
