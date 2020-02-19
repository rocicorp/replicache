# Flutter Client Setup

#### 1. Get the SDK

Download the latest [replicant-flutter-sdk.tar.gz](https://github.com/rocicorp/replicache-flutter-sdk/releases), then unzip it.

```
tar xvzf replicache-flutter-sdk.tar.gz
```

#### 2. Add the `replicache` dependency to your `pubspec.yaml`

```
...

  cupertino_icons: ^0.1.2

+   replicache:
+     path:
+       /tmp/replicache-flutter-sdk/

...
```

#### 3. Generate an Auth Token

```bash
TODO: some bash
````

#### 4. Instantiate Replicache

```
var rep = Replicache('https://serve.replicache.dev', authToken)
```

On setup, it will pull the complete offline view. Thereafter, it will sync periodically.
Any changes discovered at the offline view will be sent as deltas to the client.

You can manually trigger a sync (e.g., in response to a server push) with the `sync()` method.

#### 5. Read Data

```dart
let todo = rep.get(id);

for (var todo in rep.scan(prefix: '/todo/')) {
  ....
}
```

You can build reactive UIs easily using subscriptions:

```dart
let stream = rep.sub(() {
  return rep.scan(prefix: '/todo/');
});

stream.when((result) {
  ....
});
```

Replicache automatically re-runs the subscription function whenever any dependent data changes in the cache.

#### 6. Write Data

You write data to Replicache by invoking _transactions_, which are just Dart functions registered under a name:

```dart
rep.register("createTodo", (String title, String description, number order, bool complete) {
  rep.put(rep.newid("/todo/"), {"title": title, "description": description, "order": order, "complete": complete});
});

rep.register("markDone", (String id, bool complete) {
  var todo = rep.get(id);
  todo["complete"] = complete;
  rep.put(id, todo);
});

await rep.write(
  rep.LocalWrite('createTodo', title, description, complete)
  rep.RemoteWrite('/createTodo', {'title': title, 'description': description, 'complete': complete}));
```

Transactions must be registered with Replicache so that they can be replayed during sync.

Replicache will execute the local write immediately, and queue the remote write. When the remote write is confirmed
with the server, Replicache will discard the local write and re-run any newer pending writes atop.

***NOTE:*** It is important that both read and write transactions are *pure*. They can only depend on their arguments
and the `rep` object. Do not use functions such as `random()` or `now()` inside Replicache transactions.

***NOTE 2:*** The server-side endpoints Replicache invokes must be *idempotent*. You can pass your own idempotency token
as part of the payload, but Replicache also provides an `X-Client-Version` header which can be used for this purpose.

## That's it!

Congratulations — you are done 🎉. Time for a cup of coffee.

## Next steps

- About IDs
- Conflict Resolution
- Batch Writes
- Review the [Flutter API](https://replicate.to/doc/flutter/)

## More questions?

See the [design doc](../README.md).
