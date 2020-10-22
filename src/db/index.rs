use super::commit;
use crate::dag;
use crate::prolly;
use async_std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug)]
pub struct Index {
    pub meta: commit::IndexMeta,
    map: RwLock<Option<prolly::Map>>,
}

impl Index {
    pub fn new(meta: commit::IndexMeta, map: Option<prolly::Map>) -> Index {
        Index {
            meta,
            map: RwLock::new(map),
        }
    }
    pub async fn get_map_mut(
        &self,
        read: &dag::Read<'_>,
    ) -> Result<MapWriteGuard<'_>, GetMapError> {
        use GetMapError::*;
        let mut guard = self.map.write().await;
        if (*guard).is_none() {
            *guard = Some(
                prolly::Map::load(&self.meta.value_hash, read)
                    .await
                    .map_err(MapLoadError)?,
            );
        }
        Ok(MapWriteGuard { guard })
    }

    #[allow(dead_code)]
    pub async fn get_map(&self, read: &dag::Read<'_>) -> Result<MapReadGuard<'_>, GetMapError> {
        self.get_map_mut(read).await?;
        Ok(MapReadGuard {
            guard: self.map.read().await,
        })
    }

    // Note: does not update self.meta.value_hash (doesn't need to at this point as flush
    // is only called during commit.)
    pub async fn flush(&self, write: &mut dag::Write<'_>) -> Result<String, IndexFlushError> {
        use IndexFlushError::*;
        let mut guard = self.map.write().await;
        match &mut *guard {
            Some(m) => m.flush(write).await.map_err(MapFlushError),
            None => Ok(self.meta.value_hash.clone()),
        }
    }
}

pub struct MapReadGuard<'a> {
    pub guard: RwLockReadGuard<'a, Option<prolly::Map>>,
}

impl<'a> MapReadGuard<'a> {
    // Seems like this could just be DeRef.
    #[allow(dead_code)]
    pub fn get_map(&'a self) -> &'a prolly::Map {
        self.guard.as_ref().unwrap()
    }
}

pub struct MapWriteGuard<'a> {
    pub guard: RwLockWriteGuard<'a, Option<prolly::Map>>,
}

impl<'a> MapWriteGuard<'a> {
    // TODO: This method does not work. Call site says that guard is destroyed too early.
    #[allow(dead_code)]
    pub fn get_map(&'a mut self) -> &'a mut prolly::Map {
        self.guard.as_mut().unwrap()
    }
}

#[derive(Debug)]
pub enum GetMapError {
    MapLoadError(prolly::LoadError),
}

#[derive(Debug)]
pub enum IndexFlushError {
    MapFlushError(prolly::FlushError),
}

// We only index strings for now.
#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub enum IndexValue<'a> {
    Str(&'a str),
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct IndexKey<'a> {
    pub secondary: IndexValue<'a>,
    pub primary: &'a [u8],
}

#[allow(dead_code)]
#[derive(Copy, Clone)]
pub enum IndexOperation {
    Add,
    Remove,
}

#[derive(Debug, PartialEq)]
pub enum IndexValueError {
    GetIndexEntriesError(GetIndexEntriesError),
}

// Index or de-index a single primary entry.
pub fn index_value(
    index: &mut prolly::Map,
    op: IndexOperation,
    key: &[u8],
    val: &[u8],
    json_pointer: &str,
) -> Result<(), IndexValueError> {
    use IndexValueError::*;
    for entry in get_index_entries(key, val, json_pointer).map_err(GetIndexEntriesError)? {
        match &op {
            IndexOperation::Add => index.put(entry, val.to_vec()),
            IndexOperation::Remove => index.del(entry),
        }
    }
    Ok(())
}

#[derive(Debug, PartialEq)]
pub enum GetIndexEntriesError {
    ConvertNumberError,
    DeserializeError(String),
    SerializeIndexEntryError(String),
    UnsupportedTargetType,
}

// Gets the set of secondary index entries for a given primary key/value pair.
fn get_index_entries(
    key: &[u8],
    val: &[u8],
    json_pointer: &str,
) -> Result<Vec<Vec<u8>>, GetIndexEntriesError> {
    use GetIndexEntriesError::*;
    // TODO: It's crazy to decode the entire value just to evaluate the json pointer.
    // There should be some way to shortcut this. Halp @arv.
    let value: Value = serde_json::from_slice(val).map_err(|e| DeserializeError(e.to_string()))?;
    let target = value.pointer(json_pointer);

    fn entry(secondary: IndexValue, primary: &[u8]) -> Result<Vec<u8>, GetIndexEntriesError> {
        let key = IndexKey { secondary, primary };
        Ok(bytekey::serialize(&key).map_err(|e| SerializeIndexEntryError(e.to_string()))?)
    }

    if target.is_none() {
        return Ok(vec![]);
    }

    let target = target.unwrap();
    Ok(vec![match target {
        // TODO: Support array of strings here.
        Value::String(v) => entry(IndexValue::Str(&v), key)?,
        _ => return Err(UnsupportedTargetType),
    }])
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn index_key_sort() {
        fn test(k1: IndexKey, k2: IndexKey) {
            assert!(bytekey::serialize(&k1).unwrap() < bytekey::serialize(&k2).unwrap());
        }

        pub fn key<'a>(secondary: IndexValue<'a>, primary: &'a [u8]) -> IndexKey<'a> {
            IndexKey { secondary, primary }
        }

        // String secondary value
        test(
            key(IndexValue::Str(""), &[]),
            key(IndexValue::Str(""), &[0x00]),
        );
        test(
            key(IndexValue::Str(""), &[0x00]),
            key(IndexValue::Str("a"), &[]),
        );
        test(
            key(IndexValue::Str("a"), &[0x00]),
            key(IndexValue::Str("aa"), &[]),
        );
        test(
            key(IndexValue::Str("A"), &[]),
            key(IndexValue::Str("a"), &[]),
        );
        test(
            key(IndexValue::Str("foo"), &[]),
            key(IndexValue::Str("foobar"), &[]),
        );
        test(
            key(IndexValue::Str("😀"), &[]),
            key(IndexValue::Str("😜"), &[]),
        );
        test(
            // strings are variable length, this tests that:
            // "a",0xFF is sorted before "aa",0x00
            key(IndexValue::Str("a"), &[0xFF]),
            key(IndexValue::Str("aa"), &[0x00]),
        );
    }

    #[test]
    fn get_index_entries() {
        use GetIndexEntriesError::*;
        fn test(
            key: &str,
            input: &[u8],
            json_pointer: &str,
            expected: Result<Vec<IndexKey>, GetIndexEntriesError>,
        ) {
            assert_eq!(
                super::get_index_entries(key.as_bytes(), input, json_pointer),
                expected.map(|v| v
                    .iter()
                    .map(|k| bytekey::serialize(k).unwrap())
                    .collect::<Vec<Vec<u8>>>())
            );
        }

        // invalid json
        test(
            "k",
            &[] as &[u8],
            "/",
            Err(DeserializeError(
                "EOF while parsing a value at line 1 column 0".to_string(),
            )),
        );
        // no matching target
        test("k", "{}".as_bytes(), "/foo", Ok(vec![]));

        // unsupported target types
        test(
            "k",
            &serde_json::to_vec(&json!({"unsupported": []})).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );
        test(
            "k",
            &serde_json::to_vec(&json!({"unsupported": {}})).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );
        test(
            "k",
            &serde_json::to_vec(&json!({ "unsupported": null })).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );
        test(
            "k",
            &serde_json::to_vec(&json!({ "unsupported": true })).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );
        test(
            "k",
            &serde_json::to_vec(&json!({ "unsupported": 42 })).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );

        test(
            "k",
            &serde_json::to_vec(&json!({ "unsupported": 88.8 })).unwrap(),
            "/unsupported",
            Err(UnsupportedTargetType),
        );

        // success
        test(
            "foo",
            &serde_json::to_vec(&json!({"foo":"bar"})).unwrap(),
            "/foo",
            Ok(vec![IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: "foo".as_bytes(),
            }]),
        );
        test(
            "foo",
            &serde_json::to_vec(&json!({"foo":{"bar":["hot", "dog"]}})).unwrap(),
            "/foo/bar/1",
            Ok(vec![IndexKey {
                secondary: IndexValue::Str("dog"),
                primary: "foo".as_bytes(),
            }]),
        );
        test(
            "",
            &serde_json::to_vec(&json!({"foo":"bar"})).unwrap(),
            "/foo",
            Ok(vec![IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: "".as_bytes(),
            }]),
        );
        test(
            "/! ",
            &serde_json::to_vec(&json!({"foo":"bar"})).unwrap(),
            "/foo",
            Ok(vec![IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: "/! ".as_bytes(),
            }]),
        );
    }

    #[test]
    fn index_value() {
        fn test(
            key: &str,
            value: &[u8],
            json_pointer: &str,
            op: IndexOperation,
            expected: Result<Vec<u32>, IndexValueError>,
        ) {
            let mut index = prolly::Map::new();
            index.put(
                bytekey::serialize(&IndexKey {
                    secondary: IndexValue::Str("s1"),
                    primary: "1".as_bytes(),
                })
                .unwrap(),
                "v1".as_bytes().to_vec(),
            );
            index.put(
                bytekey::serialize(&IndexKey {
                    secondary: IndexValue::Str("s2"),
                    primary: "2".as_bytes(),
                })
                .unwrap(),
                "v2".as_bytes().to_vec(),
            );

            let res = super::index_value(&mut index, op, key.as_bytes(), value, json_pointer);
            match expected {
                Err(expected_err) => assert_eq!(expected_err, res.unwrap_err()),
                Ok(expected_val) => {
                    let actual_val = index.iter().collect::<Vec<prolly::Entry>>();
                    assert_eq!(expected_val.len(), actual_val.len());
                    for (exp_id, act) in expected_val.iter().zip(actual_val) {
                        let exp_entry = bytekey::serialize(&IndexKey {
                            secondary: IndexValue::Str(format!("s{}", exp_id).as_str()),
                            primary: format!("{}", exp_id).as_bytes(),
                        })
                        .unwrap();
                        assert_eq!(exp_entry, act.key.to_vec());
                        assert_eq!(index.get(exp_entry.as_ref()).unwrap(), act.val);
                    }
                }
            }
        }

        test(
            "3",
            json!({"s": "s3", "v": "v3"}).to_string().as_bytes(),
            "/s",
            IndexOperation::Add,
            Ok(vec![1, 2, 3]),
        );
        test(
            "1",
            json!({"s": "s1", "v": "v1"}).to_string().as_bytes(),
            "/s",
            IndexOperation::Remove,
            Ok(vec![2]),
        );
    }
}
