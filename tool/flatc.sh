#!/bin/sh

# Simple script to generate Flatbuffer sources from schema files
# while maintaining rustfmt and Clippy cleanliness.
# Requires flatc. Easiest way to install on OSX is via homebrew
# (brew install flatbuffers).

if [ "$1" == "" ]; then
  echo "Usage: flatc.sh foo.fbs"
  exit
fi

TMP=`mktemp -d`

function atexit {
  rm -rf $TMP
}
trap atexit EXIT

DIR="$( cd "$( dirname "${1}" )" >/dev/null 2>&1 && pwd )"
BASE=$(basename $1 .fbs)
flatc --rust -o $TMP $1
rustfmt $TMP/${BASE}_generated.rs
echo "#![allow(warnings)]\n" | \
    cat - $TMP/${BASE}_generated.rs > $TMP/${BASE}_generated.rs.clippy
mv $TMP/${BASE}_generated.rs.clippy $DIR/${BASE}_generated.rs
