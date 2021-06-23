---
title: Local Mutations
slug: /guide/local-mutations
---

Next up: Local mutations. Because read-only apps are not all that useful.

With Replicache, you implement mutations once on the client-side (sometimes called _speculative_ or _optimistic_ mutations), and then again on the server (called _authoritative_ mutations).

:::note info

The two implementations need not match exactly. Replicache replaces the result of a speculative change completely with the result of the corresponding authoritative change, once it's known. This is useful because it means the speculative implementation can frequently be pretty simple, not taking into account security, complex business logic edge cases, etc.

Also, if you happen to be running JavaScript on the server, you can of course share mutation code extensively between client and server.

:::

First, let's register a _mutator_ that speculatively creates a message. In `index.js`, expand the options passed to the `Replicache` constructor with:

```js
const rep = new Replicache({
  //...
  mutators: {
    async createMessage(tx, {id, from, content, order}) {
      await tx.put(`message/${id}`, {
        from,
        content,
        order,
      });
    },
  },
});
```

This creates a mutator named "createMessage". When invoked, the implementation is run within a transaction (`tx`) and it `put`s the new message into the local map.

Now let's invoke the mutator when the user types a message. Replace the content of `onSubmit` so that it invokes the mutator:

```js
const onSubmit = e => {
  e.preventDefault();
  const last = messages.length && messages[messages.length - 1][1];
  const order = (last?.order ?? 0) + 1;
  rep.mutate.createMessage({
    id: nanoid(), // From https://www.npmjs.com/package/nanoid
    from: usernameRef.current.value,
    content: contentRef.current.value,
    order,
  });
  usernameRef.current.value = '';
  contentRef.current.value = '';
};
```

Previously we mentioned that Replicache has a mechanism that ensures that local, speculative changes are always applied on top of changes from the server. The way this works is that when Replicache pulls and applies changes from the server, any mutator invocations that have not yet been confirmed by the server are _replayed_ on top of the new server state. This is much like a git rebase, and the effects of the patch-and-replay are revealed atomically to your app.

An important consequence of the fact that Replicache will re-run mutations during sync against new versions of the cache is that a mutator's behavior should not depend on anything other than its parameters and the cache itself (it should be a pure function of its parameters, including `tx`).

For example here, we pass the generated unique ID _into_ the mutator as a param, rather than creating it inside the implementation. This may be counter-intuitive at first, but it make sense when you remember that Replicache is going to replay this transaction during sync, and we don't want the ID to change!

:::note info

Careful readers may be wondering what happens with the order field during sync. Can multiple messages end up with the same order? Yes! But in this case, what the user likely wants is for their message to stay roughly at the same position in the stream, and using the client-specified order and sorting by that roughly achieves the desired result. If we wanted better control over this, we could use [fractional indexing](https://www.npmjs.com/package/fractional-indexing) but that's not necessary in this case.

:::

Restart the server and you should now be able to make changes!

<p align="center">
  <img src="/img/setup/local-mutation.webp" width="650"/>
</p>

Notice that even though we're not saving anything to the server yet, the mutations are saved locally across sessions, and it even works across tabs. Whee!
