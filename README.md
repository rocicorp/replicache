# Replicache JS SDK

Realtime Sync for Any Backend Stack

![Node.js CI](https://github.com/rocicorp/replicache-sdk-js/workflows/Node.js%20CI/badge.svg)

## 👋🏽 Hi!

This page shows you how to install and setup Replicache for web applications. It assumes you already know why you want to use Replicache, how it works, and just want to get started.

For a big picture overview of Replicache, integration instructions, samples, and more, see the [main documentation](https://github.com/rocicorp/replicache) instead.

## Installation

```bash
npm install replicache

# React-specific helpers
npm install replicache-react-util
```

### Bundler Setup

If you use a bundler, you need to make the Replicache wasm files findable:

```bash
ln -s ./node_modules/replicache/out/*.wasm .
```

### Webpack 4 Setup

If you use Webpack 4 (even indirectly, like via `create-react-app`), additional setup steps are required. See [Webpack4 Setup](./webpack4-setup.md) for details.

## Example (React)

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Replicache from 'replicache';
import {useSubscribe} from 'replicache-react-util';

const rep = new Replicache({
  pushURL: '/replicache-push',
  pullURL: '/replicache-pull',
});

const createTodo = rep.register('create-todo', async (tx, {id, title}) => {
  await tx.put(`/todo/${id}`, title);
});

function Dump({rep}) {
  const data = useSubscribe(rep, tx => tx.scanAll());
  const handleClick = () => {
    createTodo({
      id: Math.random().toString(36).substr(2),
      title: 'take out the trash',
    });
  };
  return <pre onClick={handleClick}>{JSON.stringify(data, null, ' ')}</pre>;
}

ReactDOM.render(<Dump rep={rep} />, document.body);
```

## Example (Vanilla JS)

```js
import Replicache from 'replicache';

const rep = new Replicache({
  pushURL: '/replicache-push',
  pullURL: '/replicache-pull',
});

const createTodo = rep.register('create-todo', async (tx, {id, title}) => {
  await tx.put(`/todo/${id}`, title);
});

rep.subscribe(tx => tx.scanAll(), {
  onData: result => (document.body.textContent = JSON.stringify(result)),
});

window.onclick = () => {
  createTodo({
    id: Math.random().toString(36).substr(2),
    title: 'take out the trash',
  });
};
```

## Server Setup

In order to sync with your server, you need to implement the `/replicache-push` and `/replicache-pull` endpoints. See our [Integration Guide](https://github.com/rocicorp/replicache/blob/main/INTEGRATION.md) for instructions.

## Contact

Not seeing what you're looking for? [Contact us](https://replicache.dev/#contact) — we'd be happy to help.
