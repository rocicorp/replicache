use crate::prolly;

#[allow(dead_code)]
pub struct ScanKey<'a> {
    value: &'a [u8],
    exclusive: bool,
}

#[allow(dead_code)]
pub struct ScanBound<'a> {
    // TODO: Make these two fields exclusive?
    key: Option<ScanKey<'a>>,
    index: Option<u64>,
}

#[allow(dead_code)]
pub struct ScanOptions<'a> {
    // TODO: Make these two fields exclusive?
    prefix: Option<&'a [u8]>,
    start: Option<ScanBound<'a>>,
    limit: Option<u64>,
}

#[allow(dead_code)]
pub fn scan<'a>(
    map: &'a prolly::Map,
    opts: ScanOptions<'a>,
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
        fn test(opts: ScanOptions<'_>, expected: Vec<&str>) {
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
            ScanOptions {
                prefix: None,
                start: None,
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // Prefix alone
        test(
            ScanOptions {
                prefix: Some(b""),
                start: None,
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: None,
                limit: None,
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some(b"bar"),
                start: None,
                limit: None,
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some(b"bas"),
                start: None,
                limit: None,
            },
            vec![],
        );

        // empty start
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );

        // start index alone
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: 0.into(),
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: 1.into(),
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: 2.into(),
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: 3.into(),
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: 7.into(),
                    key: None,
                }
                .into(),
                limit: None,
            },
            vec![],
        );

        // start key alone
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"bas",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"baz",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"baza",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"fop",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec![],
        );

        // exclusive
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"bar",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: None,
            },
            vec!["baz", "foo"],
        );

        // limit alone
        test(
            ScanOptions {
                prefix: None,
                start: None,
                limit: 0.into(),
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: None,
                start: None,
                limit: 1.into(),
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: None,
                limit: 2.into(),
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: None,
                limit: 3.into(),
            },
            vec!["bar", "baz", "foo"],
        );
        test(
            ScanOptions {
                prefix: None,
                start: None,
                limit: 7.into(),
            },
            vec!["bar", "baz", "foo"],
        );

        // combos
        test(
            ScanOptions {
                prefix: Some(b"f"),
                start: None,
                limit: 0.into(),
            },
            vec![],
        );
        test(
            ScanOptions {
                prefix: Some(b"f"),
                start: None,
                limit: 7.into(),
            },
            vec!["foo"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 2.into(),
            },
            vec!["bar", "baz"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
            },
            vec!["bar"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: ScanBound {
                    index: 1.into(),
                    key: ScanKey {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
            },
            vec!["baz"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: ScanBound {
                    index: None,
                    key: ScanKey {
                        value: b"bar",
                        exclusive: true,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
            },
            vec!["baz"],
        );
        test(
            ScanOptions {
                prefix: Some(b"ba"),
                start: ScanBound {
                    index: 2.into(),
                    key: ScanKey {
                        value: b"a",
                        exclusive: false,
                    }
                    .into(),
                }
                .into(),
                limit: 1.into(),
            },
            vec![],
        );
    }
}
