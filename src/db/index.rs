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

// IndexValue describes the type of the secondary index value. If we add
// additional index types this enum enables us to discriminate between them:
// it ensures all values of a given type sort together.
//
// IMPORTANT: We ___MUST NOT___ re-order this enum, insert new values into the
// middle, or change the definition of a value. If we change the definition then
// we change the serialization of the enum and thus the serialized IndexKey.
// We can safely add new values at the end of the enum.
// https://github.com/danburkert/bytekey#type-evolution
#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub enum IndexValue<'a> {
    Str(&'a str),
    // Don't touch values above this line (see comment above).
}

// IndexKey is the key used in the index prolly map for indexed values. It
// is serialized using the bytekey crate which ensures proper sort order
// for the struct. bytekey serializes strings in their natural UTF8 encoding
// followed by a 0 byte which ensures that all shorter strings sort before
// longer strings. (Null bytes are prohibited in indexed string values.)
//
// IMPORTANT: Changing this definition potentially changes index keys, making
// existing index keys unusable. If we want to change the format, might be
// a better idea to instead add a new IndexKeyType.
#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct IndexKey<'a> {
    pub secondary: IndexValue<'a>,
    pub primary: &'a [u8],
}

// IndexKeyType describes the format of the index key, enabling us to change
// index key types in the future, per suggestion:
// https://github.com/danburkert/bytekey/blob/master/README.md#type-evolution
//
// We MUST NOT change existing enum values. See comment on IndexValue.
#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub enum IndexKeyType<'a> {
    #[serde(borrow)]
    V0(IndexKey<'a>),
    // Don't touch values above this line (see comment).
}

#[allow(dead_code)]
#[derive(Copy, Clone)]
pub enum IndexOperation {
    Add,
    Remove,
}

#[derive(Debug, PartialEq)]
pub enum IndexValueError {
    GetIndexKeysError(GetIndexKeysError),
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
    for entry in get_index_keys(key, val, json_pointer).map_err(GetIndexKeysError)? {
        match &op {
            IndexOperation::Add => index.put(entry, val.to_vec()),
            IndexOperation::Remove => index.del(entry),
        }
    }
    Ok(())
}

#[derive(Debug, PartialEq)]
pub enum GetIndexKeysError {
    DeserializeError(String),
    SerializeIndexEntryError(String),
    StringContainsNull(String),
    UnsupportedTargetType,
}

// Gets the set of secondary index keys for a given primary key/value pair.
fn get_index_keys(
    key: &[u8],
    val: &[u8],
    json_pointer: &str,
) -> Result<Vec<Vec<u8>>, GetIndexKeysError> {
    use GetIndexKeysError::*;
    // TODO: It's crazy to decode the entire value just to evaluate the json pointer.
    // There should be some way to shortcut this. Halp @arv.
    let value: Value = serde_json::from_slice(val).map_err(|e| DeserializeError(e.to_string()))?;
    let target = value.pointer(json_pointer);
    if target.is_none() {
        return Ok(vec![]);
    }

    let target = target.unwrap();
    Ok(vec![match target {
        // TODO: Support array of strings here.
        // TODO: when we support arrays, add test to ensure that strings with null are skipped.
        Value::String(v) => {
            if v.contains('\0') {
                return Err(StringContainsNull(v.clone()));
            }
            index_key(IndexValue::Str(&v), key)?
        }
        _ => return Err(UnsupportedTargetType),
    }])
}

// Returns the index key (index prolly map key) for an indexed value.
pub fn index_key(secondary: IndexValue, primary: &[u8]) -> Result<Vec<u8>, GetIndexKeysError> {
    use GetIndexKeysError::*;

    let k = IndexKeyType::V0(IndexKey { secondary, primary });
    Ok(bytekey::serialize(&k).map_err(|e| SerializeIndexEntryError(e.to_string()))?)
}

// Returns bytes that can be used to scan for the given secondary index value. These bytes
// are different from the full index key bytes in that we do *not* want the trailing null
// byte that bytekey appends to the secondary index value ("key\0" is not a prefix of "keyfoo").
pub fn scan_key(secondary: &str) -> Result<Vec<u8>, GetIndexKeysError> {
    let mut k = index_key(IndexValue::Str(secondary), &[])?;
    k.truncate(k.len() - 1);
    Ok(k)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use str_macro::str;

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

    // By design the index key is encoded in a way that doesn't permit collisions, eg
    // a situation where scan({indexName: "...", ...prefix="foo"}) matches a value
    // with secondary index "f" and primary index "oo". This test gives us a tiny
    // extra assurance that this is the case.
    #[test]
    fn test_index_key_uniqueness() {
        fn test(left: (&str, &[u8]), right: (&str, &[u8])) {
            assert_ne!(
                index_key(IndexValue::Str(left.0), left.1,).unwrap(),
                index_key(IndexValue::Str(right.0), right.1,).unwrap()
            );
        }

        test(("", &[0x61]), ("a", &[]));
    }

    // We rely on bytekey appending null to the secondary index value.
    #[test]
    fn test_index_key_null_pads_strings() {
        let index_key_bytes = index_key(IndexValue::Str("foo"), &vec![0xAB]).unwrap();
        let expected_rh = vec![
            0x66u8, /*f*/
            0x6F,   /*o*/
            0x6F,   /*o*/
            0x00, 0xAB,
        ];
        // We don't care what goop bytekey puts at the beginning, so we compare against the end of the vec.
        assert_eq!(
            expected_rh[..],
            index_key_bytes[(index_key_bytes.len() - expected_rh.len())..]
        );

        let scan_key_bytes = scan_key("foo").unwrap();
        assert_eq!(
            expected_rh[..3],
            scan_key_bytes[(scan_key_bytes.len() - 3)..]
        );
    }

    #[test]
    fn test_get_index_keys() {
        use GetIndexKeysError::*;
        fn test(
            key: &str,
            input: &[u8],
            json_pointer: &str,
            expected: Result<Vec<IndexKeyType>, GetIndexKeysError>,
        ) {
            assert_eq!(
                super::get_index_keys(key.as_bytes(), input, json_pointer),
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
        test("k", b"{}", "/foo", Ok(vec![]));

        // null is disallowed in strings
        test(
            "k",
            &serde_json::to_vec(&json!("no \0 allowed")).unwrap(),
            "",
            Err(StringContainsNull(str!("no \0 allowed"))),
        );

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
            Ok(vec![IndexKeyType::V0(IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: b"foo",
            })]),
        );
        test(
            "foo",
            &serde_json::to_vec(&json!({"foo":{"bar":["hot", "dog"]}})).unwrap(),
            "/foo/bar/1",
            Ok(vec![IndexKeyType::V0(IndexKey {
                secondary: IndexValue::Str("dog"),
                primary: b"foo",
            })]),
        );
        test(
            "",
            &serde_json::to_vec(&json!({"foo":"bar"})).unwrap(),
            "/foo",
            Ok(vec![IndexKeyType::V0(IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: b"",
            })]),
        );
        test(
            "/! ",
            &serde_json::to_vec(&json!({"foo":"bar"})).unwrap(),
            "/foo",
            Ok(vec![IndexKeyType::V0(IndexKey {
                secondary: IndexValue::Str("bar"),
                primary: b"/! ",
            })]),
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
                bytekey::serialize(&IndexKeyType::V0(IndexKey {
                    secondary: IndexValue::Str("s1"),
                    primary: b"1",
                }))
                .unwrap(),
                b"v1".to_vec(),
            );
            index.put(
                bytekey::serialize(&IndexKeyType::V0(IndexKey {
                    secondary: IndexValue::Str("s2"),
                    primary: b"2",
                }))
                .unwrap(),
                b"v2".to_vec(),
            );

            let res = super::index_value(&mut index, op, key.as_bytes(), value, json_pointer);
            match expected {
                Err(expected_err) => assert_eq!(expected_err, res.unwrap_err()),
                Ok(expected_val) => {
                    let actual_val = index.iter().collect::<Vec<prolly::Entry>>();
                    assert_eq!(expected_val.len(), actual_val.len());
                    for (exp_id, act) in expected_val.iter().zip(actual_val) {
                        let exp_entry = bytekey::serialize(&IndexKeyType::V0(IndexKey {
                            secondary: IndexValue::Str(format!("s{}", exp_id).as_str()),
                            primary: format!("{}", exp_id).as_bytes(),
                        }))
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
