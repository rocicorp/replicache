use crc::{crc32, Hasher32};
use std::fmt;
use std::marker::Copy;
use std::num::ParseIntError;
use std::str::FromStr;

// Checksum is a fast, incrementally computable, non-cryptographic
// checksum of the contents of a map of bytes to bytes. The checksum
// is commutative (it is not sensitive to the order of adds/removes)
// so two maps with the same contents will have the same checksum no
// matter in what order the keys were added (or removed/replaced).
#[derive(Clone, Copy, PartialEq)]
pub struct Checksum {
    v: u32,
}

impl Checksum {
    pub fn new() -> Checksum {
        Checksum { v: 0 }
    }

    // Note: do not call add() if key is already in the map. Instead, call
    // replace().
    pub fn add(&mut self, key: &[u8], value: &[u8]) {
        self.v ^= v(key, value)
    }

    pub fn remove(&mut self, key: &[u8], value: &[u8]) {
        self.v ^= v(key, value)
    }

    pub fn replace(&mut self, key: &[u8], old_value: &[u8], new_value: &[u8]) {
        self.remove(key, old_value);
        self.add(key, new_value);
    }
}

fn v(key: &[u8], value: &[u8]) -> u32 {
    let mut digest = crc32::Digest::new(crc32::IEEE);
    digest.write(key.len().to_string().as_bytes());
    digest.write(key);
    digest.write(value.len().to_string().as_bytes());
    digest.write(value);
    digest.sum32()
}

impl fmt::Display for Checksum {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:08x}", self.v)
    }
}

impl fmt::Debug for Checksum {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(self, f)
    }
}

impl Default for Checksum {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, PartialEq)]
pub enum ParseError {
    InvalidChecksum(ParseIntError),
}

impl FromStr for Checksum {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        use ParseError::*;
        let v = u32::from_str_radix(s, 16).map_err(InvalidChecksum)?;
        Ok(Checksum { v })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use str_macro::str;

    #[test]
    fn test_v() {
        let mut c = Checksum { v: 0 };
        assert_eq!(str!("00000000"), c.to_string());

        let key = "key⌘".as_bytes();
        let value = vec![0x01u8, 0x02];
        let expected_crc_input = vec![
            0x36u8, // '6'
            0x6B, 0x65, 0x79, 0xe2, 0x8c, 0x98, // 'k''e''y''⌘'
            0x32, // '2'
            0x01, 0x02, // {0x01, 0x02}
        ];
        c.add(key, &value);
        assert_eq!(crc32::checksum_ieee(&expected_crc_input), c.v);
        c.remove(key, &value);
        assert_eq!(0, c.v);
    }

    #[test]
    fn test_add_remove() {
        let (k1, v1) = (vec![0x01u8], vec![0x02u8]);
        let (k2, v2) = (vec![0x03u8], vec![0x04u8]);
        let mut c1 = Checksum::new();
        let mut c2 = Checksum::new();

        assert_eq!(c1, c2);
        c1.add(&k1, &v1);
        assert_eq!(c1, c1);
        assert_ne!(c1, c2);

        c2.add(&k2, &v2);
        c2.add(&k1, &v1);
        assert_ne!(c1, c2);
        c2.remove(&k2, &v2);
        assert_eq!(c1, c2);

        c1.replace(&k1, &v1, &v2);
        let mut c3 = Checksum::new();
        c3.add(&k1, &v2);
        assert_eq!(c1, c3);
    }

    #[test]
    fn test_to_and_from_str() {
        struct Case {
            pub s: &'static str,
            pub exp_v: Option<u32>,
        }
        let cases = [
            Case {
                s: "00000000",
                exp_v: Some(0),
            },
            Case {
                s: "00cf3d55",
                exp_v: Some(13581653),
            },
            Case {
                s: "boom",
                exp_v: None,
            },
        ];
        for c in cases.iter() {
            let got = Checksum::from_str(c.s);
            match c.exp_v {
                None => {
                    got.unwrap_err();
                }
                Some(exp_v) => {
                    let got_checksum = got.unwrap();
                    assert_eq!(exp_v, got_checksum.v);
                    assert_eq!(c.s.to_string(), got_checksum.to_string())
                }
            }
        }
    }
}
