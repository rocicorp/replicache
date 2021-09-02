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
npm install replicache replicache-react
```

  </TabItem>
  <TabItem value="js">

```bash
npm install replicache
```

  </TabItem>
</Tabs>

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
import {useSubscribe} from 'replicache';
import {nanoid} from 'nanoid';

const rep = new Replicache({
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
      id: nanoid(),
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
import {nanoid} from 'nanoid';

const rep = new Replicache({
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
  id: nanoid(),
  title: 'Pick up milk',
  order: 3,
});
```

  </TabItem>
</Tabs>

## Server Setup

In order to sync, you will need to implement _push_ an _pull_ endpoints on your server.

For detailed information, see the [integration guide](/guide/intro), or the [push](server-push)/[pull](server-pull) reference docs.
