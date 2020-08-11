use super::leaf_generated::leaf;
use super::Entry;
use crate::dag::Chunk;
use flatbuffers::FlatBufferBuilder;

// Leaf is a leaf level node in the map tree structure.
// It wraps a chunk containing a flatbuffer and exposes handy
// utilities to inspect the buffer more easily.
#[derive(Debug, PartialEq)]
pub struct Leaf {
    chunk: Chunk,
}

#[derive(Debug, Eq, PartialEq)]
pub enum LoadError {
    Corrupt(&'static str),
}

impl Leaf {
    pub fn chunk(&self) -> &Chunk {
        &self.chunk
    }

    pub fn load(chunk: Chunk) -> Result<Leaf, LoadError> {
        // Validate at load-time so we can assume data is valid thereafter.
        let root = leaf::get_root_as_leaf(chunk.data());
        let entries = root
            .entries()
            .ok_or(LoadError::Corrupt("missing entries"))?;
        let mut prev: Option<&[u8]> = None;
        for e in entries {
            if prev.is_some() {
                if prev == e.key() {
                    return Err(LoadError::Corrupt("duplicate key"));
                }
                if prev > e.key() {
                    return Err(LoadError::Corrupt("unsorted key"));
                }
            }
            if e.key().is_none() {
                return Err(LoadError::Corrupt("missing key"));
            }
            if e.val().is_none() {
                return Err(LoadError::Corrupt("missing val"));
            }
            prev = e.key();
        }

        Ok(Leaf { chunk })
    }

    pub fn new<'a>(entries: impl Iterator<Item = Entry<'a>>) -> Leaf {
        let mut builder = FlatBufferBuilder::default();
        let entries = entries
            .map(|e| {
                let builder = &mut builder;
                let args = &leaf::LeafEntryArgs {
                    key: Some(builder.create_vector(e.key)),
                    val: Some(builder.create_vector(e.val)),
                };
                leaf::LeafEntry::create(builder, args)
            })
            .collect::<Vec<flatbuffers::WIPOffset<leaf::LeafEntry>>>();
        let entries = builder.create_vector(&entries);
        let root = leaf::Leaf::create(
            &mut builder,
            &leaf::LeafArgs {
                entries: Some(entries),
            },
        );
        builder.finish(root, None);

        Leaf {
            chunk: Chunk::new(builder.collapse(), &[]),
        }
    }

    pub fn iter(s: Option<&Self>) -> impl Iterator<Item = Entry<'_>> {
        let root = s.map(|leaf| leaf::get_root_as_leaf(leaf.chunk.data()));
        LeafIter {
            fb_iter: root.and_then(|r| r.entries()).map(|e| e.iter()),
        }
    }
}

// LeafIter simplifies iteration over the leaf entries. Unfortunately it needs
// to be generic because the type returned by flatbuffer::Vector<T>::iter() is
// private. The only way to encapsulate that type appears to be by making it
// generic.
#[allow(dead_code)]
struct LeafIter<'a, FBIter: Iterator<Item = leaf::LeafEntry<'a>>> {
    fb_iter: Option<FBIter>,
}

impl<'a, FBIter: Iterator<Item = leaf::LeafEntry<'a>>> Iterator for LeafIter<'a, FBIter> {
    type Item = Entry<'a>;
    fn next(&mut self) -> Option<Entry<'a>> {
        match self.fb_iter.as_mut() {
            None => None,
            Some(fb_iter) => fb_iter.next().map(|e| e.into()),
        }
    }
}

impl<'a> From<leaf::LeafEntry<'a>> for Entry<'a> {
    fn from(leaf_entry: leaf::LeafEntry<'a>) -> Self {
        // load() validates that key and val are present.
        Entry {
            key: leaf_entry.key().unwrap(),
            val: leaf_entry.val().unwrap(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn try_from() {
        fn test(input: Chunk, expected: Entry) {
            let leaf = Leaf::load(input).unwrap();
            let actual = Leaf::iter(Some(&leaf)).next().unwrap();
            assert_eq!(actual, expected);
        }

        // zero-length keys and vals are supported.
        test(
            make_leaf(vec![vec![].into(), vec![].into()].into()),
            Entry {
                key: vec![].as_slice().into(),
                val: vec![].as_slice().into(),
            },
        );

        // normal non-zero keys and values too.
        test(
            make_leaf(vec![vec![1].into(), vec![1].into()].into()),
            Entry {
                key: vec![1].as_slice().into(),
                val: vec![1].as_slice().into(),
            },
        );
        test(
            make_leaf(vec![vec![1, 2].into(), vec![3, 4].into()].into()),
            Entry {
                key: vec![1, 2].as_slice().into(),
                val: vec![3, 4].as_slice().into(),
            },
        );
    }

    #[test]
    fn leaf_iter() {
        fn test(chunk: Option<Chunk>, expected: Vec<Entry>) {
            let leaf = chunk.map(|chunk| Leaf::load(chunk).unwrap());
            let it = Leaf::iter(leaf.as_ref());
            assert_eq!(it.collect::<Vec<Entry>>(), expected);
        }

        // None is flattened to empty iterator.
        test(None, vec![]);
        test(make_leaf(vec![].into()).into(), vec![]);

        // Single entry
        test(
            make_leaf(vec![vec![1].into(), vec![2].into()].into()).into(),
            vec![Entry {
                key: vec![1].as_slice(),
                val: vec![2].as_slice(),
            }],
        );

        // multiple entries
        test(
            make_leaf(vec![vec![].into(), vec![].into(), vec![1].into(), vec![1].into()].into())
                .into(),
            vec![
                Entry {
                    key: vec![].as_slice(),
                    val: vec![].as_slice(),
                },
                Entry {
                    key: vec![1].as_slice(),
                    val: vec![1].as_slice(),
                },
            ],
        );
    }

    #[test]
    fn round_trip() {
        let k0 = vec![0];
        let k1 = vec![1];
        let expected = vec![Entry { key: &k0, val: &k0 }, Entry { key: &k1, val: &k1 }];
        let expected = Leaf::new(expected.into_iter());
        let actual = Leaf::load(Chunk::read(
            expected.chunk.hash().to_string(),
            expected.chunk.data().to_vec(),
            None,
        ))
        .unwrap();
        assert_eq!(expected, actual);
        assert_eq!(2 as usize, Leaf::iter((&actual).into()).count());
    }

    #[test]
    fn load() {
        fn test(kv: Option<Vec<Option<Vec<u8>>>>, expected: Result<Leaf, LoadError>) {
            let chunk = make_leaf(kv);
            let actual = Leaf::load(chunk);
            assert_eq!(expected, actual);
        }

        test(None, Err(LoadError::Corrupt("missing entries")));
        test(
            vec![None, None].into(),
            Err(LoadError::Corrupt("missing key")),
        );
        test(
            vec![vec![].into(), None].into(),
            Err(LoadError::Corrupt("missing val")),
        );
        test(
            vec![vec![1].into(), vec![].into(), vec![1].into(), vec![].into()].into(),
            Err(LoadError::Corrupt("duplicate key")),
        );
        test(
            vec![vec![1].into(), vec![].into(), vec![0].into(), vec![].into()].into(),
            Err(LoadError::Corrupt("unsorted key")),
        );
    }

    fn make_leaf(kv: Option<Vec<Option<Vec<u8>>>>) -> Chunk {
        let mut builder = FlatBufferBuilder::default();
        let mut entries: Option<
            flatbuffers::WIPOffset<
                flatbuffers::Vector<flatbuffers::ForwardsUOffset<leaf::LeafEntry>>,
            >,
        > = None;
        if let Some(kv) = kv {
            let mut temp = Vec::<flatbuffers::WIPOffset<leaf::LeafEntry>>::new();
            for i in 0..kv.len() / 2 {
                let key = &kv[i * 2];
                let val = &kv[i * 2 + 1];
                let mut args = leaf::LeafEntryArgs {
                    key: None,
                    val: None,
                };
                if let Some(key) = key {
                    args.key = builder.create_vector(key.as_slice()).into();
                }
                if let Some(val) = val {
                    args.val = builder.create_vector(val.as_slice()).into();
                }
                temp.push(leaf::LeafEntry::create(&mut builder, &args));
            }
            entries = builder.create_vector(temp.as_slice()).into();
        }
        let leaf = leaf::Leaf::create(&mut builder, &leaf::LeafArgs { entries });
        builder.finish(leaf, None);
        Chunk::new(builder.collapse(), vec![].as_slice())
    }
}
