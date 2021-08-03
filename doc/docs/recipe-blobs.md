---
title: Blobs
slug: /recipes/blobs
---

Binary data is often referred to as "blobs". This recipe shows a few ways to use binary
data in Replicache.

The data model in Replicache is [JSON](https://www.json.org/json-en.html). JSON
does not have a way to represent binary data efficiently. Depending on your use
case there are a few ways to handle binary data.

## Base64

The simplest way to handle binary data is to
[base64](https://en.wikipedia.org/wiki/Base64) encode it. The size overhead for
base64 is roughly 4/3 (or 133%) of the size of the original data. You can reduce
this by using a compression algorithm but that adds more complexity to the code.

For example if you have a profile picture in your user data you can do something like:

```ts
// npm install base64-arraybuffer
import * as base64 from 'base64-arraybuffer';

type User = {
  id: string;
  name: string;
  picture: Uint8Array;
};

type RepUser = {
  id: string;
  name: string;
  // Note how Replicache needs to use a string here!
  picture: string;
};

const rep = new Replicache({
  mutators: {
    async setUserData(tx: WriteTransaction, user: RepUser) {
      await tx.put(`user/${user.id}`, user);
    },
  },
});

async function setUserData(rep: Replicache, user: User) {
  const {id, name, picture} = user;
  const repUser = {
    id,
    name,
    picture: base64.encode(picture.buffer),
  };
  await rep.mutate.setUserData(repUser);
}

async function getUserData(rep: Replicache, id: string): Promise<User> {
  const repUser = await rep.query(tx => tx.get(`user/${id}`));
  const {id, name, picture} = repUser;
  return {
    id,
    name,
    picture: new Uint8Array(base64.decode(picture)),
  };
}
```

### Best practices when using base64

If your binary data is not small and does not change frequently it is probably
better to keep it in its own key. This way we do not have to redownload the data
when some unrelated data changes.

If we continue with the above example, we can store the picture in its own key
by doing something like.

```ts
const rep = new Replicache({
  mutators: {
    async setUserData(tx: WriteTransaction, user: RepUser) {
      const {id, name, picture} = user;
      await tx.put(`user/${id}`, {id, name});
      await tx.put(`user/${id}/picture`, picture);
    },
  },
});

async function getUserData(rep: Replicache, id: string): Promise<User> {
  const {name, picture} = await rep.query(async tx => {
    const {name} = await tx.get(`user/${id}`);
    const picture = await tx.get(`user/${id}/picture`);
    return {name, picture};
  });
  return {
    id,
    name,
    picture: new Uint8Array(base64.decode(picture)),
  };
}
```

Now, if the name changes we do not need to resync the picture data.

## Content Addressed Data

If the data is immutable and large and is often shared between different parts
of the system it might make sense to use content addressed data. When using
content adressed data we compute a hash of the content and use that as the key.

Modern browsers have excellent support for hashing so it is easy to have the
client compute the hash.

If we continue with the above example, we can use the hash of the picture as its ID.

```ts
type RepUser = {
  id: string;
  name: string;
  picture: string;
  pictureHash: string;
};

async function computeHash(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), b =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

const rep = new Replicache({
  mutators: {
    async setUserData(tx: WriteTransaction, user: RepUser) {
      const {id, name, picture, pictureHash} = user;
      await tx.put(`user/${id}`, {id, name, pictureHash});
      await tx.put(`blob/${pictureHash}`, picture);
    },
  },
});

async function setUserData(rep: Replicache, user: User) {
  const {id, name, picture} = user;
  const pictureHash = await computeHash(picture);
  const repUser = {
    id,
    name,
    picture: base64.encode(picture.buffer),
    pictureHash,
  };
  await rep.mutate.setUserData(repUser);
}

async function getUserData(rep: Replicache, id: string): Promise<User> {
  const {name, picture} = await rep.query(async tx => {
    const {name, pictureHash} = await tx.get(`user/${id}`);
    const picture = await tx.get(`blob/${pictureHash}`);
    return {name, picture};
  });
  return {
    id,
    name,
    picture: new Uint8Array(base64.decode(picture)),
  };
}
```

## Storing binary data outside of Replicache

It is also possible to store binary data outside of Replicache. This is useful
when the data is large and you do not want the overhead of base64 encoding.
Another reason might be that you want to store the files directly to S3 or
something similar.

This gets significantly more complicated since the data is no longer kept in
sync by Replicache and you need to manage the syncing yourself.

To make things a little bit simpler we are going to treat blobs as immutable and
use content adressed data.

We are going to walk through an example where we store the blobs locally in a
[CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage).
We will continue with the profile picture as an example.

### Setting up the server

Since we need to sync the data between clients and the data is no longer managed
by Replicache we need the server to cooperate. The server will need an endpoint
to upload the data to and another endpoint to download the data from.

#### Upload endpoint

The upload endpoint will be a `PUT` handler at `/blob/<hash>`. The hash is the content address of the blob.

#### Download endpoint

This endpoint will be a `GET` handler at `/blob/<hash>`. The hash is the content address of the blob.

### Keep the blob hashes in the Client View

To sync the blobs to the client we keep the hashes of the blobs in the client
view. We subscribe to changes of a keyspace of the client view and whenever this
changes we download the files as needed.

```ts
rep.subscribe(
  (tx: ReadTransaction) => tx.scan({prefix: 'blob/'}).keys().toArray(),
  {
    async onData(keys: string[]) {
      for (const key of keys) {
        const hash = key.slice('blob/'.length);
        await downloadBlob(hash);
      }
    },
  },
);

// This should be the same as the name used with Replicache.
const cacheName = 'profile-pictures';

async function downloadBlob(hash: string) {
  // Check if we already have the blob.
  const cache = await caches.open(cacheName);
  const url = `/blob/${hash}`;
  const resp = await cache.match(url);
  if (!resp) {
    // not in cache
    const r = await fetch(url);
    if (r.ok) {
      await cache.put(url, r);
    } else {
      // Try again next time.
      // TODO: handle error better
    }
  }
}
```

#### Uploading the blob

We could just upload the blob and sync the data using a `pull`, which would in
turn download the file. This is the simplest way to do it but the downside is
that we have to redownload the file directly after we upload it. One way to
prevent this is to keep the uploaded state in the client view as well.

```ts
async function uploadBlob(rep, data, hash) {
  // Since we already have the blob here, we might as well add it to
  // the cache instead of redownloading it.
  await addBlobToCache(hash, data);
  const resp = await fetch(`/blob/${hash}`, {
    method: 'PUT',
    body: data,
  });
  await rep.mutate.addBlob({hash, uploaded: resp.ok});
}

async function addBlobToCache(hash, data) {
  const cache = await caches.open(cacheName);
  const blob = new Blob([data]);
  await cache.put(`blob/${hash}`, new Response(blob));
}

const rep = new Replicache({
  mutators: {
    async addBlob(tx, {hash, uploaded}) {
      await tx.put(`blob/${hash}`, {uploaded});
    },
  },
});
```

One thing worth pointing out here is that the `addBlob` mutator does not have to
do anything in the push response. It should be a no op.

#### Syncing the blobs

We didn't do a very good job dealing with errors above. Let's change the
subscription to deal with both upload and download now that we are keeping track
of the uploaded state.

```ts
rep.subscribe(tx => tx.scan({prefix: 'blob/'}).entries().toArray(), {
  async onData(blobs) {
    const cache = await caches.open(cacheName);
    for (const [key, value] of blobs) {
      const hash = key.slice('blob/'.length);
      const {uploaded} = value;
      await syncBlob(rep, cache, hash, uploaded);
    }
  },
});

async function syncBlob(rep, cache, hash, uploaded) {
  const response = await cache.match(blobURL(hash));
  if (response) {
    if (!uploaded) {
      const buffer = await response.arrayBuffer();
      await uploadBlob(rep, new Uint8Array(buffer), hash);
    }
  } else {
    const resp = await downloadBlob(hash);
    if (resp.ok) {
      await cache.put(blobURL(hash), resp);
      if (!uploaded) {
        // Mark as uploaded, so we don't try to upload it again.
        await rep.mutate.addBlob({hash, uploaded: true});
      }
    }
  }
}

// Change download blob to do nothing but download
async function downloadBlob(hash) {
  return await fetch(blobURL(hash));
}
```

The above code should now work for both upload and download. When we add data we
register the hash in Replicache and we store the blob in a CacheStorage cache.
We subscribe to changes in Replicache keys starting with `'blob/'` and resync
the file as needed when this changes.

#### Pull Response

The above works well for blobs added by the current client. However, if we want
to get blobs from other clients we need to ensure that the pull resonponse
includes the hashes of the blobs from them too.

In this simple case we can just check when a key starting with `user/` is
included in the pull response and also add an op the blob key in that case as
well. In a more mature system you probably want to design a more solid solution.
