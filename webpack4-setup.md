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
