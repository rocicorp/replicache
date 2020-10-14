use super::meta_generated::meta;
use crate::hash::Hash;
use flatbuffers::FlatBufferBuilder;

// Chunk is an node in the immutable dag. Each node has a hash,
// which uniquely identifies it, a blob of data, and zero or more
// references to other chunks.
#[derive(Debug)]
pub struct Chunk {
    hash: String,
    data: (Vec<u8>, usize),
    meta: Option<(Vec<u8>, usize)>,
}

impl Chunk {
    pub fn new(data: (Vec<u8>, usize), refs: &[&str]) -> Chunk {
        let s: &[u8] = &data.0;
        Chunk {
            hash: Hash::of(&s[data.1..]).to_string(),
            data,
            meta: Chunk::create_meta(refs),
        }
    }

    pub fn read(hash: String, data: Vec<u8>, meta: Option<Vec<u8>>) -> Chunk {
        Chunk {
            hash,
            data: (data, 0),
            meta: meta.map(|v| (v, 0)),
        }
    }

    pub fn hash(&self) -> &str {
        &self.hash
    }

    pub fn data(&self) -> &[u8] {
        &(self.data.0[self.data.1..])
    }

    pub fn refs(&self) -> impl Iterator<Item = &str> {
        self.meta()
            .into_iter()
            .flat_map(|buf| meta::get_root_as_meta(buf).refs())
            .flatten()
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
        self.hash == other.hash && self.refs().eq(other.refs())
    }
}

impl Eq for Chunk {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip() {
        fn test(hash: String, data: Vec<u8>, refs: &[&str]) {
            let c = Chunk::new((data.clone(), 0), refs.clone());
            assert_eq!(&hash, c.hash());
            assert_eq!(data, c.data());
            if refs.is_empty() {
                assert!(c.refs().next().is_none());
            } else {
                assert_eq!(refs, c.refs().collect::<Vec<&str>>().as_slice());
            }

            let buf = c.meta();
            let c2 = Chunk::read(hash.clone(), data.clone(), buf.map(|b| b.to_vec()));
            assert_eq!(c, c2);
        }

        test("pu1u2dbutusbrsak518dcrc00vb21p05".into(), vec![], &vec![]);
        test(
            "n0i4q0k9g7b97brr8llfhrt4pbb3qa1e".into(),
            vec![0],
            &vec!["r1"],
        );
        test(
            "g19moobgrm32dn083bokhksuobulq28c".into(),
            vec![0, 1],
            &vec!["r1", "r2"],
        );
    }
    #[test]
    fn partial_eq() {
        assert_eq!(Chunk::new((vec![], 0), &[]), Chunk::new((vec![], 0), &[]));
        assert_ne!(Chunk::new((vec![1], 0), &[]), Chunk::new((vec![], 0), &[]));
        assert_ne!(Chunk::new((vec![0], 0), &[]), Chunk::new((vec![1], 0), &[]));

        assert_eq!(Chunk::new((vec![1], 0), &[]), Chunk::new((vec![1], 0), &[]));
        assert_eq!(
            Chunk::new((vec![], 0), &["a"]),
            Chunk::new((vec![], 0), &["a"])
        );
        assert_eq!(
            Chunk::new((vec![1], 0), &["a"]),
            Chunk::new((vec![0, 1], 1), &["a"])
        );

        assert_ne!(
            Chunk::new((vec![], 0), &["a"]),
            Chunk::new((vec![], 0), &["b"])
        );
        assert_ne!(
            Chunk::new((vec![], 0), &["a"]),
            Chunk::new((vec![], 0), &["a", "b"])
        );
    }
}
