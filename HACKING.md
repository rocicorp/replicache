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
npm install
git add package-lock.json
git commit --amend --no-edit
# push to github and merge
# pull merged commit
git tag v<semver>
git push origin v<semver>
# update release notes on github
npm publish
```

## Update docs

The docs are built from the `stable` branch so we need to rebase that to get it
to deploy a new version.

```
git checkout stable
git rebase main
git push origin stable
```

## Verify that release works

To test that a release works before creating the release we use a tarball dependency.

```
npm pack
```

### Replidraw

Check out [rocicorp/replidraw](https://github.com/rocicorp/replidraw)

Replace the replicache dependency in
[package.json](https://github.com/rocicorp/replidraw/blob/master/package.json)
with the tarball.

```
// package.json
"replicache": "file:../replicache/replicache.tar.gz",
```

Recreate the deps:

```
npm install
```

Run Replidraw with environment variables:

```
AMAZON_ACCESS_KEY_ID=... \
AMAZON_SECRET_ACCESS_KEY=... \
AMAZON_REGION=us-west-2 \
REPLIDRAW_DB_NAME=... \
REPLIDRAW_RESOURCE_ARN=... \
REPLIDRAW_SECRET_ARN=... \
REPLICHAT_DB_CONNECTION_STRING=... \
npm run dev
```

The Amazon credentials can be found in `~/.aws/credentials`. See [Replidraw
Hacking.md](https://github.com/rocicorp/replidraw/blob/master/HACKING.md) for
instructions.

You might need to initialize the DB by going to `http://localhost:3000/api/init`.

Open two windows and make sure that the changes are reflected in each window.

### Chat Sample

Check out [rocicorp/replicache-sample-chat](https://github.com/rocicorp/replicache-sample-chat)

Replace the replicache dependency in
[package.json](https://github.com/rocicorp/replicache-sample-chat/blob/master/package.json)
with the tarball.

```
// package.json
"replicache": "file:../replicache/replicache.tar.gz",
```

Recreate the deps:

```
npm install
```

Run the app with environment variables:

```
NEXT_PUBLIC_REPLICHAT_PUSHER_APP_ID=... \
NEXT_PUBLIC_REPLICHAT_PUSHER_KEY=... \
NEXT_PUBLIC_REPLICHAT_PUSHER_SECRET=... \
NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER=... \
REPLICHAT_DB_CONNECTION_STRING=... \
npm run dev
```

Log in to pusher and supabase to get the above info.

You might need to initialize the DB by going to `http://localhost:3000/api/init`.

Open two windows and make sure that the changes are reflected in each window.

### Integration Guide

Walk through the integration guide and make sure things still work.

# Performance Monitoring

We continuously track performance across a variety of benchmarks. Results here:

https://rocicorp.github.io/replicache/perf/
