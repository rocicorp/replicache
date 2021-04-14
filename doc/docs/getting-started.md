---
title: Getting Started
slug: /
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Install

<Tabs
groupId="lang"
defaultValue="hooks"
values={[
{label: 'React Hooks', value: 'hooks'},
{label: 'JavaScript', value: 'js'},
]}>
<TabItem value="hooks">

```bash
npm install replicache replicache-react-util
```

  </TabItem>
  <TabItem value="js">

```bash
npm install replicache
```

  </TabItem>
</Tabs>

## Serve Wasm Module

Replicache uses [Wasm](https://webassembly.org/) internally. Most bundlers don't deal with this well yet,
so it's easiest to just serve it as a static asset.

Copy the Replicache Wasm module to your static assets directory:

```bash
cp node_modules/replicache/out/*.wasm public/
```

:::note

You should add a [postinstall](https://docs.npmjs.com/cli/v7/using-npm/scripts) script to do this in your app, so that it will stay up to date when you update Replicache.

:::

## Client Setup

<Tabs
groupId="lang"
defaultValue="hooks"
values={[
{label: 'React Hooks', value: 'hooks'},
{label: 'JavaScript', value: 'js'},
]}>
<TabItem value="hooks">

```ts
import {Replicache} from 'replicache';
import {useSubscribe} from 'replicache-react-util';

const rep = new Replicache({
  // Put the correct path to replicache.wasm.br on your server here.
  wasmModule: '/replicache.wasm',

  mutators: {
    createTodo: (tx, args) => {
      tx.put(`/todo/${args.id}`, args);
    },
  },
});

function MyComponent() {
  const todos = useSubscribe(
    rep,
    tx => tx.scan({prefix: '/todo/'}).toArray(),
    [],
  );

  const handleClick = () => {
    rep.mutate.createTodo({
      id: Math.random().toString(32).substr(2),
      order: todos.length,
      text: 'new todo!',
    });
  };

  // ...
}
```

  </TabItem>
  <TabItem value="js">

```ts
import {Replicache} from 'replicache';

const rep = new Replicache({
  // Put the correct path to replicache.wasm[.br] on your server here.
  wasmModule: '/replicache.wasm',

  mutators: {
    createTodo: (tx, args) => {
      tx.put(`/todo/${args.id}`, args);
    },
  },
});

rep.subscribe(tx => tx.scan().toArray(), {
  onData: data => console.log('got todos', data),
});

rep.mutate.createTodo({
  id: Math.random().toString(32).substr(2),
  title: 'Pick up milk',
  order: 3,
});
```

  </TabItem>
</Tabs>

## Server Setup

In order to sync, you will need to implement _push_ an _pull_ endpoints on your server.

For detailed information, see the [integration guide](/guide/intro), or the [push](#TODO)/[pull](#TODO) reference docs.
