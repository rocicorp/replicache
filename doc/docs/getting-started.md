---
title: Getting Started
slug: /
---

The easiest way to get started is with our Todo starter app.

```bash
git clone https://github.com/rocicorp/replicache-todo
cd replicache-todo
npm install
supabase init
supabase start

# Use URLs and keys printed out by `supabase start`
DATABASE_URL="<DB URL>" \
NEXT_PUBLIC_SUPABASE_URL="<API URL>" \
NEXT_PUBLIC_SUPABASE_KEY="<anon key>" \
npm run dev
```

This should get you our TodoMVC implementation:

<p class="text--center">
  <img src="/img/setup/sync.webp" width="650"/>
</p>

For detailed instructions on building a Replicache app, see the [integration guide](/guide/intro).
