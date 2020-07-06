use super::meta_generated::meta;
use flatbuffers;
use flatbuffers::FlatBufferBuilder;

// Chunk is an node in the immutable dag. Each node has a hash,
// which uniquely identifies it, a blob of data, and zero or more
// references to other chunks.
#[derive(Debug)]
pub struct Chunk {
    hash: String,
    data: Vec<u8>,
    meta: Option<(Vec<u8>, usize)>,
}

impl Chunk {
    pub fn new(hash: String, data: Vec<u8>, refs: &[&str]) -> Chunk {
        Chunk {
            hash,
            data,
            meta: Chunk::create_meta(refs),
        }
    }

    pub fn read(hash: String, data: Vec<u8>, meta: Option<Vec<u8>>) -> Chunk {
        Chunk {
            hash,
            data,
            meta: meta.map(|v| (v, 0)),
        }
    }

    pub fn hash(&self) -> &str {
        &self.hash
    }

    pub fn data(&self) -> &[u8] {
        &self.data
    }

    // TODO: It would be nice to flatten the option down into an empty
    // iterator for caller convenience, but could not find a zero-alloc
    // way to do that.
    pub fn refs<'a>(&'a self) -> Option<impl Iterator<Item = &str>> {
        if let Some(buf) = self.meta() {
            if let Some(refs) = meta::get_root_as_meta(buf).refs() {
                return Some(refs.iter());
            }
        }
        None
    }

    pub fn meta(&self) -> Option<&[u8]> {
        match &self.meta {
            None => None,
            Some((buf, offset)) => Some(&buf[*offset..]),
        }
    }

    fn create_meta(refs: &[&str]) -> Option<(Vec<u8>, usize)> {
        if refs.is_empty() {
            return None;
        }
        let mut builder = FlatBufferBuilder::default();
        // TODO: You're supposed to be able to use start_vector() and
        // push(), but cannot make compiler happy wih that.
        let refs = builder.create_vector_of_strings(refs);
        let meta = meta::Meta::create(&mut builder, &meta::MetaArgs { refs: Some(refs) });
        builder.finish(meta, None);
        Some(builder.collapse())
    }
}

impl PartialEq for Chunk {
    fn eq(&self, other: &Self) -> bool {
        match self.refs() {
            None => other.refs().is_none(),
            Some(s) => match other.refs() {
                None => false,
                Some(o) => s.eq(o),
            },
        }
    }
}

impl Eq for Chunk {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip() {
        fn test(hash: String, data: Vec<u8>, refs: &[&str]) {
            let c = Chunk::new(hash.clone(), data.clone(), refs.clone());
            assert_eq!(&hash, c.hash());
            assert_eq!(data, c.data());
            if refs.is_empty() {
                assert!(c.refs().is_none());
            } else {
                assert_eq!(refs, c.refs().unwrap().collect::<Vec<&str>>().as_slice());
            }

            let buf = c.meta();
            let c2 = Chunk::read(hash.clone(), data.clone(), buf.map(|b| b.to_vec()));
            assert_eq!(c, c2);
        }

        test("".to_string(), vec![], &vec![]);
        test("h".to_string(), vec![0], &vec!["r1"]);
        test("h1".to_string(), vec![0, 1], &vec!["r1", "r2"]);
    }
}
