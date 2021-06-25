---
title: Pull Endpoint
slug: /server-pull
---

The pull endpoint is used when doing a [`pull`](api/classes/replicache#pull).

The purpose of the server pull endpoint is to send the client view to the
client. The client view is the view of the data that the client should see.

This is an HTTP POST to a URL configured by the
[`pullURL`](api/interfaces/replicacheoptions#pullurl).

```js
const rep = new Replicache({
  pullURL: '/replicache-pull',
});
```

Then when the pull happens Replicache will do an HTTP POST request:

```http
POST /replicache-pull HTTP/2
```

Replicache also sends the following HTTP request headers:

## HTTP Request Headers

```http
Content-type: application/json
Authorization: <auth>
X-Replicache-RequestID: <request-id>
```

### `Content-type`

The POST body of the request is encoded as [JSON](https://www.json.org/json-en.html).

### `Authorization`

This is a string that can be used to authorize a user. The auth token can be set
by defining [`getPullAuth`](api/classes/replicache#getpullauth). This function is
called when a request returns an HTTP `401 Unauthorized` and can be used to show
a login screen or request a new auth token as needed.

### `X-Replicache-RequestID`

The request ID is useful for debugging. It is of the form
`<clientid>-<sessionid>-<request count>`. The request count enables one to find
the request following or preceeding a given request. The sessionid scopes the
request count, ensuring the request id is probabilistically unique across
restarts (which is good enough).

This header is useful when looking at logs to get a sense of how a client got to
its current state.

## HTTP Request Body

When pulling we `POST` an HTTP request with a JSON encoded body.

```ts
type PullRequestBody = {
  clientID: string;
  cookie: JSONValue;
  lastMutationID: number;
  pullVersion: number;
  schemaVersion: string;
};
```

### `clientID`

The [`clientID`](api/classes/replicache#clientid) for this instance of
Replicache. Each web browser and instance of Replicache gets a unique client ID
keyed by the [`name`](api/interfaces/replicacheoptions#name).

### `cookie`

The cookie that was received last time a pull was done. `null` if this is the first time we do a pull.

<!-- TODO: Is this null the first time or is the property missing? -->

### `lastMutationID`

When doing a pull this is the ID of th last mutation that was applied to the client.

### `pullVersion`

This is the version number describing the type Replicache uses for the response
JSON. The current version is `0`.

### `schemaVersion`

This is something that you control and should identify the schema of your client
view. This ensures that you are sending data of the correct type so that the
client can correctly handle the data.

## HTTP Response

### HTTP Response Body

The response body is a JSON object of the [`PullResponse`](api#pullresponse) type:

```ts
type PullResponse = {
  cookie: JSONValue;
  lastMutationID: number;
  patch: PatchOperation[];
};
```

### `cookie`

The `cookie` is something that the backend completely controls. It gets sent to
the client in the pull response and gets sent back to the server in the next
pull request. Its main usecase is to allow the backend to efficiently compute
the diff between pull requests.

The cookie can be any [`JSONValue`](api#jsonvalue) but just like with HTTP cookies
you want to limit its size since it get sent on every request.

For more information on different strategies on how to use the cookie check out
the [Cookie Monster Manual](#TODO)

### `lastMutationID`

This is the ID of the last mutation that was successfully applied to from
client. See [push](#TODO) for more details.

### `patch`

Conceptually Replicache is a string-key-json-value database. The data in
Replicache that a client has access to locally is called the client view.

Instead of sending the whole client view on every pull request you can send a
patch that describes how to update the client view. This is the delta between
the last pull and now. This is where you can you use the [`cookie`](#cookie-1) to
compute the minimal delta.

The [`patch`](api#patchoperation) supports 3 operations:

```ts
type PatchOperation =
  | {
      op: 'put';
      key: string;
      value: JSONValue;
    }
  | {op: 'del'; key: string}
  | {op: 'clear'};
```

#### `put`

Puts a key value into the data store. The `key` is a `string` and the `value` is
any [`JSONValue`](api#jsonvalue).

#### `del`

Removes a key from the data store. The `key` is a `string`.

#### `clear`

Removes all the data from the client view. Basically replacing the client view
with an empty map.

This one is useful in case the cookie is missing or there was an error with
cookie, in which place it makes sense to send all the data.

## Pull Launch Checklist

- Check the [Launch Checklist](launch-checklist#all-endpoints) for the checklist
  that is common for both push and pull.
- Ensure that the [`lastMutationID`](#lastmutationid-1) returned in the response
  is read in the same transaction as the client view data (ie, is consistent
  with it)
- If there is a problem with the `cookie` (e.g., it is unusable) return all
  data. This is done by first sending a [`clear`](#clear) op followed by
  multiple [`put`](#put) ops.
- Ignore all pull requests with an unexpected
  [`pullVersion`](server-pull#pullversion).
