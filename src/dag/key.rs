use std::fmt;
use std::str;

// KVKey is the key we use to store our dag data in the underlying
// kvstore.
#[derive(Debug, PartialEq, Eq)]
pub enum Key<'a> {
    ChunkData(&'a str),
    ChunkMeta(&'a str),
    Head(&'a str),
}

type ParseError = ();

// TODO: It would be cool to make this implement FromString trait,
// as that is the convention, and then "foo".parse() would work.
// But I got lost in lifetime goop.
impl<'a> Key<'_> {
    pub fn parse<'b>(s: &'b str) -> Result<Key<'b>, ParseError> {
        let mut parts = s.split::<'b>("/");
        let prefix: &str = parts.next().ok_or(())?;
        let content = parts.next().ok_or(())?;
        match prefix {
            "c" => {
                let suffix = parts.next().ok_or(())?;
                if parts.next().is_some() {
                    return Err(());
                }
                match suffix {
                    "d" => Ok(Key::ChunkData(content)),
                    "m" => Ok(Key::ChunkMeta(content)),
                    _ => Err(()),
                }
            },
            "h" => Ok(Key::Head(content)),
            _ => Err(()),
        }
    }
}

impl<'a> fmt::Display for Key<'a> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Key::ChunkData(hash) => write!(f, "c/{}/d", hash),
            Key::ChunkMeta(hash) => write!(f, "c/{}/m", hash),
            Key::Head(name) => write!(f, "h/{}", name),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_string() {
        fn test(k: &Key, expected: &str) {
            assert_eq!(expected, k.to_string());
        }
        test(&Key::ChunkData(""), "c//d");
        test(&Key::ChunkData("a"), "c/a/d");
        test(&Key::ChunkData("ab"), "c/ab/d");
        test(&Key::ChunkMeta(""), "c//m");
        test(&Key::ChunkMeta("a"), "c/a/m");
        test(&Key::ChunkMeta("ab"), "c/ab/m");
        test(&Key::Head(""), "h/");
        test(&Key::Head("a"), "h/a");
        test(&Key::Head("ab"), "h/ab");
    }

    #[test]
    fn parse() {
        fn test(expected: Result<Key, ParseError>, s: &str) {
            assert_eq!(expected, Key::parse(s));
        }
        test(Err(()), ""); // empty string
        test(Err(()), "a"); // invalid prefix
        test(Err(()), "c"); // invalid chunk:
        test(Err(()), "c/");
        test(Err(()), "c//");
        test(Err(()), "c/a/");
        test(Err(()), "c/a/a");
        test(Ok(Key::ChunkData("")), "c//d");
        test(Ok(Key::ChunkData("a")), "c/a/d");
        test(Ok(Key::ChunkData("ab")), "c/ab/d");
        test(Ok(Key::ChunkMeta("")), "c//m");
        test(Ok(Key::ChunkMeta("a")), "c/a/m");
        test(Ok(Key::ChunkMeta("ab")), "c/ab/m");
        test(Ok(Key::Head("")), "h/");
        test(Ok(Key::Head("a")), "h/a");
        test(Ok(Key::Head("ab")), "h/ab");
    }

    #[test]
    fn roundtrip() -> Result<(), ParseError> {
        let cases: &[Key] = &[
            Key::ChunkData("".into()),
            Key::ChunkData("a".into()),
            Key::ChunkMeta("".into()),
            Key::ChunkMeta("a".into()),
            Key::Head("".into()),
            Key::Head("a".into()),
        ];

        for c in cases {
            let exp = c;
            let encoded = exp.to_string();
            assert!(encoded.len() > 0);
            let act = Key::parse(&encoded)?;
            assert_eq!(exp, &act, "Could not roundtrip {}", exp);
        }

        Ok(())
    }
}
