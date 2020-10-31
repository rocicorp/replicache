use crate::prolly;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct ScanKey {
    pub value: String,
    pub exclusive: bool,
}

impl<'a> From<&'a ScanKey> for ScanKeyInternal<'a> {
    fn from(source: &'a ScanKey) -> ScanKeyInternal<'a> {
        ScanKeyInternal {
            value: source.value.as_bytes(),
            exclusive: source.exclusive,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScanBound {
    pub key: Option<ScanKey>,
    pub index: Option<u64>,
}

impl<'a> From<&'a ScanBound> for ScanBoundInternal<'a> {
    fn from(source: &'a ScanBound) -> ScanBoundInternal<'a> {
        ScanBoundInternal {
            key: source.key.as_ref().map(|key| key.into()),
            index: source.index,
        }
    }
}

// How to use ScanOptions:
// - prefix: key prefix to scan, "" matches all of them
// - limit: only return at most this many matches
// - start can be used on its own or for pagination:
//    - start.index: return matches starting from this offset *of the prefix*
//    - start.key.value: start returning matches from this value, inclusive unless:
//    - start.key.exclusive: start returning matches *after* the value opts.start.key.value
// - if passing index_name, the prefix and opts.start.key.value will match against
//   indexed values in the same way as for non-index scans
#[derive(Debug, Deserialize, Serialize)]
pub struct ScanOptions {
    pub prefix: Option<String>,
    pub start: Option<ScanBound>,
    pub limit: Option<u64>,
    #[serde(rename = "indexName")]
    pub index_name: Option<String>,
}

// We have this separate internal verison of ScanOptions because:
// - ScanOptions works with strings whereas prolly maps work with [u8]s
// - When scanning with an index we need to transform some of the ScanOptions
//   fields before using them, namely prefix and start.key.value.
// - The code was originally written with these parallel structures to avoid
//   circular dependencies (ScanOptions lived in embed and Internal lived
//   in db).
//
// Not saying these are great reasons for doing what we are doing now, just
// that's how we got here.
//
// TODO We should probably do something to improve this parallel-struct situation.
//   Right now it is painful on account of lots of nested Option fields, and
//   not being able to use From/TryFrom because for index scans we have to
//   allocate a Vec<u8>, which needs to outlive the body of the from/try_from.
//
// Note: keys of indexed values are specially encoded so you need to populate
// prefix and start.key.value with the output of index::scan_key.
pub struct ScanOptionsInternal<'a> {
    // Note: Currently all scan constraints are allowed, in any combination. This adds
    // complexity and isn't *that* valuable as a feature, but it was what the Go
    // implementation did and was ported faithfully. It could probably be removed if it
    // starts getting in the way and no customers need it.
    pub prefix: Option<&'a [u8]>,
    pub start: Option<ScanBoundInternal<'a>>,
    pub limit: Option<u64>,
    pub index_name: Option<&'a str>,
}

impl<'a> From<&'a ScanOptions> for ScanOptionsInternal<'a> {
    fn from(source: &'a ScanOptions) -> ScanOptionsInternal<'a> {
        ScanOptionsInternal {
            prefix: source.prefix.as_ref().map(|s| s.as_bytes()),
            start: source.start.as_ref().map(|s| s.into()),
            limit: source.limit,
            index_name: source.index_name.as_deref(),
        }
    }
}
pub struct ScanKeyInternal<'a> {
    pub value: &'a [u8],
    pub exclusive: bool,
}

pub struct ScanBoundInternal<'a> {
    pub key: Option<ScanKeyInternal<'a>>,
    pub index: Option<u64>,
}

pub fn scan<'a>(
    map: &'a prolly::Map,
    opts: ScanOptionsInternal<'a>,
) -> impl Iterator<Item = prolly::Entry<'a>> {
    let mut it = map.iter().peekable();
    let mut prefix: &[u8] = &[];
    let mut from_key: &[u8] = &[];
    let mut from_index = 0u64;
    let mut exclusive = false;

    if let Some(p) = opts.prefix {
        from_key = p;
        prefix = p;
    }
    if let Some(start) = opts.start {
        if let Some(key) = start.key {
            if key.value > from_key {
                from_key = key.value;
                exclusive = key.exclusive;
            }
        }
        if let Some(index) = start.index {
            from_index = index;
        }
    }

    let key_met = |key: &[u8]| {
        if exclusive {
            key > from_key
        } else {
            key >= from_key
        }
    };

    let mut index = 0;
    while it.peek().is_some() {
        if index >= from_index && key_met(it.peek().unwrap().key) {
            break;
        }

        index += 1;
        it.next();
    }

    it.take_while(move |item: &prolly::Entry<'_>| item.key.starts_with(prefix))
        .take(opts.limit.unwrap_or(std::u64::MAX) as usize)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iter_from_key() {
        fn test(opts: ScanOptionsInternal<'_>, expected: Vec<&str>) {
            let mut map = prolly::Map::new();
            map.put(b"foo".to_vec(), b"foo".to_vec());
            map.put(b"bar".to_vec(), b"bar".to_vec());
            map.put(b"baz".to_vec(), b"baz".to_vec());
            let actual = scan(&map, opts)
                .map(|item| item.key)
                .collect::<Vec<&[u8]>>();
            let expected = expected
                .into_iter()
                .map(|e| e.as_bytes())
                .collect::<Vec<&[u8]>>();
            assert_eq!(expected, actual);
        }

        // Empty
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // Prefix alone
        test(
            ScanOptionsInternal {
                prefix: Some(b""),
                start: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: None,
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"bar"),
                start: None,
                limit: None,
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"bas"),
                start: None,
                limit: None,
                index_name: None,
            },
            vec![],
        );

        // empty start
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // start index alone
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: 0.into(),
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: 1.into(),
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: 2.into(),
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: 3.into(),
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: 7.into(),
                    key: None,
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec![],
        );

        // start key alone
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"bas",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"baz",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"baza",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"fop",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec![],
        );

        // exclusive
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"bar",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: None,
                index_name: None,
            },
            vec!["baz", "foo"],
        );

        // limit alone
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: 3.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: None,
                start: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // combos
        test(
            ScanOptionsInternal {
                prefix: Some(b"f"),
                start: None,
                limit: 0.into(),
                index_name: None,
            },
            vec![],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"f"),
                start: None,
                limit: 7.into(),
                index_name: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 2.into(),
                index_name: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: ScanBoundInternal {
                    index: 1.into(),
                    key: ScanKeyInternal {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["baz"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: ScanBoundInternal {
                    index: None,
                    key: ScanKeyInternal {
                        value: b"bar",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
                index_name: None,
            },
            vec!["baz"],
        );
        test(
            ScanOptionsInternal {
                prefix: Some(b"ba"),
                start: ScanBoundInternal {
                    index: 2.into(),
                    key: ScanKeyInternal {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
                index_name: None,
            },
            vec![],
        );
    }
}
