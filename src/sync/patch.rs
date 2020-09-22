use crate::db;
use nanoserde::DeJson;
use std::default::Default;

const OP_ADD: &str = "add";
const OP_REMOVE: &str = "remove";
const OP_REPLACE: &str = "replace";

#[derive(Clone, Debug, Default, DeJson, PartialEq)]
pub struct Operation {
    pub op: String,
    pub path: String,
    #[nserde(rename = "valueString")]
    #[nserde(default)]
    pub value_string: String,
}

pub fn apply(db_write: &mut db::Write, patch: &[Operation]) -> Result<(), PatchError> {
    use PatchError::*;
    for op in patch.iter() {
        let mut chars = op.path.chars();
        if chars.next() != Some('/') {
            return Err(InvalidPath(op.path.clone()));
        }
        let key = json_pointer_unescape(chars.as_str()).as_bytes().to_vec();

        match op.op.as_str() {
            OP_ADD | OP_REPLACE => {
                let value = op.value_string.as_bytes().to_vec();
                db_write.put(key, value);
            }
            // Should we error if we try to remove a key that doesn't exist?
            OP_REMOVE => {
                if key.is_empty() {
                    // Top-level remove (path == "/").
                    db_write.clear();
                } else {
                    db_write.del(key);
                }
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
    InvalidOp(String),
    InvalidPath(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
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
            patch: Vec<&'a str>,
            exp_err: Option<&'a str>,
            // Note: the test inserts "key" => "value" into the map prior to
            // calling apply() so we can check if top-level removes work.
            exp_map: Option<HashMap<&'a str, &'a str>>,
            exp_checksum: Option<&'a str>,
        }
        let cases = [
            Case {
                name: "insert",
                patch: vec![r#"{"op":"add","path":"/foo","valueString":"\"bar\""}"#],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "foo" => "\"bar\"")),
                exp_checksum: None,
            },
            Case {
                name: "remove",
                patch: vec![r#"{"op":"remove","path":"/key"}"#],
                exp_err: None,
                exp_map: Some(HashMap::new()),
                exp_checksum: Some("00000000"),
            },
            Case {
                name: "replace",
                patch: vec![r#"{"op":"replace","path":"/key","valueString":"\"newvalue\""}"#],
                exp_err: None,
                exp_map: Some(map!("key" => "\"newvalue\"")),
                exp_checksum: None,
            },
            Case {
                name: "top-level remove",
                patch: vec![r#"{"op":"remove","path":"/"}"#],
                exp_err: None,
                exp_map: Some(HashMap::new()),
                exp_checksum: Some("00000000"),
            },
            Case {
                name: "compound ops",
                patch: vec![
                    r#"{"op":"add","path":"/foo","valueString":"\"bar\""}"#,
                    r#"{"op":"replace","path":"/key","valueString":"\"newvalue\""}"#,
                    r#"{"op":"add","path":"/baz","valueString":"\"baz\""}"#,
                ],
                exp_err: None,
                exp_map: Some(map!("foo" => "\"bar\"",
                    "key" => "\"newvalue\"",
                    "baz" => "\"baz\"")),
                exp_checksum: None,
            },
            Case {
                name: "escape 1",
                patch: vec![r#"{"op":"add","path":"/~1","valueString":"\"bar\""}"#],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "/" => "\"bar\"")),
                exp_checksum: None,
            },
            Case {
                name: "escape 2",
                patch: vec![r#"{"op":"add","path":"/~0","valueString":"\"bar\""}"#],
                exp_err: None,
                exp_map: Some(map!("key" => "value", "~" => "\"bar\"")),
                exp_checksum: None,
            },
            Case {
                name: "invalid op",
                patch: vec![r#"{"op":"BOOM","path":"/key"}"#],
                exp_err: Some("InvalidOp"),
                exp_map: None,
                exp_checksum: None,
            },
            Case {
                name: "invalid path",
                patch: vec![r#"{"op":"add","path":"BOOM", "stringValue": "true"}"#],
                exp_err: Some("InvalidPath"),
                exp_map: None,
                exp_checksum: None,
            },
            Case {
                name: "known checksum",
                patch: vec![
                    r#"{"op":"remove","path":"/"}"#,
                    r#"{"op":"add","path":"/new","valueString":"\"value\""}"#,
                ],
                exp_err: None,
                exp_map: Some(map!("new" => "\"value\"")),
                exp_checksum: Some("f9ef007b"),
            },
        ];

        for c in cases.iter() {
            let mut chain: Chain = vec![];
            add_genesis(&mut chain, &store).await;
            let dag_write = store.write(LogContext::new()).await.unwrap();
            let mut db_write = db::Write::new_snapshot(
                db::Whence::Hash(chain[0].chunk().hash().to_string()),
                1,
                str!("ssid"),
                dag_write,
            )
            .await
            .unwrap();
            db_write.put("key".as_bytes().to_vec(), "value".as_bytes().to_vec());
            let ops: Vec<Operation> = c
                .patch
                .iter()
                .map(|o| DeJson::deserialize_json(o).unwrap())
                .collect();
            let result = apply(&mut db_write, &ops);
            match c.exp_err {
                Some(err_str) => assert!(format!("{:?}", result.unwrap_err()).contains(err_str)),
                None => {
                    match c.exp_map.as_ref() {
                        None => panic!("expected a map"),
                        Some(map) => {
                            for (k, v) in map {
                                assert_eq!(
                                    v.as_bytes(),
                                    db_write.as_read().get(k.as_bytes()).unwrap(),
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
            if let Some(sum) = c.exp_checksum {
                assert_eq!(sum, db_write.checksum().as_str(), "{}", c.name);
            }
        }
    }
}
