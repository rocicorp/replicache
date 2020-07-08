#!/bin/sh

# Simple script to generate Flatbuffer sources from schema files
# while maintaining rustfmt and Clippy cleanliness.

TMP=`mktemp -d`

function atexit {
  rm -rf $TMP
}
trap atexit EXIT

flatc --rust -o $TMP src/dag/meta.fbs
rustfmt $TMP/meta_generated.rs
echo "#![allow(clippy::redundant_field_names)]\n" | \
    cat - $TMP/meta_generated.rs > $TMP/meta_generated.rs.clippy
mv $TMP/meta_generated.rs.clippy src/dag/meta_generated.rs
