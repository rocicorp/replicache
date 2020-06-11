use crate::hash::Hash;

pub struct Chunk {
    d: Vec<u8>,
    h: Hash,
}

impl Chunk {
    pub fn new(data: Vec<u8>) -> Chunk {
        let h = Hash::of(&data);
        Chunk{d: data, h: h}
    }

    pub fn data(&self) -> &[u8] {
        &self.d
    }

    pub fn hash(&self) -> &Hash {
        &self.h
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let c = Chunk::new(vec![b'a', b'b', b'c']);
        assert_eq!("rmnjb8cjc5tblj21ed4qs821649eduie", c.hash().to_string());
        assert_eq!(b"abc", c.data());
    }
}
