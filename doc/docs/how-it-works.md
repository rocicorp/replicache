---
title: How Replicache Works
slug: /how-it-works
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<p align="center">
  <img src="/img/diagram.png" width="650"/>
</p>

Replicache is a persistent key/value store that lives inside your web app. Use it as your app's state, in place of things like MobX, Redux, Recoil, Apollo, etc.

You don't need REST or GraphQL APIs when you use Replicache either.

Instead, read and write directly from Replicache, as if it was in-memory data. Replicache continuously synchronizes itself to local storage, and also with your server using two special endpoints: `replicache-push` and `replicache-pull`.

## ① Pull

<Tabs
groupId="lang"
defaultValue="response"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}>
<TabItem value="request">

```http
POST /replicache-client-view HTTP/2
Host: myservice.com
Authorization: Bearer 51857000befac83d338df7661d00d81011d7fb10

{
  "clientID": "d1570b3a",
  "cookie": "",
}
```

  </TabItem>
  <TabItem value="response">

```http
HTTP/2 200
Content-Type: application/json

{
  "lastMutationID": 6,
  "cookie": "eae66b62",
  "patch": [
    {
      "op": "put",
      "key": "todo-39b224c1",
      "value": {
        "text": "Take out the garbage",
        "complete": false
      }
    },
    {
      "op": "put",
      "key": "todo-77173e44",
      "value": {
        "text": "Walk the dog",
        "complete": true
      }
    },
    {
      "op": "del",
      "key": "todo-5546afd4"
    }
  }
}
```

  </TabItem>
</Tabs>

Understanding Replicache starts with the _Client View_.

The Client View is the set of key/value pairs that Replicache is synchronizing at any point in time.

The server has the _authoritative_ version of the Client View: Whatever it says the Client View contains is what apps will see. The only exception is local mutations (discussed further below).

Replicache _pulls_ updates to the Client View periodically from the `/replicache-pull` endpoint on your server. Return a JSON cookie describing the last pulled state with each response.

When Replicache pulls the next time, it sends the cookie in the request. Use it to find and return the changes that have happened server-side since last pull.

:::note

You don't need to worry about clobbering pending data with your server-side changes. Replicache rewinds local pending mutations during sync and replays them "on top" of new server side state.

:::

## ② Subscribe

<Tabs
groupId="lang"
defaultValue="react"
values={[
{label: 'React', value: 'react'},
{label: 'Vanilla JS', value: 'vanilla'},
]}>
<TabItem value="react">

````js
const todos = useSubscribe(
    replicache,
    tx => tx.scanAll({prefix: '/todo/'}));

return <ul>{
  todos.map(t => <li>{t.title}</li>)
}</ul>;```

  </TabItem>
  <TabItem value="vanilla">

```js
replicache.subscribe(
  async (tx) => await tx.scanAll({prefix: '/todo/'}),
  {
    onData: (todos) => {
      this.setState({ todos });
    },
  }
);
````

  </TabItem>
</Tabs>

Build your UI using `subscribe()` (or `useSubscribe` in React).

Whenever the data in Replicache changes — either due to changes in this tab, another tab, or on the server — the affected UI automatically updates.

Replicache only refires subscriptions when the query results have actually changed, eliminating wasteful re-renders.

## ③ Optimistic Mutate

<Tabs
groupId="lang"
defaultValue="js"
values={[
{label: 'JS / React', value: 'js'},
]}>
<TabItem value="js">

```js
const rep = new Replicache({
  mutators: {
    createTodo: async (tx, {id, text, complete}) => {
      await tx.put(`/todo/${id}`, { text, complete });
    },
  }
});

// createTodo is asynchronous but subscriptions refire immediately.
// You can treat it as if it's in-memory. You don't need to await.
rep.createTodo(
  id: uuid(),
  text: this.state.todoText,
  complete: false,
});
```

  </TabItem>
</Tabs>

To make changes first register a _mutator_ with the `Replicache` constructor.

A mutator is simply a named JavaScript function with JSON- serializable arguments. Replicache executes mutators immediately (aka "optimistically") against the local cache, without waiting for server confirmation. Subscriptions re-fire instantly, and views are updated with the pending change.

It doesn't matter if the mutator computes the same result as server later will — Replicache unwinds the effects of the local mutation as soon as the effects of the remote mutation are known.

## ④ Push

<Tabs
groupId="lang"
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}>
<TabItem value="request">

```http
POST /replicache-batch HTTP/2
Host: myservice.com

{
  "clientID": "CB94867E-94B7-48F3-A3C1-287871E1F7FD",
  "mutations": [
    {
      "id": 7,
      "name": "createTodo",
      "args": {
        "id": "AE2E880D-C4BD-473A-B5E0-29A4A9965EE9",
        "title": "Fix the car",
        "complete": false
      }
    },
    {
      "id": 8,
      "name": "toggleComplete",
      "args": {
        "id": "5C2F21E8-A9CC-4DA8-91D6-97D2D1F7CECF",
        "done": true
      }
    }
  ]
}
```

  </TabItem>
  <TabItem value="response">

```http
HTTP/2 200
```

  </TabItem>
</Tabs>

Batches of pending write transactions are sent to the `/replicache-batch` endpoint on your service as connectivity allows. These requests are delayed, but otherwise normal. Your service defensively checks for conflicts, and ignores, modifies, or rejects the request.

The Replicache client assigns each mutation a unique incrementing integer. Your server must store this `lastMutationID` someplace associated with each client. It should be updated transactionally with the effects of a mutation taking place and returned in the next pull.

## ⑤,⑥ Poke, Incremental Pull

```js
const pusher = new Pusher({
  appId: 'wwwww',
  key: 'xxxxxxxxxxxxxxxx',
  secret: 'yyyyyyyyyyyyyyyyy',
  cluster: 'mt1',
  useTLS: true,
});

await pusher.trigger(`todos-${userID}`, 'poke', {});
```

After processing a mutation on your server, send a WebSocket "poke" (a message with no payload) telling any potentially affected users' devices to sync again.

You can use any WebSocket library or even a hosted service to send this poke.

Note that no user data is sent over the web socket — its only purpose is a hint to get the relevant clients to pull again soon.

## ⑦ Rebase

 Replicache rewinds the cache to the point before sync started, applies the incremental pull, and then replays any remaining unacknowledged pending mutations on top.

The final state is revealed to the UI atomically, subscriptions re-fire, and the UI refreshes.
