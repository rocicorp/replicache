---
title: Frequently Asked Questions
slug: /faq
---

## How does the client know when to sync? Does it poll?

Typically, servers send a *poke* (a content-less hint) over a websocket to tell the client to sync. There are many services you can use for this, and since no content flows over the socket there is no security/privacy concern.

It is also possible to have Replicache poll using the [`pullInterval`](api/interfaces/replicacheoptions#pullinterval) field, but we only recommend this during development.

## What if I don’t have a dedicated backend? I use serverless functions for my backend

No problem. You can implement the integration points as serverless functions. Our samples are all implemented this way.
