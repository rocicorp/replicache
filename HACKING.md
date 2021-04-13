# Getting binary dependencies

`npm install` automatically downloads the correct version of the wasm bundle.

# Building against a dev version of repc

```
rm -rf bin/repc
ln -s /path/to/repc/pkg/Release bin/repc
npm run build
```

Note that if you run `npm install` subsequently, you'll nuke that link and have to create it again.

The build script copies to a new directory, so you need to re-run `npm run build` each time you modify `repc`.

# Building a release

```
go get github.com/rocicorp/repc/tool/bump
bump --root=. replicache <semver>
# push to github and merge
# pull merged commit
git tag v<semver>
git push origin v<semver>
# update release notes on github
npm publish
```

# Performance Monitoring

We continuously track performance across a variety of benchmarks. Results here:

https://replicache-sdk-js-perf-git-perf-data.rocicorp.vercel.app/
