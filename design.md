# Spinner-Free Applications

"[Offline-First](https://www.google.com/search?q=offline+first)" describes a client/server architecture where
the application reads and writes to a local database on the device, and synchronizes with servers asynchronously whenever
there is connectivity.

These applications are highly desired by product teams and users because they are so much more responsive and
reliable than applications that are directly dependent upon servers. By using a local database as a buffer, offline-first
applications are instantaneously responsive and reliable in any network conditions.

Unfortunately, offline-first applications are also really hard to build. Many previous companies and open source projects
have sought to provide an easy framework for buiding offline-first applications, but for a variety of reasons none have
succeeded.

# Introducing Replicache

Replicache dramatically reduces the difficulty of building offline-first applications. Replicache's goals are:

1. Providing a truly offline-first programming model that is natural and easy to reason about
1. Maximizing compatability with existing application infrastructure and patterns, minimizing the work to integrate

The key features that drive Replicache's increased usability:

* **Easy Integration**: Replicache runs alongside your existing application infrastructure. You keep your existing server-side stack and client-side frameworks. Replicache doesn't take ownership of data, and is not the source of truth. Its only job is to provide bidirectional sync between your clients and your servers. This makes it easy to adopt: you can try it for just a small piece of functionality, or a small slice of users, while leaving the rest of your application the same.
* **The Client View**: To use Replicache, developers define a *client view* for each user, the data replicache keeps cached on clients of that user. Replicache keeps clients up to date with this view by periodically updating them with a minimal diff from the server. Developers don't need to worry about the minutae of getting the right changes to each client - they simply return the user's canonical data to replicache and replicache brings clients up to date with it.
* **Transactional Conflict Resolution**: Conflicts are an unavoidable part of offline-first systems, but contrary to popular
belief they don't need to be exceptionally painful. One thing that makes conflict resolution difficult is when developers are asked to to merge the *effects* of offline changes. If all you have is the *effect* of a series of changes, it can be difficult or impossible to reason about what the correct merge is. A better strategy is to capture the *intent* of changes. Replicache embraces this idea and implements merge by *replaying* local operations atop the latest, newly received server-side state. Changes are applied locally instantaneously and your backend receives a series of delayed but otherwise normal operations. It's your responsibility to handle these delayed operations reasonably. For many cases, just handling them normally yields the correct result. Sometimes something fancier is needed. Whatever the result of the operations on the server, the Client View guarantees that all clients snap into alignment on next sync.
* **Causal+ Consistency**: [Consistency guarantees](https://jepsen.io/consistency) make distributed systems easier to reason about and prevent confusing user-visible data anomalies. When properly integrated with your backend, Replicache provides for [Causal+ Consistency](https://jepsen.io/consistency/models/causal) across the entire system. This means that transactions are guaranteed to be applied *atomically*, in the *same order*, *across all clients*. Further, all clients will see an order of transactions that is compatible with *causal history*. Basically: all clients will end up seeing the same thing, and you're not going to have anly weirdly reordered or dropped messages. We have worked with independent Distributed Systems expert Kyle Kingsbury of Jepsen to validate these properties of our design. See [Jepsen Summary](jepsen-summary.md) and [Jepsen Article](jepsen-article.pdf).

# System Overview

Replicache is an embedded cache that runs inside a mobile app, along with a companion web service that runs alongside existing server-side infrastructure. The piece in the mobile app is the *client*. The companion web service is called the *Replicache Server*. And the existing server-side infrastructure is the *data layer*. The data layer could be as simple as a document database or could be a massive distributed system -- replicache doesn't care.

![Diagram](./diagram.png)

## Data Model

Replicache synchronizes updates to per-user *state* across an arbitrary number of clients. The state is a sorted map of key/value pairs. Keys are byte strings, values are JSON. The canonical state fetched from the server is also known as the *client view*. 

## The Big Picture

The Replicache client maintains a local cache of the user's state against which the application runs read and write transactions. Both read and write transactions run immediately against the local state and write transactions are additionally queued as *pending* application on the server. Periodically the client *syncs* to a *Replicache server*, pushing pending transactions to be applied and pulling updated state. Transactions flow upstream, state changes flow downstream.

The Replicache server is a proxy in front of the data layer that makes sync more efficient. During sync the Replicache server applies the pending transactions received from the client to the data layer and returns a delta for the client to apply to its state to bring it in line with the data layer.

A key feature that makes Replicache flexible and easy to adopt is that Replicache does not take ownership of the data. The data layer owns the data and is the source of truth. Replicache runs alongside an existing data layer and requires only minimal changes to it. Processes that Replicache knows nothing about can mutate state in the data layer and Replicache clients will converge on the data layer's canonical state and correctly apply client changes on top of it.

# Detailed Design

## Replicache Client

The Replicache Client maintains:

* The client ID, a unique identifier for this client
* The next transaction ordinal. Write transactions originating on a client are uniquely identified and ordered by an ordinal which increases sequentially. This ordinal ensures causal consistency with respect to the client and is used to determine which transactions the server has confirmed.
* A _bundle_ of JavaScript, provided by the app, containing _bundle functions_ implementing transactions which can be invoked by the app to read or write data.
* A versioned, transactional, deterministically iterable key/value store that keeps the user's state
  * Versioned meaning that we can go back to any previous version 
  * Versioned also meaning that we can _fork_ from a version, apply many transactions, then reveal this new version atomically (like git branch and merge)
  * Transactional meaning that we can read and write many keys atomically

### Commits

Each version of the user's state is represented as a _commit_ which has:
* An immutable view of the user's state
* A *Checksum* over the state

Commits come in two flavors, those from the client and those from the server:
* *Pending commits* represent a change made on the client that is not yet known to be applied on the server. Pending commits include the transaction that caused them so that they may be replayed on top of new confirmed commits from the server.
* *Confirmed commits* represent a state update received from the server. They carry a *State ID* uniquely identifying this version of the user's state.

### API Sketch

There are two primary APIs: the key-value interface available to JavaScript transactions run by the client and the client interface that the app uses.

```
// KVStore is accessible to JavaScript implementing transactions.
class KVStore {
  KVStore()
  bool has(String key)
  JSON get(String key)
  void put(String key, JSON value)
  List<Entry> scan(ScanOptions options)
}

// Replicache is the client interface, used by the app.
class Replicache extends KVStore {
  Replicache(AuthOpts authOpts)
  
  // Bundle registration
  Blob bundle();
  boolean setBundle(Blob blob);

  // Transaction invocation and result change notification.
  JSON exec(String functionName, List<JSON> args);
  Subscription subscribe(String functionName, List<JSON> args, void handler(JSON result));
}

struct Entry {
  String key
  JSON value
}

struct Subscription {
  void function(JSON result) handler;
  void cancel();
}

struct ScanOptions {
  String prefix
  ScanBound start
  Limit int
}

struct ScanBound {
  ScanID id
  uint64 index
}

struct ScanID {
  String value
  bool exclusive
}
```

## Replicache Server

The Replicache Server is a multitenant distributed service. It proxies transactions from the client to the data layer and sends state updates to the client in the form of deltas. The replicache server is an optimization that reduces upstream server round trips and downstream bandwidth; conceptually it is not required, though practically it is.

For each user the Replicache server maintains a *history* of previous states. Specifically it keeps the state, state id, and checksum. Note that this history need not be complete; missing entries only affect sync performance, not correctness. 

The Replicache server provides three interfaces:
* *NewClient*: generates a new client id for the client and inserts a last confirmed ordinal entry for it in the data layer (see below)
* *Push*: accepts a batch of pending transactions from the client and applies them to the data layer
* *Pull*: accepts a state id from the client indicating the last state it pulled from the server and pulls the latest user state (client view) from the data layer, computes the delta from what the client has, and returns it (if any)

## Data Layer

The data layer is a standard REST/GraphQL web service. In order to integrate Replicache the data layer must:
1. implement an interface for each transaction in the bundle (used in Push)
1. maintain a mapping from client id to last confirmed transaction ordinal (used by Push and Pull)
1. implement an interface to insert a new record into the last confirmed ordinal mapping (used by NewClient)
1. implement a client view interface to fetch a user's full state along with the client's last confirmed transaction ordinal (used by Pull)

Coupling between the replicache server and the data layer is minimized, for example by constructing data layer requests in the app, which can be execute nearly opaquely by the replicache server.

### Generality

As mentioned, the data layer could be a simple document database or a complicated distrubuted system. All replicache cares about is that it runs trasactions and returns the user's data as json. Beyond transactional semantics, replicache takes no opinion on where or how the data layer stores its bits. User data might be scattered across several systems under the hood, or assembled on the fly. 

# Data Flow

Data flows from the client up to the replicache server, into the data layer, and back down from the data layer to replicache server to the client. Transactions flow upstream while state updates flow downstream. Any of these processes can stop or stall indefinitely without affecting correctness.

The client tracks state changes in a git-like fashion. The replicache client keeps a *head* commit pointer representing the current state of the local key-value database. Transactions run serially against the state in the head commit. The head commmit can change in two ways:
1. write transactions: when the app runs a transaction that changes the database, the change goes into a pending commit on top of the current head. This new pending commit becomes the new head.
1. state updates: when a state update (new client view) is pulled from the server replicache will:
   1. fork a new branch from the previous confirmed commit
   1. add a new confirmed commit with the latest state update to this branch; the branch now has state identical to the server
   1. filter all pending commits already seen by the server. That is, those with ordinals less than the last confirmed ordinal for this client
   1. for each remaining pending commit in order, re-run it on the new branch; this extends the new branch with a pending commit for each pending transaction
   1. set head to the end of the new branch

## Sync

In order to sync, the client first calls Push on the replicache server, passing all its pending transactions. The replicache server plays the pending transactions serially in order against the data layer. When the data layer executes a transaction it increments the client's latest confirmed transaction ordinal as part of the same transaction. If a transaction's ordinal is less than or equal to the client's last confirmed transaction ordinal or more than one more, the transaction is ignored. 

The client then calls Pull on the replicache server, passing the id of the latest server state it saw (this state id is found in its most recent confirmed commit). The replicache server retrieves the client's last transaction ordinal and the client view, the *entire* state for the user from the data layer. The replicache server then checks its history to see if it has a cached copy of the state the client has (as identified by state id). If so the new and old states are diff'd and if there is a delta a new state id is assigned, the delta is returned to the client, and the new state stored in the replicache server's history by state id. If the server doesn't have a copy of the client's data, the full user state is returned. In all cases, the client's last confirmed transaction ordinal is returned. 

If Pull returns a state update to the client, the client applies a state update as described above: it forks from the previous confirmed commit, applies the state update and any pending transactions with ordinals greater than the last confirmed transaction ordinal just received, and reveals the new state by setting head to the end of the new branch. The client can now forget about all transactions that have been confirmed, that is, all pending transactions with ordinals less than or equal to the last confirmed by the server.

## Mutations outside the client

There is nothing in the design that requires that changes to user data must come through Replicache. In fact we expect there is great utility in mutating the user's state outside of clients, eg in batch jobs or in response to changes in other users' clients. So long as all transactions that mutate the user's data run at a proper isolation level and leave the database in a valid state, replicache will faithfully converge all clients to the new state. 

## Conflicts

Conflicts are a reality of disconnected operation. There is no built in conflict resolution or signaling of exceptional conditions in replicache. Conflict resolution should be implemented in the transaction itself and any signaling that might need to take place (eg, 'this action failed, let the user know') should happen in the user data. For example, a transaction that reserves an hour on a user's calendar could keep a status for the reservation in the user's data. The transaction might successfully reserve the hour when running locally for the first time, setting the status to RESERVED. Later, if still pending, the transaction might be replayed on top of a state where that hour is unavailable. In this case the transaction might update the status to UNAVAILABLE. Later during Push when played against the data layer the transaction will settle on one value or the other, and the client will converge on the value in the data layer. App code can rely on subscriptions to receive notifications about changes to the status field, eg to trigger notification of the user or some other kind of followup such trying the next available slot.

We believe the replicache model for dealing with conflicts -- to have defensively written, programmatic transaction logic that is replayed on top of new state received from the server -- leads to fewer actual conflicts in practice. Our experience is that it preserves expressiveness of the data model and is far easier to reason about than other general models for avoiding or minimizing conflicts.

# Constraints

**Data size** A primary constraint is the size of user data. In fetching all a user's data from the data layer during each pull, Replicache makes an explicit tradeoff of bandwidth for ease of implementation and integration. For this reason we are initially limiting user data to 20MB per user and recommend the replicache server be deployed as close to the data layer as possible.

A second concern with data size is that it might be infeasible to complete large state update downloads on unreliable or slow connections. We can imagine a variety of potential solutions to this problem but for simplicity's sake we are punting on the problem for now. (The size constraint above helps here as well.)

**Blobs** Any truly offline first system must have first class bidirectional support for binary assets aka blobs (eg, profile pictures). In some cases these assets should be managed transactionally along with the user's data: either you get all the data and all the blobs it references or you get none of it. In any case, there is presently no special support for blobs in replicache. Users who need blobs must manage the assets themselves or encode them to json strings in the user data. We plan to address this shortcoming in the future. 

**Duplicate transaction logic** You have to implement transactions twice, once in the client JavaScript and once in the data layer. Bummer. We can imagine potential solutions to this problem but it's not clear if the benefit would be worth the cost, or widely usable.
