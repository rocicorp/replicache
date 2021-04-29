#![allow(clippy::useless_let_if_seq)]

use super::leaf;
use super::leaf::Leaf;
use super::Entry;
use crate::dag;
use crate::dag::Read;
use crate::dag::Write;
use std::collections::BTreeMap;
use std::iter::{Iterator, Peekable};
use std::{cmp::Ordering, string::FromUtf8Error};
use std::{collections::btree_map::Iter as BTreeMapIter, fmt::Debug};

type Hash = String;

pub struct Map {
    base: Option<Leaf>,
    pending: BTreeMap<Vec<u8>, Option<Vec<u8>>>,
}

#[derive(Debug, PartialEq)]
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

#[derive(Debug, PartialEq)]
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

    pub fn has(&self, key: &[u8]) -> bool {
        if let Some(p) = self.pending.get(key) {
            // if None the key was deleted.
            return p.is_some();
        }

        self.base_has(key)
    }

    fn base_has(&self, key: &[u8]) -> bool {
        match &self.base {
            None => false,
            Some(leaf) => leaf.binary_search(key).is_ok(),
        }
    }

    pub fn get(&self, key: &[u8]) -> Option<&[u8]> {
        if let Some(p) = self.pending.get(key) {
            // if None the key was deleted.
            return p.as_ref().map(Vec::as_slice);
        }

        self.base_get(key)
    }

    fn base_get(&self, key: &[u8]) -> Option<&[u8]> {
        match &self.base {
            None => None,
            Some(leaf) => match leaf.binary_search(key) {
                Ok(idx) => leaf.get_entry_by_index(idx).val(),
                Err(_) => None,
            },
        }
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

    // Returns the diff between the pending entries and the already flushed entries.
    pub fn pending_changed_keys(&self) -> Result<Vec<String>, FromUtf8Error> {
        let mut keys = Vec::with_capacity(self.pending.len());
        for (key, pending_val) in self.pending.iter() {
            match pending_val {
                Some(pending_val) => match self.base_get(key) {
                    Some(base_val) => {
                        if pending_val != base_val {
                            keys.push(String::from_utf8(key.clone())?);
                        }
                    }
                    None => {
                        keys.push(String::from_utf8(key.clone())?);
                    }
                },
                None => {
                    if self.base_has(key) {
                        keys.push(String::from_utf8(key.clone())?);
                    }
                }
            }
        }
        Ok(keys)
    }

    /// Returns the keys that are different between two maps.
    pub fn changed_keys<'a>(a: &'a Self, b: &'a Self) -> Result<Vec<String>, FromUtf8Error> {
        let mut it_a = a.iter();
        let mut it_b = b.iter();
        let mut keys = vec![];

        let mut a = it_a.next();
        let mut b = it_b.next();
        loop {
            match (a, b) {
                (None, None) => break,
                (None, Some(b_entry)) => {
                    keys.push(String::from_utf8(b_entry.key.to_vec())?);
                    b = it_b.next();
                }
                (Some(a_entry), None) => {
                    keys.push(String::from_utf8(a_entry.key.to_vec())?);
                    a = it_a.next();
                }
                (Some(a_entry), Some(b_entry)) => {
                    let ord = a_entry.key.cmp(b_entry.key);
                    match ord {
                        Ordering::Less => {
                            keys.push(String::from_utf8(a_entry.key.to_vec())?);
                            a = it_a.next();
                        }
                        Ordering::Equal => {
                            if a_entry.val != b_entry.val {
                                keys.push(String::from_utf8(a_entry.key.to_vec())?);
                            }
                            a = it_a.next();
                            b = it_b.next();
                        }
                        Ordering::Greater => {
                            keys.push(String::from_utf8(b_entry.key.to_vec())?);
                            b = it_b.next();
                        }
                    };
                }
            }
        }
        Ok(keys)
    }
}

impl Default for Map {
    fn default() -> Self {
        Self::new()
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
            val: val.as_ref().map(Vec::as_slice),
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

impl Debug for Map {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Map(baselen: {}, {} pending changes)",
            self.base.as_ref().map(|m| m.len()).unwrap_or(0),
            self.pending.len()
        )
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
    use crate::util::rlog::LogContext;
    use str_macro::str;

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
            let mut write = store.write(LogContext::new()).await.unwrap();
            let hash = map.flush(&mut write).await.unwrap();

            // Original map should still have same data.
            test(&map, &expected);

            write.set_head("iter_flush", Some(&hash)).await.unwrap();

            // The hash should yield a new map with same data
            write.commit().await.unwrap();
            let read = store.read(LogContext::new()).await.unwrap();
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

    macro_rules! prolly_map(
        () => (
            Map {
                base: None,
                pending: ::std::collections::BTreeMap::new(),
            }
        );
        { $($key:expr => $value:expr),+ } => {
            {
                let mut pending = ::std::collections::BTreeMap::new();
                $(
                    pending.insert($key.as_bytes().to_vec(), Some($value.as_bytes().to_vec()));
                )+
                Map {
                    base: None,
                    pending,
                }
            }
         };
    );

    #[test]
    fn changed_keys() {
        fn test(old: &Map, new: &Map, mut expected: Vec<&str>) {
            expected.sort();
            let actual = Map::changed_keys(old, new).unwrap();
            assert_eq!(
                expected.iter().map(|e| e.to_string()).collect::<Vec<_>>(),
                actual
            );
            let actual = Map::changed_keys(new, old).unwrap();
            assert_eq!(
                expected.iter().map(|e| e.to_string()).collect::<Vec<_>>(),
                actual
            );
        }

        test(&prolly_map! {}, &prolly_map! {}, vec![]);
        test(&prolly_map! {"a" => "b"}, &prolly_map! {"a" => "b"}, vec![]);

        test(
            &prolly_map! {"a" => "a"},
            &prolly_map! {"a" => "b"},
            vec!["a"],
        );
        test(
            &prolly_map! {"a" => "a"},
            &prolly_map! {"b" => "b"},
            vec!["a", "b"],
        );
        test(
            &prolly_map! {"a" => "a", "b" => "b"},
            &prolly_map! {"b" => "b", "c" => "c"},
            vec!["a", "c"],
        );
        test(
            &prolly_map! {"a" => "a", "b" => "b"},
            &prolly_map! {"b" => "b"},
            vec!["a"],
        );
        test(
            &prolly_map! {"b" => "b"},
            &prolly_map! {"b" => "b", "c" => "c"},
            vec!["c"],
        );
        test(
            &prolly_map! {"a" => "a1", "b"=>"b1"},
            &prolly_map! {"a" => "a2", "b" => "b2"},
            vec!["a", "b"],
        );
    }

    #[test]
    fn test_pending_changed_keys() {
        let mut base_map = BTreeMap::new();
        base_map.insert(b"a", b"a");
        base_map.insert(b"b", b"b");

        let entries = base_map.into_iter().map(|(key, val)| Entry { key, val });

        let base = Leaf::new(entries).into();
        let mut map = Map {
            base,
            pending: BTreeMap::new(),
        };

        map.put(b"c".to_vec(), b"c".to_vec());
        assert_eq!(map.pending_changed_keys().unwrap(), vec![str!("c")]);

        // Set b to b again... should be a nop
        map.put(b"b".to_vec(), b"b".to_vec());
        assert_eq!(map.pending_changed_keys().unwrap(), vec![str!("c")]);

        // Remove c from pending
        map.del(b"c".to_vec());
        assert_eq!(map.pending_changed_keys().unwrap(), Vec::<String>::new());

        map.del(b"d".to_vec());
        assert_eq!(map.pending_changed_keys().unwrap(), Vec::<String>::new());

        map.put(b"b".to_vec(), b"2".to_vec());
        assert_eq!(map.pending_changed_keys().unwrap(), vec![str!("b")]);
    }
}
