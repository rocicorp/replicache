#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT=$DIR/../

(
    cd $ROOT

    # Grumble. Having both these here disables lto, which makes the bundles
    # significantly (~23% at time of writing) bigger. This is due to a bug
    # in Cargo: https://github.com/rust-lang/rust/issues/51009.
    #
    # But we need cdylib in order to build wasm, and we need
    # rlib in order to unit test in wasm:
    # https://github.com/rust-lang/cargo/issues/6659.
    #
    # So hack hack hack for now.
    sed -i .bak 's/crate-type = \["cdylib", "rlib"\]/crate-type = ["cdylib"]/' Cargo.toml

    rm -rf pkg
    wasm-pack build --profiling -t web -- --no-default-features
    mv pkg/replicache_client_bg.wasm pkg/replicache_client_bg.wasm.debug
    wasm-pack build --release -t web -- --no-default-features
    brotli -f pkg/replicache_client.js pkg/replicache_client_bg.wasm

    mv Cargo.toml.bak Cargo.toml

    ls -l pkg/replicache_client.js* pkg/replicache_client_bg.was*[mr] | awk '{print $9 ": " $5}'
)
