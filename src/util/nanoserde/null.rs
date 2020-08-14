use nanoserde::{DeJson, DeJsonErr, DeJsonState, DeJsonTok, SerJson};
use str_macro::str;

#[derive(Debug, PartialEq, Eq)]
pub struct Null {}

impl DeJson for Null {
    fn de_json(s: &mut DeJsonState, i: &mut std::str::Chars) -> Result<Self, DeJsonErr> {
        match s.tok {
            DeJsonTok::Null => {
                s.next_tok(i)?;
                Ok(Null {})
            }
            _ => Err(DeJsonErr {
                msg: str!("Expected null"),
                line: s.line,
                col: s.col,
            }),
        }
    }
}

impl SerJson for Null {
    fn ser_json(&self, _: usize, s: &mut nanoserde::SerJsonState) {
        s.out.push_str("null");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        fn test(input: &str, expected_err: Option<DeJsonErr>, expected_ser: Option<&str>) {
            let actual: Result<Null, DeJsonErr> = DeJson::deserialize_json(input);
            if let Some(expected_err) = expected_err {
                assert!(actual.is_err());
                let actual = actual.as_ref().unwrap_err();
                assert_eq!(expected_err.line, actual.line);
                assert_eq!(expected_err.col, actual.col);
                assert_eq!(expected_err.msg, actual.msg);
            } else {
                assert!(actual.is_ok());
            }
            if let Some(expected_ser) = expected_ser {
                let rt = actual.unwrap().serialize_json();
                assert_eq!(rt, expected_ser);
            }
        }

        test("null", None, Some("null"));
        test(" null ", None, Some("null"));
        test(" \n\tnull\t\n ", None, Some("null"));
    }
}
