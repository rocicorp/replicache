# Building a release

## Run Automated Tests

```
npm run test
```

## Manual Testing

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

Walk through [the integration guide](https://doc.replicache.dev/guide/intro) and make sure things still work.

## Build the Release

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

# note: this will push the release to the "latest" tag, which means it's what
# people will get when they `npm install`. If this is a beta release, you should
# add the `--tag=beta` flag to this command.
npm publish
```

## Check for API Changes

If there are any API changes, ensure they have been discussed before release.

## Update docs

The docs are built from the `stable` branch so we need to rebase that to get it
to deploy a new version.

```
git checkout stable
git reset --hard main
git push origin stable
```

# Performance Monitoring

We continuously track performance across a variety of benchmarks. Results here:

https://rocicorp.github.io/replicache/perf/

# Sprucing the docs

The live docs at doc.replicache.dev are served from the `stable` channel so that they reflect the stable API.

However, this means that if you do cleanup docs changes that you want to show up immediately, you need to cherry-pick the changes onto stable:

```
git checkout stable
git cherry-pick <hash-of-spruce-commit>
```

During release, below, we reset the stable branch to master, dropping these cherry-picked changes. So it's important to never do work directly on stable.
