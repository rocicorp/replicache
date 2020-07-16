use super::buzhash::BuzHash;

pub struct Chunker {
    bh: BuzHash,
    pattern: u32,
}

#[allow(dead_code)]
impl Chunker {
    fn new(window: u32, pattern: u32) -> Chunker {
        Chunker {
            bh: BuzHash::new(window),
            pattern,
        }
    }

    // The chunker used in production
    pub fn default() -> Chunker {
        // This is the configuration Noms uses, which allows us
        // to test against its output.
        // TODO: It's likely we'd like bigger chunks, but we can
        // profile that later.
        Chunker::new(67, (1 << 12) - 1) // ~4kb chunks
    }

    // Adds a byte to the rolling hasher. Returns true if the byte
    // was a boundary, false otherwise.
    pub fn hash_byte(&mut self, b: u8) -> bool {
        self.bh.hash_byte(b);
        if self.bh.sum() & self.pattern == self.pattern {
            self.bh.reset();
            return true;
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_byte() {
        const S: &str = "Test hash byte";
        let mut expected = [3, 5].iter();

        let mut c = Chunker::new(4, (1 << 4) - 1);
        for (i, b) in S.as_bytes().iter().enumerate() {
            if c.hash_byte(*b) {
                assert_eq!(Some(&i), expected.next());
            }
        }
        assert_eq!(None, expected.next());
    }
}
