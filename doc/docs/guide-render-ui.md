---
title: Render UI
slug: /guide/render-ui
---

The next step is to use the data in the Client View to render your UI.

The model is that your UI is a [pure function](https://en.wikipedia.org/wiki/Pure_function) of the data in Replicache. There is no separate in-memory state. Everything goes in Replicache.

Whenever the data in Replicache changes — either due to local mutations or syncing with the server — subscriptions will fire, and your UI components re-render. Easy.

To create a subscription, use the `useSubscribe()` React hook. You can do multiple reads and compute a result. Your React component only re-renders when the returned result changes.

Let's use a subscription to implement our chat UI. Replace `index.js` with this:

```js
import React, {useEffect, useRef, useState} from 'react';
import {Replicache} from 'replicache';
import {useSubscribe} from 'replicache-react';
import {nanoid} from 'nanoid';

export default function Home() {
  const [rep, setRep] = useState(null);

  useEffect(async () => {
    const rep = new Replicache({
      name: 'chat-user-id',
      licenseKey: '...';
      pushURL: '/api/replicache-push',
      pullURL: '/api/replicache-pull',
    });
    listen(rep);
    setRep(rep);
  }, []);

  return rep && <Chat rep={rep} />;
}

function Chat({rep}) {
  const messages = useSubscribe(
    rep,
    async tx => {
      // Note: Replicache also supports secondary indexes, which can be used
      // with scan. See:
      // https://js.replicachedev/classes/replicache.html#createindex
      const list = await tx.scan({prefix: 'message/'}).entries().toArray();
      list.sort(([, {order: a}], [, {order: b}]) => a - b);
      return list;
    },
    [],
  );

  const usernameRef = useRef();
  const contentRef = useRef();

  const onSubmit = e => {
    e.preventDefault();
    // TODO: Create message
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={onSubmit}>
        <input ref={usernameRef} style={styles.username} required />
        says:
        <input ref={contentRef} style={styles.content} required />
        <input type="submit" />
      </form>
      <MessageList messages={messages} />
    </div>
  );
}

function MessageList({messages}) {
  return messages.map(([k, v]) => {
    return (
      <div key={k}>
        <b>{v.from}: </b>
        {v.content}
      </div>
    );
  });
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  form: {
    display: 'flex',
    flexDirection: 'row',
    flex: 0,
    marginBottom: '1em',
  },
  username: {
    flex: 0,
    marginRight: '1em',
  },
  content: {
    flex: 1,
    maxWidth: '30em',
    margin: '0 1em',
  },
};

function listen(rep) {
  // TODO: Listen for changes on server
}
```

Then restart your server and navigate to [http://localhost:3000/](http://localhost:3000). You should see that we're rendering data from Replicache!

<p class="text--center">
  <img src="/img/setup/static-ui.webp" width="650"/>
</p>

This might not seem that exciting yet, but notice that if you change `replicache-pull` temporarily to return 500 (or remove it, or cause any other error, or just make it really slow), the page still renders instantly.

That's because we're rendering the data from the local cache on startup, not waiting for the server! Woo.
