#![allow(clippy::useless_let_if_seq)]

use super::leaf;
use super::leaf::Leaf;
use super::Entry;
use crate::dag;
use crate::dag::Read;
use crate::dag::Write;
use std::collections::btree_map::Iter as BTreeMapIter;
use std::collections::BTreeMap;
use std::iter::{Iterator, Peekable};

type Hash = String;

pub struct Map {
    base: Option<Leaf>,
    pending: BTreeMap<Vec<u8>, Option<Vec<u8>>>,
}

#[derive(Debug)]
pub enum LoadError {
    Storage(dag::Error),
    UnknownHash,
    CorruptChunk(leaf::LoadError),
}

impl From<dag::Error> for LoadError {
    fn from(e: dag::Error) -> Self {
        Self::Storage(e)
    }
}

impl From<leaf::LoadError> for LoadError {
    fn from(e: leaf::LoadError) -> Self {
        Self::CorruptChunk(e)
    }
}

#[derive(Debug)]
pub enum FlushError {
    Storage(dag::Error),
}

impl From<dag::Error> for FlushError {
    fn from(e: dag::Error) -> Self {
        Self::Storage(e)
    }
}

impl Map {
    pub fn new() -> Map {
        Map {
            base: None,
            pending: BTreeMap::new(),
        }
    }

    pub async fn load(hash: &str, read: &Read<'_>) -> Result<Map, LoadError> {
        let chunk = read.get_chunk(hash).await?;
        let chunk = chunk.ok_or(LoadError::UnknownHash)?;
        let base = Leaf::load(chunk)?;
        Ok(Map {
            base: base.into(),
            pending: BTreeMap::new(),
        })
    }

    // TODO: improve has and get to not scan entire base, but use binary search.
    pub fn has(&self, key: &[u8]) -> bool {
        self.iter().any(|e| e.key == key)
    }

    pub fn get(&self, key: &[u8]) -> Option<&[u8]> {
        self.iter().find(|e| e.key == key).map(|e| e.val)
    }

    pub fn put(&mut self, key: Vec<u8>, val: Vec<u8>) {
        self.pending.insert(key, Some(val));
    }

    #[allow(dead_code)]
    pub fn del(&mut self, key: Vec<u8>) {
        self.pending.insert(key, None);
    }

    pub fn iter(&self) -> impl Iterator<Item = Entry<'_>> {
        Iter {
            base: Leaf::iter(self.base.as_ref()).peekable(),
            pending: self.pending.iter().peekable(),
        }
    }

    pub async fn flush(&mut self, write: &mut Write<'_>) -> Result<Hash, FlushError> {
        // TODO: Consider locking during this
        let new_base = Leaf::new(self.iter());
        write.put_chunk(new_base.chunk()).await?;
        self.base = Some(new_base);
        self.pending.clear();
        Ok(self.base.as_ref().unwrap().chunk().hash().into())
    }
}

// Iter provides iteration over the map with pending changes applied.
pub struct Iter<'a, LeafIter: Iterator<Item = Entry<'a>>> {
    base: Peekable<LeafIter>,
    pending: Peekable<BTreeMapIter<'a, Vec<u8>, Option<Vec<u8>>>>,
}

impl<'a, LeafIter: Iterator<Item = Entry<'a>>> Iter<'a, LeafIter> {
    fn next_base(&mut self) -> Option<DeletableEntry<'a>> {
        self.base.next().map(|e| DeletableEntry {
            key: e.key,
            val: Some(e.val),
        })
    }

    fn next_pending(&mut self) -> Option<DeletableEntry<'a>> {
        self.pending.next().map(|(key, val)| DeletableEntry {
            key,
            val: val.as_ref().map(|v| v.as_slice()),
        })
    }

    fn next_internal(&mut self) -> Option<DeletableEntry<'a>> {
        let base_key = self.base.peek().map(|base_entry| base_entry.key);
        let pending_key = self
            .pending
            .peek()
            .map(|pending_entry| (*pending_entry).0.as_slice());

        match pending_key {
            None => self.next_base(),
            Some(pending_key) => match base_key {
                None => self.next_pending(),
                Some(base_key) => {
                    let mut r: Option<DeletableEntry<'a>> = None;
                    if base_key <= pending_key {
                        r = self.next_base();
                    }
                    if pending_key <= base_key {
                        r = self.next_pending();
                    }
                    r
                }
            },
        }
    }
}

impl<'a, LeafIter: Iterator<Item = Entry<'a>>> Iterator for Iter<'a, LeafIter> {
    type Item = Entry<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.next_internal() {
                None => return None,
                Some(DeletableEntry {
                    key,
                    val: Some(val),
                }) => return Some(Entry { key, val }),
                Some(DeletableEntry { key: _, val: None }) => (),
            }
        }
    }
}

#[derive(Ord, PartialOrd, Eq, PartialEq)]
pub struct DeletableEntry<'a> {
    pub key: &'a [u8],
    pub val: Option<&'a [u8]>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dag::Store;
    use crate::kv::memstore::MemStore;

    fn make_map(mut base: Option<Vec<&str>>, pending: Vec<&str>, deleted: Vec<&str>) -> Map {
        let entries = base.as_mut().map(|entries| {
            entries.sort();
            entries.iter().map(|s| Entry {
                key: s.as_bytes(),
                val: s.as_bytes(),
            })
        });
        let base = entries.map(|entries| Leaf::new(entries.into_iter()));
        let mut map = Map {
            base,
            pending: BTreeMap::new(),
        };
        for p in pending {
            let mut v = p.as_bytes().to_vec();
            // reverse data for edits so we can tell them apart.
            v.reverse();
            map.pending.insert(p.as_bytes().to_vec(), v.into());
        }
        for p in deleted {
            map.pending.insert(p.as_bytes().to_vec(), None);
        }
        map
    }

    #[test]
    fn has() {
        fn test(map: Map, test: &str, expected: bool) {
            let actual = map.has(test.as_bytes());
            assert_eq!(expected, actual);
        }

        test(make_map(None, vec![], vec![]), "foo", false);

        // basic base-only cases
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec![]),
            "foo",
            true,
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec![]),
            "baz",
            false,
        );

        // basic pending-only cases
        test(make_map(None, vec!["foo", "bar"], vec![]), "foo", true);
        test(make_map(None, vec!["foo", "bar"], vec![]), "baz", false);

        // basic+pending
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "foo",
            true,
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["foo", "bar"], vec![]),
            "bar",
            true,
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "baz",
            true,
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "qux",
            false,
        );

        // deletes
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec!["bar"]),
            "foo",
            true,
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec!["bar"]),
            "bar",
            false,
        );
        test(
            make_map(
                vec!["foo", "bar"].into(),
                vec![],
                // Should not be possible, but whatever
                vec!["baz"],
            ),
            "baz",
            false,
        );
    }

    #[test]
    fn get() {
        fn test(map: Map, test: &str, expected: Option<&str>) {
            let actual = map.get(test.as_bytes());
            assert_eq!(expected.map(|e| e.as_bytes()), actual);
        }

        // Empty
        test(make_map(None, vec![], vec![]), "foo", None);

        // Base-only
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec![]),
            "foo",
            "foo".into(),
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec![]),
            "baz",
            None,
        );

        // Pending-only
        test(
            make_map(None, vec!["foo", "bar"], vec![]),
            "foo",
            "oof".into(),
        );
        test(make_map(None, vec!["foo", "bar"], vec![]), "baz", None);

        // basic+pending
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "foo",
            "foo".into(),
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["foo", "bar"], vec![]),
            "bar",
            "rab".into(),
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "baz",
            "zab".into(),
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec!["baz"], vec![]),
            "qux",
            None,
        );

        // deletes
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec!["bar"]),
            "foo",
            "foo".into(),
        );
        test(
            make_map(vec!["foo", "bar"].into(), vec![], vec!["bar"]),
            "bar",
            None,
        );
        test(
            make_map(
                vec!["foo", "bar"].into(),
                vec![],
                // Should not be possible, but whatever
                vec!["baz"],
            ),
            "baz",
            None,
        );
    }

    #[test]
    fn put() {
        fn test(
            base: Option<Vec<&str>>,
            pending: Vec<&str>,
            deleted: Vec<&str>,
            put: &str,
            expected: Option<&str>,
        ) {
            let mut map = make_map(base, pending, deleted);
            map.put(put.as_bytes().to_vec(), "x".as_bytes().to_vec());
            let actual = map.get(put.as_bytes());
            assert_eq!(expected.map(|e| e.as_bytes()), actual);
        }

        // Empty
        test(None, vec![], vec![], "", "x".into());
        test(None, vec![], vec![], "foo", "x".into());

        // Base only
        test(vec![].into(), vec![], vec![], "foo", "x".into());
        test(vec!["foo"].into(), vec![], vec![], "foo", "x".into());

        // Base+pending
        test(vec!["foo"].into(), vec!["foo"], vec![], "foo", "x".into());

        // Base+pending+deletes
        test(
            vec!["foo"].into(),
            vec!["foo"],
            vec!["foo"],
            "foo",
            "x".into(),
        );
    }

    #[test]
    fn del() {
        fn test(base: Option<Vec<&str>>, pending: Vec<&str>, deleted: Vec<&str>, del: &str) {
            let mut map = make_map(base, pending, deleted);
            map.del(del.as_bytes().to_vec());
            let has = map.has(del.as_bytes());
            assert!(!has);
        }

        // Empty
        test(None, vec![], vec![], "");
        test(None, vec![], vec![], "foo");

        // Base only
        test(vec![].into(), vec![], vec![], "foo");
        test(vec!["foo"].into(), vec![], vec![], "foo");

        // Base+pending
        test(vec!["foo"].into(), vec!["foo"], vec![], "foo");

        // Base+pending+deletes
        test(vec!["foo"].into(), vec!["bar"], vec!["baz"], "foo");
        test(vec!["foo"].into(), vec!["foo"], vec!["foo"], "foo");
    }

    #[async_std::test]
    async fn iter_flush() {
        async fn test(
            base: Option<Vec<&str>>,
            pending: Vec<&str>,
            deleted: Vec<&str>,
            expected: Vec<&str>,
        ) {
            let mut map = make_map(base, pending, deleted);
            let expected = expected
                .into_iter()
                .map(|e| e.as_bytes())
                .collect::<Vec<&[u8]>>();

            fn test(map: &Map, expected: &Vec<&[u8]>) {
                let actual = map.iter().map(|item| item.key).collect::<Vec<&[u8]>>();
                assert_eq!(expected, &actual);
            }

            test(&map, &expected);

            let kv = MemStore::new();
            let store = Store::new(Box::new(kv));
            let mut write = store.write().await.unwrap();
            let hash = map.flush(&mut write).await.unwrap();

            // Original map should still have same data.
            test(&map, &expected);

            // The hash should yield a new map with same data
            write.commit().await.unwrap();
            let read = store.read().await.unwrap();
            let map2 = Map::load(&hash, &read.read()).await.unwrap();
            test(&map2, &expected);
        }

        // Empty
        test(None, vec![], vec![], vec![]).await;

        // Base-only
        test(vec![].into(), vec![], vec![], vec![]).await;
        test(vec![""].into(), vec![], vec![], vec![""]).await;
        test(vec!["", "foo"].into(), vec![], vec![], vec!["", "foo"]).await;

        // Pending-only
        test(None, vec![""], vec![], vec![""]).await;
        test(None, vec!["", "foo"], vec![], vec!["", "foo"]).await;

        // basic+pending
        test(
            vec!["", "foo"].into(),
            vec!["bar", "foo"],
            vec![],
            vec!["", "bar", "foo"],
        )
        .await;
        test(vec![""].into(), vec!["", "bar"], vec![], vec!["", "bar"]).await;
        test(
            vec!["a", "b"].into(),
            vec!["c", "d"],
            vec![],
            vec!["a", "b", "c", "d"],
        )
        .await;
        test(
            vec!["c", "d"].into(),
            vec!["a", "b"],
            vec![],
            vec!["a", "b", "c", "d"],
        )
        .await;
        test(
            vec!["b", "d"].into(),
            vec!["a", "c"],
            vec![],
            vec!["a", "b", "c", "d"],
        )
        .await;

        // deletes
        test(vec![].into(), vec![], vec![""], vec![]).await;
        test(vec![].into(), vec![], vec!["a"], vec![]).await;
        test(vec!["a"].into(), vec![], vec!["a"], vec![]).await;
        test(vec!["a", "b"].into(), vec![], vec!["a"], vec!["b"]).await;
        test(
            vec!["a", "b"].into(),
            vec!["c", "d"],
            vec!["a", "c"],
            vec!["b", "d"],
        )
        .await;
    }
}
