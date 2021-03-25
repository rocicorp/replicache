# Frequently Asked Questions

## Isn't it slow to serve the entire Client View constantly?

No question it's slower than serving only the changes.

However, it's also dramatically easier to implement. Tracking the precise per-client changes is a huge project and architectural change for most existing systems.
It's also easy to get wrong. If you get it wrong, it's difficult to _know_ that it's wrong - the clients just end up with the wrong state.

Serving the entire client view is, in contrast, much closer to how existing application stacks typically work. It's stateless. You can change the schema of your
client view at any time and it just works.

And remember that you're not serving the entire client view over the internet to the device. You're serving it to another backend service which calcluates a
diff to send to the client.

You can of course use any standard caching techniques on the backend to make it faster to serve the client view.

## How does the client know when to sync? Does it poll?

By default Replicache polls every 60 seconds. This is nice for development because it gets you up and running fast.

For production, we recommend that you set up some kind of push channel and send a "poke" over that channel to tell the client when it might be a good time to sync.

## What if I don’t have a dedicated backend? I use serverless functions for my backend

No problem. You can implement the integration points as serverless functions. Our samples are all implemented this way.
