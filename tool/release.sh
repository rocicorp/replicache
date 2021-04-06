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

    # Grumble. Having multiple crate types disables lto, which makes the bundles
    # significantly (~23% at time of writing) bigger. This is due to a bug
    # in Cargo: https://github.com/rust-lang/rust/issues/51009.
    #
    # But we need cdylib in order to build wasm, and we need
    # rlib in order to unit test in wasm:
    # https://github.com/rust-lang/cargo/issues/6659.
    #
    # So hack hack hack for now.
    cp Cargo.toml Cargo.toml.bak
    perl -pi -e's/crate-type = .*/crate-type = ["cdylib"]/' Cargo.toml

    rm repc.zip
    rm -rf pkg
    wasm-pack build --profiling --target web --out-dir pkg/debug -- --no-default-features
    wasm-pack build --release --target web --out-dir pkg/release -- --no-default-features
    zip -r pkg pkg
    mv pkg.zip repc.zip

    mv Cargo.toml.bak Cargo.toml

    report
)
