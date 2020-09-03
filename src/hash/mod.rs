use data_encoding::{Encoding, Specification};
use sha2::{Digest, Sha512};
use std::fmt;

lazy_static! {
    static ref NOMS: Encoding = {
        let mut spec = Specification::new();
        spec.symbols.push_str("0123456789abcdefghijklmnopqrstuv");
        spec.encoding().unwrap()
    };
}

pub const BYTE_LENGTH: usize = 20;

pub struct Hash {
    pub sum: [u8; BYTE_LENGTH],
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Error {
    InvalidHashSerialization,
}

impl Hash {
    pub fn empty() -> Hash {
        Hash {
            sum: [0; BYTE_LENGTH],
        }
    }

    #[allow(dead_code)]
    pub fn new(sum: [u8; BYTE_LENGTH]) -> Hash {
        Hash { sum }
    }

    #[allow(dead_code)]
    pub fn parse(s: &str) -> Result<Hash, Error> {
        let mut h = Hash::empty();
        match NOMS.decode_mut(s.as_bytes(), &mut h.sum) {
            Err(_) => Err(Error::InvalidHashSerialization),
            Ok(_) => Ok(h),
        }
    }

    pub fn of(data: &[u8]) -> Hash {
        let mut hasher = Sha512::new();
        hasher.input(data);
        let result = hasher.result();
        let mut h = Hash::empty();
        h.sum.copy_from_slice(&result[..BYTE_LENGTH]);
        h
    }

    #[allow(dead_code)]
    pub fn is_empty(&self) -> bool {
        self.sum == [0; BYTE_LENGTH]
    }
}

impl fmt::Display for Hash {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", NOMS.encode(&self.sum))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_of() {
        let mut h = Hash::empty();
        assert_eq!(h.is_empty(), true);
        assert_eq!(h.to_string(), "00000000000000000000000000000000");

        h = Hash::of(b"abc");
        assert_eq!(h.is_empty(), false);
        assert_eq!(h.to_string(), "rmnjb8cjc5tblj21ed4qs821649eduie");

        let h2 = Hash::parse("rmnjb8cjc5tblj21ed4qs821649eduie").unwrap();
        assert_eq!(h2.to_string(), h.to_string());
    }
}
