---
title: Client View
slug: /guide/client-view
---

The easiest way to start a Replicache project is to design your Client View schema and start serving it. That way, you'll have data to work with when you go to build the UI in the next step.

Recall that the Client View is the string-key-JSON-value map returned by your server and used by your app. Since we're trying to build a chat app, a simple list of messages might be a good starting point for our schema:

```js
{
  "messages/D1BCF6A5-F314-4ECA-B03B-EB540A59D5E3": {
    "from": "Jane",
    "order": 1,
    "content": "Hey, what's up for lunch?"
  },
  "messages/1F4E7403-7112-4B5B-9863-62F49F588AAB": {
    "from": "Fred",
    "order": 2,
    "content": "Taaaacos"
  }
}
```

(A real app would likely separate out the user entities, but this is good enough for our purposes.)

:::note A quick word on IDs

Unlike with classic client/server apps, Replicache apps can't rely on the server to assign unique IDs. That's because the client is going to be working with data long before it reaches the server, and the client and server need a consistent way to refer to items.

Therefore, Replicache requires that clients assign IDs. Browsers have [cryptographically strong random sources](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) now, so there's no real downside to this. If you think this might block your usage of Replicache, [reach out](https://replicache.dev/#contact) — we'd like to learn more.

:::

Now that we know what our schema will look like, let's serve it. Initially, we'll just serve static data, but later we'll build it dynamically from data in the database.

Create an empty Next.js project:

```bash
npx create-next-app chat --example "https://github.com/vercel/next-learn-starter/tree/master/learn-starter"
cd chat
```

Create a file in the project at `pages/api/replicache-pull.js` with the following contents:

```js
export default async (req, res) => {
  res.json({
    // We will discuss these two fields in later steps.
    lastMutationID: 0,
    cookie: null,
    patch: [
      {op: 'clear'},
      {
        op: 'put',
        key: 'message/qpdgkvpb9ao',
        value: {
          from: 'Jane',
          content: "Hey, what's for lunch?",
          order: 1,
        },
      },
      {
        op: 'put',
        key: 'message/5ahljadc408',
        value: {
          from: 'Fred',
          content: 'tacos?',
          order: 2,
        },
      },
    ],
  });
  res.end();
};
```

You'll notice the JSON we're serving is a little different than our idealized schema above.

The response from `replicache-pull` is actually a _patch_ — a series of changes to be applied to the map the client currently has, as a result of changes that have happened on the server. Replicache applies the patch operations one-by-one, in-order, to its existing map. See [Pull Endpoint](../server-pull) for more details.

Early in development, it's easiest to just return a patch that replaces the entire state with new values, which is what we've done here. Later in this tutorial we will improve this to return only what has changed.

:::note info

Replicache forks and versions the cache internally, much like Git. You don't have to worry about changes made by the app to the client's map between pulls being clobbered by remote changes via patch. Replicache has a mechanism ensuring that local pending (unpushed) changes are always applied on top of server-provided changes (see [Local Mutations](#step-4-local-mutations)).

Also, Replicache is a _transactional_ key/value store. So although the changes are applied one-by-one, they are revealed to your app (and thus to the user) all at once because they're applied within a single transaction.

:::

Start your app with `npm run dev`, and navigate to [http://localhost:3000/api/replicache-pull](http://localhost:3000/api/replicache-pull) to ensure it's working:

<p align="center">
  <img src="/img/setup/replicache-pull.webp" width="650"/>
</p>
