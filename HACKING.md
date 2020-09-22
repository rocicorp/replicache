# Getting binary dependencies

`npm install` automatically downloads the correct version of the wasm bundle and `diff-server`.

# Building against a dev version of repc

```
rm -rf bin/repc
ln -s /path/to/repc/pkg/Release bin/repc
npm run build
```

Note that if you run `npm install` subsequently, you'll nuke that link and have to create it again.
