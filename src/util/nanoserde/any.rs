use nanoserde::{DeJson, DeJsonTok, SerJson};
use std::collections::HashMap;

#[derive(Debug, PartialEq)]
pub enum Any {
    Null,
    Bool(bool),
    U64(u64),
    I64(i64),
    F64(f64),
    String(String),
    Array(Vec<Any>),
    Object(HashMap<String, Any>),
}

impl DeJson for Any {
    fn de_json(
        s: &mut nanoserde::DeJsonState,
        i: &mut std::str::Chars,
    ) -> Result<Self, nanoserde::DeJsonErr> {
        match s.tok {
            DeJsonTok::Null => {
                s.next_tok(i)?;
                Ok(Any::Null)
            }
            DeJsonTok::Bool(_) => bool::de_json(s, i).map(Any::Bool),
            DeJsonTok::U64(_) => u64::de_json(s, i).map(Any::U64),
            DeJsonTok::I64(_) => i64::de_json(s, i).map(Any::I64),
            DeJsonTok::F64(_) => f64::de_json(s, i).map(Any::F64),
            DeJsonTok::Str => String::de_json(s, i).map(Any::String),
            DeJsonTok::BlockOpen => Vec::<Any>::de_json(s, i).map(Any::Array),
            DeJsonTok::CurlyOpen => HashMap::<String, Any>::de_json(s, i).map(Any::Object),
            _ => Err(nanoserde::DeJsonErr {
                line: s.line,
                col: s.col,
                msg: format!("Unexpected token: {:?}", s.tok),
            }),
        }
    }
}

impl SerJson for Any {
    fn ser_json(&self, d: usize, s: &mut nanoserde::SerJsonState) {
        match self {
            Any::Null => s.out.push_str("null"),
            Any::Bool(v) => v.ser_json(d, s),
            Any::U64(v) => v.ser_json(d, s),
            Any::I64(v) => v.ser_json(d, s),
            Any::F64(v) => v.ser_json(d, s),
            Any::String(v) => v.ser_json(d, s),
            Any::Array(v) => v.ser_json(d, s),
            Any::Object(v) => v.ser_json(d, s),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use maplit::hashmap;
    use nanoserde::DeJsonErr;
    use str_macro::str;

    #[derive(Debug)]
    struct DeJsonWrap {
        e: DeJsonErr,
    }

    impl DeJsonWrap {
        fn new(line: usize, col: usize, msg: &str) -> DeJsonWrap {
            DeJsonWrap {
                e: DeJsonErr {
                    line,
                    col,
                    msg: msg.to_string(),
                },
            }
        }
    }

    impl PartialEq for DeJsonWrap {
        fn eq(&self, other: &Self) -> bool {
            self.e.line == other.e.line && self.e.col == other.e.col && self.e.msg == other.e.msg
        }
    }

    #[test]
    fn deserialize() {
        fn test(input: &str, expected: Result<Any, DeJsonWrap>) {
            let actual: Result<Any, DeJsonErr> = DeJson::deserialize_json(input);
            assert_eq!(expected, actual.map_err(|e| DeJsonWrap { e }));
        }

        test("", Err(DeJsonWrap::new(0, 0, "Unexpected token: Eof")));
        test(
            "!",
            Err(DeJsonWrap::new(
                0,
                1,
                "Unexpected token Bof expected tokenizer ",
            )),
        );
        test("null", Ok(Any::Null));
        test("true", Ok(Any::Bool(true)));
        test("false", Ok(Any::Bool(false)));
        test("42", Ok(Any::U64(42)));
        test("-42", Ok(Any::I64(-42)));
        test("88.8", Ok(Any::F64(88.8)));
        test("\"foo\"", Ok(Any::String(str!("foo"))));
        test(
            "[null,true,false,42,-42,88.8,\"foo\",[],{}]",
            Ok(Any::Array(vec![
                Any::Null,
                Any::Bool(true),
                Any::Bool(false),
                Any::U64(42),
                Any::I64(-42),
                Any::F64(88.8),
                Any::String(str!("foo")),
                Any::Array(vec![]),
                Any::Object(HashMap::new()),
            ])),
        );
        test(
            r#"{"a":null, "b":true, "c":false, "d":42, "e":-42, "f":88.8, "g":"foo", "h":[], "i":{}}"#,
            Ok(Any::Object(hashmap![
                str!("a") => Any::Null,
                str!("b") => Any::Bool(true),
                str!("c") => Any::Bool(false),
                str!("d") => Any::U64(42),
                str!("e") => Any::I64(-42),
                str!("f") => Any::F64(88.8),
                str!("g") => Any::String(str!("foo")),
                str!("h") => Any::Array(vec![]),
                str!("i") => Any::Object(hashmap![])
            ])),
        );
    }

    #[test]
    fn serialize() {
        fn test(input: Any, expected: &str) {
            let actual = input.serialize_json();
            assert_eq!(expected, &actual);
        }

        test(Any::Null, "null");
        test(Any::Bool(true), "true");
        test(Any::Bool(false), "false");
        test(Any::U64(42), "42");
        test(Any::I64(-42), "-42");
        test(Any::F64(88.8), "88.8");
        test(Any::F64(-88.8), "-88.8");
        test(Any::String(str!("foo")), r#""foo""#);
        test(
            Any::Array(vec![
                Any::Null,
                Any::Bool(true),
                Any::Bool(false),
                Any::U64(42),
                Any::I64(-42),
                Any::F64(88.8),
                Any::String(str!("foo")),
                Any::Array(vec![]),
                Any::Object(hashmap![str!("foo") => Any::Bool(true)]),
            ]),
            r#"[null,true,false,42,-42,88.8,"foo",[],{"foo":true}]"#,
        );
        test(Any::Object(hashmap![]), r#"{}"#);
        test(
            Any::Object(hashmap![
                str!("a") => Any::Null,
            ]),
            r#"{"a":null}"#,
        )
        // TODO: Test more indepth. Difficult because map iteration is randomized, so can't compare to literal string.
    }
}
