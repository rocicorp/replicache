# Configuring Webpack 4 to Support WASM

The [core of Replicache](https://github.com/rocicorp/repc) is written in Rust and compiled to Wasm.

Browsers have great support for Wasm these days, but Webpack 4 needs a little help...

## Ensure `mainFields` is correct

If your `webpack.config.js` has a custom `mainFields`, you need to ensure it includes `module`:

```diff
  resolve: {
    ...
    mainFields: [
      ...
+     'module',
      ...
    ]
  },
```

## Add and configure `webpack-import-meta-loaer`

replicache.js uses the newer ES feature [`import.meta`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import.meta) feature to find replicache.wasm, which isn't supported by default in webpack 4.

```bash
npm install @open-wc/webpack-import-meta-loader
```

then, in `webpack.config.js`:

```diff
module: {
  rules: [
    ...
+      {
+        test: /\.js$/,
+        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
+      },
    ...
  ]
}
```

## Specify the path to the wasm module in Replicache constructor

When you instantiate Replicache, you need to tell it where the Wasm module is, since webpack is not bundling it for us:

```js
const rep = new Replicache({
  ...

  // Only needed if replicache.wasm is not a sibling to the location the JS
  // is loading from.
  wasmModule: '/node_modules/replicache/out/replicache.wasm',
});
```

If you know how to teach webpack 4 to properly bundle the wasm module, please let us know 😀.
