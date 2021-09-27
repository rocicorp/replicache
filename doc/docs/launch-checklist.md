---
title: Launch Checklist
slug: /launch-checklist
---

Before you launch with Replicache in your product, it's a good idea to double-check that you have correctly covered all the small details of integration. This list can help you determine if you might have missed a detail, or deferred and then forgotten about one.

## JS SDK

- If you wish to change the type of a mutator (eg, the number or type of its arguments) you must choose a new name; Replicache does not handle mutator versioning.
- At some point you will almost certainly wish to change the schema of mutations included in the `PushRequest` and the `clientView` returned in the `PullResponse`. The `ReplicacheOptions.schemaVersion` exists to facilitate this; it can be set by your app and is passed in both the `PushRequest` and `PullRequest`. Consider setting the `schemaVersion` from the start so that you don't later have to special case the "no schemaVersion" case.
- If a user's auth token can expire during a session, causing your endpoints to
  return a 401, be sure that re-auth is handled for **Push** and **Pull** via
  `getAuth`.
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

See [Push Launch Checklist](server-push#push-launch-checklist).

## Pull endpoint

See [Pull Launch Checklist](server-pull#pull-launch-checklist).
