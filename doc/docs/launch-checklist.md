---
title: Launch Checklist
slug: /launch-checklist
---

Before you launch with Replicache in your product, it's a good idea to double-check that you have correctly covered all the small details of integration. This list can help you determine if you might have missed a detail, or deferred and then forgotten about one.

## JS SDK

- If you wish to change the type of a mutator (eg, the number or type of its arguments) you must choose a new name; Replicache does not handle mutator versioning.
- At some point you will almost certainly wish to change the schema of mutations included in the `PushRequest` and the `clientView` returned in the `PullResponse`. The `ReplicacheOptions.schemaVersion` exists to facilitate this; it can be set by your app and is passed in both the `PushRequest` and `PullRequest`. Consider setting the `schemaVersion` from the start so that you don't later have to special case the "no schemaVersion" case.
- If a user's auth token can expire during a session, causing your endpoints to return a 401, be sure that re-auth is handled for **Push** and **Pull** via `getPushAuth` and `getPullAuth`.
- If you wish to store per-client state, be sure to key it by `clientID`, and not, for example, by user id which can be common to more than one client.

## All endpoints

- Ensure that you are authenticating the auth tokens configured via `ReplicacheOptions`, which are passed in the **Authentication** HTTP header.
- Your endpoints should return HTTP 401 to indicate that the user's authentication token is invalid (e.g., non-existent or expired), and that the app should re-authenticate them.
- Ensure that the `clientID` passed in does in fact belong to the authenticated user. Client IDs are random and cryptographically strong, but it is best to be safe.
- It is extremely important to ensure that your datastore and/or the way you use it guarantees the consistency and isolation properties required for Replicache to work as designed. These properties are:

  - the effects of a transaction are revealed atomically
  - within a transaction, reads are consistent, ie, reading the same item twice always results in the value, unless changed within the transaction
  - a transaction sees the effects of all previously committed transactions

  For example, MySQL's **SERIALIZABLE** isolation level provides these guarantees. We need to add here information for popular datastores, so if you would like us to look into your particular datastore or if you have any questions, please [contact us](https://replicache.dev/#contact).

## Push endpoint

- Ensure that the `lastMutationID` for a client is updated transactionally along with the pushed mutations' effects.
- All mutations with `id`s less than the client's current `lastMutationID` must be ignored.
- All mutations with `id`s greater than the client's current `lastMutationID+1` must be ignored.
- Think carefully about your error handling policy. It is possible to deadlock a client if it pushes a mutation that _always_ causes an error that stops processing. No other mutations from that client can make progress in this case. A reasonable default starting point might be along these lines:
  - If a temporary error is encountered that might be resolved on retry, halt processing mutations and return.
  - If a permanent error is encountered such that the mutation will never be appliable, ignore that mutation and increment the `lastMutationID` as if it were applied.
- Ignore all `PushRequest`s with an unexpected `version`.

## Pull endpoint

- Ensure that the `lastMutationID` returned in the response is read in the same transaction as the client view data (ie, is consistent with it)
- If there is a problem with the `cookie` (e.g., it is unusable) return all data.
- Ignore all `PullRequest`s with an unexpected `version`.
