use super::index;
use crate::prolly;
use serde::{Deserialize, Serialize};
use std::convert::TryFrom;
use str_macro::str;

// How to use ScanOptions. This could be simpler if we added more
// structure, eg separate scan types for regular vs index scans,
// but opting instead for simpler structure at the cost of making
// it slightly harder to hold.
//
// For *all* scans:
// - limit: only return at most this many matches
//
// For *regular* scans:
// - prefix: (primary) key prefix to scan, "" matches all of them
// - start_key: start returning (primary key) matches from this value,
//   inclusive unless:
// - start_exclusive: start returning matches *after* the start_key
// - start_key can be used for pagination
//
// For *index* scans:
// - index_name: name of the index to use
// - prefix: *secondary* key prefix to scan for, "" matches all of them
// - start_secondary_key: start returning *secondary* key matches from
//   this value, AND:
// - start_key: if provided start matching on EXACTLY the start_secondary_key
//   and return *primary* key matches starting from this value (empty string
//   means all of them).
// - start_exclusive: start returning matches *after* the
//   (start_secondary_key, start_key) entry; exclusive covers both
// - start_secondary_key and start_key can be used for pagination
//
// NOTE that in above for index scans if you provide Some start_key, the
// secondary_index_key is treated as an exact match.
#[derive(Debug, Deserialize, Serialize)]
pub struct ScanOptions {
    pub prefix: Option<String>,
    pub start_secondary_key: Option<String>,
    pub start_key: Option<String>,
    pub start_exclusive: Option<bool>,
    pub limit: Option<u64>,
    #[serde(rename = "indexName")]
    pub index_name: Option<String>,
}

// ScanOptionsInternal is a version of the ScanOptions that has been
// prepared for execution of a scan. We need to carefully set up scan
// keys based on several factors (eg, is it an index scan), so you should
// probably not create this structure directly. It is intended to be
// created via TryFrom a ScanOptions.
//
// You'll note that 'start_exclusive' is missing. That's because
// of the above-mentioned scan prep; exclusive is implemented by scanning
// for the next value after the one provided.
#[derive(Debug)]
pub struct ScanOptionsInternal {
    pub prefix: Option<Vec<u8>>,
    pub start_key: Option<Vec<u8>>,
    pub limit: Option<u64>,
    pub index_name: Option<String>,
}

#[derive(Debug)]
pub enum ScanResult<'a> {
    Error(ScanResultError),
    Item(ScanItem<'a>),
}

#[derive(Debug)]
#[cfg_attr(test, derive(Eq, PartialEq))]
pub struct ScanItem<'a> {
    pub key: &'a [u8],
    pub secondary_key: &'a [u8],
    pub val: &'a [u8],
}

#[derive(Debug)]
pub enum ScanResultError {
    DecodeError(index::DecodeIndexKeyError),
}

impl TryFrom<ScanOptions> for ScanOptionsInternal {
    type Error = ScanOptionsError;

    fn try_from(source: ScanOptions) -> Result<Self, Self::Error> {
        // If the scan is using an index then we need to generate the scan keys.
        let prefix = if let Some(p) = source.prefix {
            if source.index_name.is_some() {
                index::encode_index_scan_key(p.as_bytes(), None, false)
                    .map_err(ScanOptionsError::CreateScanKeyFailure)?
            } else {
                p.into_bytes()
            }
            .into()
        } else {
            None
        };
        let start_key = if source.index_name.is_some() {
            // Note: encoding of exclusive done inside encode_index_scan_key
            index::encode_index_scan_key(
                source
                    .start_secondary_key
                    .unwrap_or_else(|| str!(""))
                    .as_bytes(),
                source.start_key.as_deref().map(|s| s.as_bytes()),
                source.start_exclusive.unwrap_or(false),
            )
            .map_err(ScanOptionsError::CreateScanKeyFailure)?
        } else {
            let mut sk = source.start_key.unwrap_or_else(|| str!(""));
            if source.start_exclusive.unwrap_or(false) {
                sk.push('\u{0000}');
            }
            sk.into_bytes()
        }
        .into();

        Ok(ScanOptionsInternal {
            prefix,
            start_key,
            limit: source.limit,
            index_name: source.index_name,
        })
    }
}

#[derive(Debug)]
pub enum ScanOptionsError {
    CreateScanKeyFailure(super::index::GetIndexKeysError),
}

// scan() yields decoded prolly map entries.
pub fn scan(map: &prolly::Map, opts: ScanOptionsInternal) -> impl Iterator<Item = ScanResult> {
    use ScanResultError::*;

    // We don't do any encoding of the key in regular prolly maps, so we have
    // no way of determining from an entry.key alone whether it is a regular
    // prolly map key or an encoded IndexKey in an index map. Without encoding
    // regular prolly map keys we need to rely on the opts to tell us what we expect.
    let index_scan = opts.index_name.is_some();
    scan_raw(map, opts).map(move |entry| {
        if index_scan {
            let decoded = index::decode_index_key(entry.key).map_err(DecodeError);
            match decoded {
                Err(e) => ScanResult::Error(e),
                Ok(index_key) => {
                    let index::IndexKey { secondary, primary } = index_key;
                    let item = ScanItem {
                        key: primary,
                        secondary_key: secondary,
                        val: entry.val,
                    };
                    ScanResult::Item(item)
                }
            }
        } else {
            ScanResult::Item(ScanItem {
                key: entry.key,
                secondary_key: &[],
                val: entry.val,
            })
        }
    })
}

// scan_raw() scans the prolly map yielding raw, undecoded prolly::Entrys. To
// get decoded results use scan().
pub fn scan_raw<'a>(
    map: &'a prolly::Map,
    opts: ScanOptionsInternal,
) -> impl Iterator<Item = prolly::Entry<'a>> {
    let mut it = map.iter().peekable();
    let mut prefix: Vec<u8> = Vec::new();
    let mut from_key: &[u8] = &[];

    if let Some(p) = opts.prefix {
        prefix = p;
        from_key = &prefix;
    }

    if let Some(key) = opts.start_key.as_deref() {
        if key > from_key {
            from_key = key;
        }
    }

    while it.peek().is_some() {
        // Note: exclusive implemented at a higher level by appending a 0x01 to the
        // key before passing it to scan.
        if it.peek().unwrap().key >= from_key {
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
    fn test_scan() {
        fn test(opts: ScanOptions, expected: Vec<&str>) {
            let test_desc = format!("opts: {:?}, expected: {:?}", &opts, &expected);
            let mut map = prolly::Map::new();
            map.put(b"foo".to_vec(), b"foo".to_vec());
            map.put(b"bar".to_vec(), b"bar".to_vec());
            map.put(b"baz".to_vec(), b"baz".to_vec());
            let actual = scan(&map, opts.try_into().unwrap())
                .map(|sr| match sr {
                    ScanResult::Error(e) => panic!("{:?}", e),
                    ScanResult::Item(item) => item.key,
                })
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
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // Prefix alone
        test(
            ScanOptions {
                prefix: Some("".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some("bar".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("bas".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec![],
        );
        // start key alone
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("a".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("b".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("bas".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("baz".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("baza".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("fop".into()),
                start_exclusive: None,
                limit: None,
                index_name: None,
            },
            vec![],
        );

        // exclusive
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("".into()),
                start_exclusive: true.into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("bar".into()),
                start_exclusive: true.into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );

        // limit alone
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 3.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // combos
        test(
            ScanOptions {
                prefix: Some("f".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: Some("f".into()),
                start_secondary_key: None,
                start_key: None,
                start_exclusive: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_secondary_key: None,
                start_key: Some("a".into()),
                start_exclusive: None,
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_secondary_key: None,
                start_key: Some("a".into()),
                start_exclusive: false.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_secondary_key: None,
                start_key: Some("a".into()),
                start_exclusive: false.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some("ba".into()),
                start_secondary_key: None,
                start_key: Some("bar".into()),
                start_exclusive: true.into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["baz"],
        );
    }

    #[test]
    fn test_exclusive_regular_map() {
        fn test(keys: Vec<&str>, start_key: &str, expected: Vec<&str>) {
            let test_desc = format!(
                "keys: {:?}, start_key: {:?}, expected: {:?}",
                keys, start_key, expected
            );
            let mut map = prolly::Map::new();
            for key in keys {
                map.put(key.as_bytes().to_vec(), b"value".to_vec());
            }
            let opts = ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some(start_key.to_string()),
                start_exclusive: Some(true),
                limit: None,
                index_name: None,
            };
            let got = scan(&map, opts.try_into().unwrap())
                .map(|sr| match sr {
                    ScanResult::Error(e) => panic!("{:?}", e),
                    ScanResult::Item(item) => std::str::from_utf8(item.key).unwrap(),
                })
                .collect::<Vec<&str>>();
            assert_eq!(expected, got, "{}", test_desc);
        }

        test(
            vec!["", "a", "aa", "ab", "b"],
            "",
            vec!["a", "aa", "ab", "b"],
        );
        test(vec!["", "a", "aa", "ab", "b"], "a", vec!["aa", "ab", "b"]);
        test(vec!["", "a", "aa", "ab", "b"], "aa", vec!["ab", "b"]);
        test(vec!["", "a", "aa", "ab", "b"], "ab", vec!["b"]);
    }

    #[test]
    fn test_exclusive_index_map() {
        fn test(
            entries: Vec<(&str, &[u8])>,
            start_secondary_key: &str,
            start_key: Option<&str>,
            expected: Vec<(&str, &[u8])>,
        ) {
            let test_desc = format!(
                "entries: {:?}, start_secondary_key {:?}, start_key: {:?}, expected: {:?}",
                entries, start_secondary_key, start_key, expected
            );
            let mut map = prolly::Map::new();
            for entry in entries {
                let encoded = index::encode_index_key(&index::IndexKey {
                    secondary: entry.0.as_bytes(),
                    primary: entry.1,
                })
                .unwrap();
                map.put(encoded, b"value".to_vec());
            }
            let opts = ScanOptions {
                prefix: None,
                start_secondary_key: Some(start_secondary_key.into()),
                start_key: start_key.map(Into::into),
                start_exclusive: Some(true),
                limit: None,
                index_name: Some("index".into()),
            };
            let got = scan(&map, opts.try_into().unwrap())
                .map(|sr| match sr {
                    ScanResult::Error(e) => panic!("{:?}", e),
                    ScanResult::Item(item) => {
                        (std::str::from_utf8(item.secondary_key).unwrap(), item.key)
                    }
                })
                .collect::<Vec<(&str, &[u8])>>();
            assert_eq!(expected, got, "{}", test_desc);
        }

        // Test exclusive scanning with start_secondary_key.
        let v: Vec<&[u8]> = vec![&[], &[0], &[1], &[1, 2]];
        for pk in v {
            test(
                vec![("", pk), ("a", pk), ("aa", pk), ("ab", pk), ("b", pk)],
                "",
                None,
                vec![("a", pk), ("aa", pk), ("ab", pk), ("b", pk)],
            );
            test(
                vec![("", pk), ("a", pk), ("aa", pk), ("ab", pk), ("b", pk)],
                "a",
                None,
                vec![("aa", pk), ("ab", pk), ("b", pk)],
            );
            test(
                vec![("", pk), ("a", pk), ("aa", pk), ("ab", pk), ("b", pk)],
                "aa",
                None,
                vec![("ab", pk), ("b", pk)],
            );
            test(
                vec![("", pk), ("a", pk), ("aa", pk), ("ab", pk), ("b", pk)],
                "ab",
                None,
                vec![("b", pk)],
            );
        }

        // Test exclusive scanning with start_secondary_key and start_key,
        // with the same secondary value.
        test(
            vec![
                ("a", &[]),
                ("a", &[0]),
                ("a", &[0, 0]),
                ("a", &[0, 1]),
                ("a", &[1]),
            ],
            "a",
            Some(""),
            vec![("a", &[0]), ("a", &[0, 0]), ("a", &[0, 1]), ("a", &[1])],
        );
        test(
            vec![
                ("a", &[]),
                ("a", &[0]),
                ("a", &[0, 0]),
                ("a", &[0, 1]),
                ("a", &[1]),
            ],
            "a",
            Some("\u{0000}"),
            vec![("a", &[0, 0]), ("a", &[0, 1]), ("a", &[1])],
        );
        test(
            vec![
                ("a", &[]),
                ("a", &[0]),
                ("a", &[0, 0]),
                ("a", &[0, 1]),
                ("a", &[1]),
            ],
            "a",
            Some("\u{0000}\u{0000}"),
            vec![("a", &[0, 1]), ("a", &[1])],
        );
        test(
            vec![
                ("a", &[]),
                ("a", &[0]),
                ("a", &[0, 0]),
                ("a", &[0, 1]),
                ("a", &[1]),
            ],
            "a",
            Some("\u{0000}\u{0001}"),
            vec![("a", &[1])],
        );

        // Test exclusive scanning with start_secondary_key and start_key,
        // with different secondary values.
        test(
            vec![
                ("", &[]),
                ("a", &[0]),
                ("aa", &[0, 0]),
                ("ab", &[0, 1]),
                ("b", &[1]),
            ],
            "",
            Some(""),
            vec![("a", &[0]), ("aa", &[0, 0]), ("ab", &[0, 1]), ("b", &[1])],
        );
        test(
            vec![
                ("", &[]),
                ("a", &[0]),
                ("aa", &[0, 0]),
                ("ab", &[0, 1]),
                ("b", &[1]),
            ],
            "a",
            Some("\u{0000}"),
            vec![("aa", &[0, 0]), ("ab", &[0, 1]), ("b", &[1])],
        );
        test(
            vec![
                ("", &[]),
                ("a", &[0]),
                ("aa", &[0, 0]),
                ("ab", &[0, 1]),
                ("b", &[1]),
            ],
            "aa",
            Some("\u{0000}\u{0000}"),
            vec![("ab", &[0, 1]), ("b", &[1])],
        );
        test(
            vec![
                ("", &[]),
                ("a", &[0]),
                ("aa", &[0, 0]),
                ("ab", &[0, 1]),
                ("b", &[1]),
            ],
            "ab",
            Some("\u{0000}\u{0001}"),
            vec![("b", &[1])],
        );
    }

    impl From<Vec<(&str, &str)>> for prolly::Map {
        fn from(entries: Vec<(&str, &str)>) -> Self {
            let mut map = prolly::Map::new();
            for (k, v) in entries {
                map.put(k.into(), v.into());
            }
            map
        }
    }

    #[test]
    fn test_scan_index_start_key() {
        fn test<M: Into<prolly::Map>>(map: M, opts: ScanOptions, expected: Vec<ScanItem>) {
            let map = map.into();
            let test_desc = format!("opts: {:?}, expected: {:?}", &opts, &expected);
            let opts: Result<ScanOptionsInternal, _> = opts.try_into();
            let actual = scan(&map, opts.unwrap())
                .map(|sr| match sr {
                    ScanResult::Error(e) => panic!(e),
                    ScanResult::Item(item) => item,
                })
                .collect::<Vec<_>>();
            assert_eq!(expected, actual, "{}", test_desc);
        }

        test(
            vec![("a", "1"), ("b", "2"), ("c", "3")],
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("b".into()),
                start_exclusive: false.into(),
                limit: None,
                index_name: None,
            },
            vec![
                ScanItem {
                    key: b"b",
                    secondary_key: b"",
                    val: b"2",
                },
                ScanItem {
                    key: b"c",
                    secondary_key: b"",
                    val: b"3",
                },
            ],
        );

        test(
            vec![("a", "1"), ("b", "2"), ("c", "3")],
            ScanOptions {
                prefix: None,
                start_secondary_key: None,
                start_key: Some("b".into()),
                start_exclusive: true.into(),
                limit: None,
                index_name: None,
            },
            vec![ScanItem {
                key: b"c",
                secondary_key: b"",
                val: b"3",
            }],
        );

        test(
            vec![
                ("\u{0000}as\u{0000}ap", "1"),
                ("\u{0000}bs\u{0000}bp", "2"),
                ("\u{0000}cs\u{0000}cp", "3"),
            ],
            ScanOptions {
                prefix: None,
                start_secondary_key: Some("bs".into()),
                start_key: None,
                start_exclusive: false.into(),
                limit: None,
                index_name: Some("index".into()),
            },
            vec![
                ScanItem {
                    key: b"bp",
                    secondary_key: b"bs",
                    val: b"2",
                },
                ScanItem {
                    key: b"cp",
                    secondary_key: b"cs",
                    val: b"3",
                },
            ],
        );

        test(
            vec![
                ("\u{0000}as\u{0000}ap", "1"),
                ("\u{0000}bs\u{0000}bp", "2"),
                ("\u{0000}cs\u{0000}cp", "3"),
            ],
            ScanOptions {
                prefix: None,
                start_secondary_key: Some("bs".into()),
                start_key: None,
                start_exclusive: true.into(),
                limit: None,
                index_name: Some("index".into()),
            },
            vec![ScanItem {
                key: b"cp",
                secondary_key: b"cs",
                val: b"3",
            }],
        );

        test(
            vec![
                ("\u{0000}as\u{0000}ap", "1"),
                ("\u{0000}bs\u{0000}bp1", "2"),
                ("\u{0000}bs\u{0000}bp2", "3"),
                ("\u{0000}cs\u{0000}cp", "4"),
            ],
            ScanOptions {
                prefix: None,
                start_secondary_key: Some("bs".into()),
                start_key: Some("bp2".into()),
                start_exclusive: false.into(),
                limit: None,
                index_name: Some("index".into()),
            },
            vec![
                ScanItem {
                    key: b"bp2",
                    secondary_key: b"bs",
                    val: b"3",
                },
                ScanItem {
                    key: b"cp",
                    secondary_key: b"cs",
                    val: b"4",
                },
            ],
        );

        test(
            vec![
                ("\u{0000}as\u{0000}ap", "1"),
                ("\u{0000}bs\u{0000}bp1", "2"),
                ("\u{0000}bs\u{0000}bp2", "3"),
                ("\u{0000}cs\u{0000}cp", "4"),
            ],
            ScanOptions {
                prefix: None,
                start_secondary_key: Some("bs".into()),
                start_key: Some("bp2".into()),
                start_exclusive: true.into(),
                limit: None,
                index_name: Some("index".into()),
            },
            vec![ScanItem {
                key: b"cp",
                secondary_key: b"cs",
                val: b"4",
            }],
        );
    }
}
