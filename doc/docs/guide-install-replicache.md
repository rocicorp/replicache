---
title: Install
slug: /guide/install
---

Nothing to it...

```bash
npm install replicache replicache-react
```

... well, _almost_ nothing.

Replicache uses [Wasm](https://webassembly.org/) internally. Most bundlers don't deal with this well yet,
so it's easiest to just serve it as a static asset.

Copy the Replicache Wasm module to your static assets directory:

```bash
cp node_modules/replicache/out/*.wasm public/
```
