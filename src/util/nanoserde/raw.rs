//! The raw package implements DeJson and SerJson for a struct that just passes the raw data through.
use nanoserde::{DeJson, DeJsonErr, DeJsonState, SerJson};

pub struct Raw {
    data: Vec<char>,
}

impl DeJson for Raw {
    fn de_json(s: &mut DeJsonState, i: &mut std::str::Chars) -> Result<Self, DeJsonErr> {
        Ok(Raw { data: i.collect() })
    }
}

impl SerJson for Raw {
    fn ser_json(&self, _: usize, s: &mut nanoserde::SerJsonState) {
        for c in &self.data {
            s.out.push(*c);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        fn test(input: &str) {
            let r: Raw = DeJson::deserialize_json(input).unwrap();
            assert_eq!(r.data, input.chars().collect::<Vec<char>>());
            let output = r.serialize_json();
            assert_eq!(input, output);
        }

        test("true");
        test("false");
    }
}
