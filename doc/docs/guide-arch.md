---
title: Overview
slug: /guide/arch
---

<p align="center">
  <img src="/img/diagram.png" width="650"/>
</p>

Replicache is a persistent key/value store that lives inside your web app. Use it as your app's state, in place of things like MobX, Redux, Recoil, Apollo, etc.

You don't need REST or GraphQL APIs when you use Replicache either. Instead, Replicache continuously synchronizes with your server in the background using two special endpoints: `replicache-push` and `replicache-pull`.

To learn more about the big picture of Replicache, see [the design document](./design.md).

We will be building this particular sample app using [Next.js](https://nextjs.org/), [Supabase](https://supabase.io/), and [Pusher.js](https://pusher.com/) because they are great and work nicely with Replicache. But you can use pretty much any frontend and backend stack you want — just apply these steps to your situation, or [contact us](https://replicache.dev/#contact) for help.
