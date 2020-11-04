use crate::prolly;
use serde::{Deserialize, Serialize};
use std::convert::TryFrom;

// How to use ScanOptions:
// - prefix: key prefix to scan, "" matches all of them
// - limit: only return at most this many matches
// - start_key: start returning matches from this value, inclusive unless:
// - start_key_exclusive: start returning matches *after* the start_key
// - if passing index_name, the prefix and start_key will match against
//   indexed values in the same way as for non-index scans
//
// Note that:
// - start_key can be used for pagination
// - all combinations of options are allowed, for better or worse
#[derive(Debug, Deserialize, Serialize)]
pub struct ScanOptions {
    pub prefix: Option<String>,
    pub start_key: Option<String>,
    pub start_key_exclusive: Option<bool>,
    pub limit: Option<u64>,
    #[serde(rename = "indexName")]
    pub index_name: Option<String>,
}

// We have this internal version of ScanOptions because the dispatch interface
// uses strings but internally we use bytes. Also our scan keys are not
// necessarily valid utf8 strings.
#[derive(Debug)]
pub struct ScanOptionsInternal {
    pub prefix: Option<Vec<u8>>,
    pub start_key: Option<Vec<u8>>,
    pub start_key_exclusive: Option<bool>,
    pub limit: Option<u64>,
    pub index_name: Option<String>,
}

impl TryFrom<ScanOptions> for ScanOptionsInternal {
    type Error = ScanOptionsError;

    fn try_from(source: ScanOptions) -> Result<Self, Self::Error> {
        // If the scan is using an index then we need to generate the scan keys.
        let prefix = if let Some(p) = source.prefix {
            if source.index_name.is_some() {
                super::index::encode_scan_key(&p, false)
                    .map_err(ScanOptionsError::CreateScanKeyFailure)?
            } else {
                p.into_bytes()
            }
            .into()
        } else {
            None
        };
        let start_key = if let Some(sk) = source.start_key {
            if source.index_name.is_some() {
                super::index::encode_scan_key(&sk, source.start_key_exclusive.unwrap_or(false))
                    .map_err(ScanOptionsError::CreateScanKeyFailure)?
            } else {
                sk.into_bytes()
            }
            .into()
        } else {
            None
        };

        Ok(ScanOptionsInternal {
            prefix,
            start_key,
            start_key_exclusive: source.start_key_exclusive,
            limit: source.limit,
            index_name: source.index_name,
        })
    }
}

#[derive(Debug)]
pub enum ScanOptionsError {
    CreateScanKeyFailure(super::index::GetIndexKeysError),
}

pub fn scan<'a>(
    map: &'a prolly::Map,
    opts: ScanOptionsInternal,
) -> impl Iterator<Item = prolly::Entry<'a>> {
    let mut it = map.iter().peekable();
    let mut prefix: Vec<u8> = Vec::new();
    let mut from_key: &[u8] = &[];
    let mut exclusive = false;

    if let Some(p) = opts.prefix {
        prefix = p;
        from_key = &prefix;
    }

    if let Some(key) = opts.start_key.as_ref().map(|k| &k[..]) {
        if key > from_key {
            from_key = key;
            exclusive = opts.start_key_exclusive.unwrap_or(false);
        }
    }

    let key_met = |key: &[u8]| {
        if exclusive {
            key > from_key
        } else {
            key >= from_key
        }
    };

    while it.peek().is_some() {
        if key_met(it.peek().unwrap().key) {
            break;
        }

        it.next();
    }

    it.take_while(move |item: &prolly::Entry<'_>| item.key.starts_with(&prefix))
        .take(opts.limit.unwrap_or(std::u64::MAX) as usize)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::convert::TryInto;

    #[test]
    fn iter_from_key() {
        fn test(opts: ScanOptions, expected: Vec<&str>) {
            let test_desc = format!("opts: {:?}, expected: {:?}", &opts, &expected);
            let mut map = prolly::Map::new();
            map.put(b"foo".to_vec(), b"foo".to_vec());
            map.put(b"bar".to_vec(), b"bar".to_vec());
            map.put(b"baz".to_vec(), b"baz".to_vec());
            let actual = scan(&map, opts.try_into().unwrap())
                .map(|item| item.key)
                .collect::<Vec<&[u8]>>();
            let expected = expected
                .into_iter()
                .map(|e| e.as_bytes())
                .collect::<Vec<&[u8]>>();
            assert_eq!(expected, actual, "{}", test_desc);
        }

        // Empty
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // Prefix alone
        test(
            ScanOptions {
                prefix: Some("".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some("bar".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("bas".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec![],
        );
        // start key alone
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("a".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("b".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("bas".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("baz".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("baza".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("fop".into()),
                start_key_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec![],
        );

        // exclusive
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("".into()),
                start_key_exclusive: true.into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: Some("bar".into()),
                start_key_exclusive: true.into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );

        // limit alone
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: 3.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_key: None,
                start_key_exclusive: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // combos
        test(
            ScanOptions {
                prefix: Some("f".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: Some("f".into()),
                start_key: None,
                start_key_exclusive: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_key: Some("a".into()),
                start_key_exclusive: None,
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_key: Some("a".into()),
                start_key_exclusive: false.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_key: Some("a".into()),
                start_key_exclusive: false.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_key: Some("bar".into()),
                start_key_exclusive: true.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["baz"],
        );
    }
}
