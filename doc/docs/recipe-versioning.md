---
title: Versioning Data
slug: /recipes/versioning-data
---

# Versioning in Replicache

There are a few versions you as a developer needs to be aware of when working
with Replicache.

First there is the _Replicache format version_ which describes the data that
Replicache stores persistently, in IndexedDB at the moment, but it should be
treated as an implementation detail. This version is not exposed by the
Replicache API, but when Replicache changes its on disk format this version is
also changed. Whenever this changes it is a breaking change and requires a new
major release of Replicache.

Then there is the
[schemaVersion](../api/interfaces/ReplicacheOptions#schemaversion). This is
optional but it is recommended that you always provide this. It is used to
describe the format of your [mutators](../api/interfaces/ReplicacheOptions#mutators)
as well as your [client view](/guide/client-view).

Finally there is the [pullVersion](/server-pull#pullversion) and
[pushVersion](/server-push#pushversion). These are used to describe the response
format of the pull and push requests.

### schemaVersion

The `schemaVersion` version is something you control and it is used to describe
that shape of the data that the client expects as well as the signatures of the
mutators your client and server expects.

If you want to change the arguments passed to a mutator in a non backwards way
you have two options:

1. Keep the existing mutator as is and add a new mutator with a new name. On the
   server you need to keep the old mutator with the old name to support old
   clients (until there are no more old clients)
2. Change the mutator and change the `schemaVersion`. In your push handler on
   the server you now need to check the `schemaVersion` to know what mutator
   arguments the client sent.

If the data sent down in a pull response changes in a non backwards way you need
to change the `schemaVersion` passed into the Replicache constructor. The server
then needs to check what version the client is expecting and reply with data the
client understands. If the server no longer supports the client's version it can
reply with an HTTP error code. If the server replies with an error the client
will not see any new changes and the client needs to be updated. At the moment
we do not handle this case for you but in the future we are [planning to
add](https://github.com/rocicorp/replicache/issues/335) a way for the server to
tell the client that the data changed in a way that it has to start over.

### pullVersion

`pullVersion` is used to describe the format of the response of the pull
request. It is currently at `0`. You should check that the response of the pull
request matches the expected format as described in [Pull Endpoint Reference
HTTP Response](/server-pull#http-response). If the `pullVersion` does not match
the format you know how to return then you must return an HTTP error.

### pushVersion

`pushVersion` is used to describe the format of the response of the push
request. It is currently at `0`. You should check that the response of the push
request matches the expected format as described in [Push Endpoint Reference
HTTP Response](/server-push#http-response). If
the `pushVersion` does not match the format you know how to return then you must
return an HTTP error.

## IndexedDB Name

Replicacha uses a unique IndexedDB store for each
[name](/api/interfaces/ReplicacheOptions#name),
[schemaVersion](/api/interfaces/ReplicacheOptions#schemaversion) and _Replicache
format version_ tuple. This ensures that the data is not shared between
differently named Replicache instances as well as that the data in the persisted
storage can be read by Replicache and the client's Javascript code. It is
important to remember that if any of these 3 things change then Replicache
creates a new IndexedDB store.

If there is an old store with unsynced mutations we will try to push these with
the versions that the store was created with.
