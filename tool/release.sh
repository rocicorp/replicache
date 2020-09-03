#!/bin/sh

DIR="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../
VERSION="$(git describe --tag)"

# Strip leading "v" from git tag.
VERSION=$(echo $VERSION | sed -n -E 's/v(.*)/\1/p')

report() {
    (cd pkg/release && ls -l replicache_client.js* replicache_client_bg.was*[mr] |
        awk '{print $9 ": " $5}')
}

if [ $# -eq 1 -a "$1" == "--report" ]; then
    report
    exit 0
fi

(
    cd $ROOT

    perl -pi -e"s/version = \".*?REPLACE\"/version = \"$VERSION\"/" Cargo.toml

    # Grumble. Having multiple crate types disables lto, which makes the bundles
    # significantly (~23% at time of writing) bigger. This is due to a bug
    # in Cargo: https://github.com/rust-lang/rust/issues/51009.
    #
    # But we need cdylib in order to build wasm, and we need
    # rlib in order to unit test in wasm:
    # https://github.com/rust-lang/cargo/issues/6659.
    #
    # So hack hack hack for now.
    perl -pi -e's/crate-type = .*/crate-type = ["cdylib"]/' Cargo.toml

    rm repc.zip
    rm -rf pkg
    wasm-pack build --profiling -t web -- --no-default-features
    brotli -f pkg/replicache_client.js pkg/replicache_client_bg.wasm
    mv pkg debug
    wasm-pack build --release -t web -- --no-default-features
    brotli -f pkg/replicache_client.js pkg/replicache_client_bg.wasm
    mv pkg release
    mkdir pkg
    mv debug release pkg/
    zip -r pkg pkg
    mv pkg.zip repc.zip

    mv Cargo.toml.bak Cargo.toml

    report
)
