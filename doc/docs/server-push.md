---
title: Push Endpoint Reference
slug: /server-push
---

The Push Endpoint applies batches of mutations to the server.

For more information, see [How Replicache Works — Push](how-it-works#④-push).

## Configuration

Specify the URL with the [`pushURL`](api/interfaces/ReplicacheOptions#pushURL)
constructor option:

```js
const rep = new Replicache({
  pushURL: '/replicache-push',
});
```

## Method

Replicache always fetches the push endpoint using HTTP POST:

```http
POST /replicache-push HTTP/2
```

## Request Headers

Replicache sends the following HTTP request headers with push requests:

```http
Content-type: application/json
Authorization: <auth>
X-Replicache-RequestID: <request-id>
```

### `Content-type`

Always `application/json`.

### `Authorization`

This is a string that can be used to authorize a user. The auth token is set by
defining [`auth`](api/interfaces/ReplicacheOptions#auth).

### `X-Replicache-RequestID`

The request ID is useful for debugging. It is of the form
`<clientid>-<sessionid>-<request count>`. The request count enables one to find
the request following or preceeding a given request. The sessionid scopes the
request count, ensuring the request id is probabilistically unique across
restarts (which is good enough).

This header is useful when looking at logs to get a sense of how a client got to
its current state.

## HTTP Request Body

```ts
type PushRequestBody = {
  clientID: string;
  mutations: Mutation[];
  pushVersion: number;
  schemaVersion: string;
};

type Mutation = {
  id: number;
  name: string;
  args: JSONValue;
};
```

### `clientID`

The [`clientID`](api/classes/Replicache#clientID) of the requesting Replicache
instance.

### `mutations`

An array of mutations to be applied to the server. The `id` is a sequential
per-client unsigned integer. Each mutation will have an ID exactly one greater
than the previous one in the list. The `name` is the name of the mutator that
was invoked (e.g., from [Replicache.mutate](api/classes/Replicache#mutate)). The
`args` are the arguments that were passed to the mutator.

### `pushVersion`

Version of the type Replicache uses for the request body. The current version is `0`.

### `schemaVersion`

This is something that you control and should identify the schema of your client
view. This ensures that you are sending data of the correct type so that the
client can correctly handle the data.

The [`schemaVersion`](api/interfaces/ReplicacheOptions#schemaVersion) can be set
in the [`ReplicacheOptions`](api/interfaces/ReplicacheOptions) when creating
your instance of [`Replicache`](api/classes/Replicache).

## HTTP Response

### HTTP Response Status

- `200` for success
- `401` for auth error — Replicache will reauthenticate using
  [`getAuth`](api/classes/Replicache#getAuth) if available
- All other status codes are considered to be errors

Replicache will exponentially back off sending pushes in the case of both
network level and HTTP level errors.

### HTTP Response Body

The response body to the push endpoint is ignored.

## Semantics

### Mutation Status

The server marks a mutation with id `x` _processed_ by returning a
[`lastMutationID`](server-pull#lastmutationid) in the Pull Response greater than
or equal to `x`.

Replicache will continue retrying a mutation until the server marks the mutation
processed in this way.

### Mutations are Atomic and Ordered

The effect of a mutation and the corresponding change to the `lastMutationID` as
reported by the Pull Response must happen atomically. If the Pull Response
indicates that mutation `42` has been processed, then the effects of mutation
`42` (and all prior mutations from this client) must be present in the Pull
Response. Additionally the effects of mutation `43` (or any higher mutation from
this client) must _not_ be present in the Pull Response.

### Error Handling

If a mutation is invalid and cannot be handled, the server **must still mark the
mutation as processed** by updating the `lastMutationID`. Otherwise, the client
will keep trying to send the mutation and be blocked forever.

If the server knows that the mutation cannot be handled _now_, but will be able
to be handled later (e.g., because some server-side resource is unavailable),
the push endpoint can abort processing without updating the `lastMutationID`.
Replicache will consider the server offline and try again later.

The server can also _optionally_ include an appropriate HTTP error code for
debugging purposes (e.g., HTTP 500 for internal error) in this case, but this is
for developer convenience only and has no effect on the sync protocol.

:::caution

Temporary errors block synchronization and thus should be used carefully. A
server should only do this when it definitely will be able to process the
mutation later.

:::

## Push Launch Checklist

- Ensure that the `lastMutationID` for a client is updated transactionally along
  with the pushed mutations' effects.
- All mutations with `id`s less than the client's current `lastMutationID` must
  be ignored.
- All mutations with `id`s greater than the client's current `lastMutationID+1`
  must be ignored.
- Think carefully about your error handling policy. It is possible to deadlock a
  client if it pushes a mutation that _always_ causes an error that stops
  processing. No other mutations from that client can make progress in this
  case. A reasonable default starting point might be along these lines:
  - If a temporary error is encountered that might be resolved on retry, halt
    processing mutations and return.
  - If a permanent error is encountered such that the mutation will never be
    appliable, ignore that mutation and increment the `lastMutationID` as if it
    were applied.
- Ignore all `PushRequest`s with an unexpected `pushVersion`.
