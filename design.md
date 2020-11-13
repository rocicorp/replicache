# Spinner-Free Applications

"[Offline-First](https://www.google.com/search?q=offline+first)" describes a client/server architecture where
the application reads and writes to a local database on the device, and synchronizes with servers asynchronously whenever
there is connectivity.

These applications are highly desired by product teams and users because they are so much more responsive and
reliable than applications that are directly dependent upon servers. By using a local database, offline-first
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
belief they don't need to be exceptionally painful. Replicache makes conflict resolution significantly easier by capturing the *intent* of changes and then asking developers to replay that intended change later. See [Conflicts](#conflicts) for more.
* **Causal+ Consistency**: [Consistency guarantees](https://jepsen.io/consistency) make distributed systems easier to reason about and prevent confusing user-visible data anomalies. When properly integrated with your backend, Replicache provides for [Causal+ Consistency](https://jepsen.io/consistency/models/causal) across the entire system. This means that transactions are guaranteed to be applied *atomically*, in the *same order*, *across all clients*. Further, all clients will see an order of transactions that is compatible with *causal history*. Basically: all clients will end up seeing the same thing, and you're not going to have anly weirdly reordered or dropped messages. We have worked with independent Distributed Systems expert Kyle Kingsbury of Jepsen to validate these properties of our design. See [Jepsen on Replicache](https://replicache.dev/jepsen.html).

# System Overview

Replicache is an embedded cache that runs inside a mobile app, along with a companion web service that runs alongside existing server-side infrastructure. The piece in the mobile app is the *client*. The companion web service is called the *Diff Server*. And the existing server-side infrastructure is the *data layer*. The data layer could be as simple as a document database or could be a massive distributed system -- replicache doesn't care.

![Diagram](./diagram.png)

## Data Model

Replicache synchronizes updates to per-user *state* across an arbitrary number of clients. The state is a sorted map of key/value pairs. Keys are strings, values are JSON. The canonical state fetched from the server is also known as the *client view*. 

## The Big Picture

The Replicache client maintains a local cache of the user's state against which the application runs read and write transactions (often referred to as *mutations*). Both read and write transactions run immediately against the local state and mutations are additionally queued as *pending* application on the server. Periodically the client *syncs*: pushing pending mutations to the data layer, then pulling updated state from the diff sever. Mutations flow upstream, state changes flow downstream.

A key feature that makes Replicache flexible and easy to adopt is that Replicache does not take ownership of the data. The data layer owns the data and is the source of truth. Replicache runs alongside an existing data layer and requires only minimal changes to it. Processes that Replicache knows nothing about can mutate state in the data layer and Replicache clients will converge on the data layer's canonical state and correctly apply client changes on top of it.

# Detailed Design

## Replicache Client

The Replicache Client maintains:

* The ClientID, a unique identifier for this client
* The LastMutationID. Write transactions originating on a client are uniquely identified and ordered by an ordinal which increases sequentially. This ordinal serves as an idempotency token for the data layer, and is used to determine which transactions the server has applied.
* A versioned, transactional, deterministically iterable key/value store that keeps the user's state
  * Versioned meaning that we can go back to any previous version 
  * Versioned also meaning that we can _fork_ from a version, apply many transactions, then reveal this new version atomically (like git branch and merge)
  * Transactional meaning that we can read and write many keys atomically
  
Additionally, in memory, user code provides a mapping of named *mutators*. A mutator is just a function that implements a write transaction, a local mutation operation.

### Commits

Each version of the user's state is represented as a _commit_ which has:
* An immutable view of the user's state
* A *Checksum* over the state

Commits come in two flavors, those from the client and those from the server:
* *Local commits* represent a change made by a mutation executing locally against the client's cache. The set of local commits that are not yet known to be applied in the data layer are known as *pending* commits. Local commits include the *mutator name* and *arguments* that caused them, so that the mutator may be replayed later on top of new snapshot commits from the server if necessary.
* *Snapshot commits* represent a state update received from the server. They carry a *Server State ID* uniquely identifying this version of the user's state.

### API Sketch

This API sketch is in TypeScript, for JavaScript bindings. A similar API would exist for every client environment we support.

```ts
class Replicache implements ReadTransaction {
  constructor(batchURL: string, dataLayerAuth: string, diffServerAuth: string, diffServerURL: string);

  // Registers a mutator, which is used to make changes to the data.
  register<Return, Args>(name: string, mutatorImpl: MutatorImpl<Return, Args>): Mutator<Return, Args>;
  
  // Subcribe to changes to the underlying data. Every time the underlying data changes onData is called.
  // The function is also called once the first time the subscription is added.
  subscribe<R, E>(body: (tx: ReadTransaction) => Promise<R>, onData: (result: R) => void): void;
};

// A Replicache "mutator" function is just a normal JS function that accepts any JSON value, makes changes
// to Replicache, and returns and JSON value. Users can invoke mutators themselves, via the return type
// from register(). Also Replicache will itself invoke these functions during sync as part of conflict
// resolution.
type MutatorImpl<Return extends JSONValue | void, Args extends JSONValue> = (
  tx: WriteTransaction,
  args: Args,
) => Promise<Return>;

interface ReadTransaction {
  get(key: string): Promise<JSONValue | undefined>;
  has(key: string): Promise<boolean>;
  scan(startAt: string): Promise<[string, JSONValue][]>;
};

interface WriteTransaction extends ReadTransaction {
  del(key: string): Promise<void>;
  get(key: string): Promise<JSONValue | undefined>;
  has(key: string): Promise<boolean>;
  put(key: string, value: JSONValue): Promise<void>;
};
```

## Diff Server

The Diff Server is a multitenant distributed service that calculates state updates for clients in the form of deltas. The Diff Server is an optimization that reduces downstream bandwidth; conceptually it is not required, though practically it is.

For each user the Diff Server maintains a *history* of previous states. Specifically it keeps the state, ServerStateID, and checksum. Note that this history need not be complete; missing entries only affect sync performance, not correctness. 

The Diff Server provides one interface:
* *Pull*: accepts a ServerStateID from the client indicating the snapshot state against which local transactions are running. The Diff Server pulls new state for the client from the client view of the data layer, computes the delta from what the client currently has, and returns it (if any). 

## Data Layer

The data layer is a standard REST/GraphQL web service. In order to integrate Replicache the data layer must:
1. maintain a mapping from ClientID to LastMutationID (used by Push and Pull)
1. implement an interface to fetch a user's Client View, along with the user's LastMutationID (used by Pull)
1. implement an interface to execute a batch of upstream transactions (used in Push)

### Generality

As mentioned, the Data Layer could be a simple document database or a complicated distrubuted system. All Replicache cares about is that it runs trasactions and returns the user's data as json in the Client View. Beyond transactional semantics, Replicache takes no opinion on where or how the data layer stores its bits. User data might be scattered across several systems under the hood, or assembled on the fly. 

# Data Flow

Data flows from the client up to the Data Layer, and back down from the Data Layer to Diff Server to the Client. Mutations flow upstream while state updates flow downstream. Any of these processes can stop or stall indefinitely without affecting correctness.

The client tracks state changes in a git-like fashion. The Replicache client has a *master* branch of commits and keeps a *head* commit pointer representing the current state of the local key-value database. Transactions run serially against the state in the head commit. The head commmit can change in two ways:
1. write transactions: when the app runs a transaction that changes the database, the change goes into a pending commit on top of the current head. This new pending commit becomes the new head.
1. sync: when a new state update is pulled from the server replicache will:
   1. fork a new branch (the *sync branch*) from the most recent snapshot
   1. add a new snapshot with the latest state update to this sync branch; the branch now has state identical to the server
   1. compute the set of mutations to replay on the sync branch by filtering all pending commits on master that have already been applied by the server. That is, find all pending commits on master whose MutationID is greater than the LastMutationID of the new snapshot.
   1. for each mutation to replay in order, (re)apply it on the sync branch; this extends the sync branch with a pending commit for each mutation not yet seen by the server
   1. make the sync branch master by setting head of master to the head of the sync branch

## Sync

In order to sync, the client first calls Push on the Data Layer, passing all its pending mutations. The Data Layer executes the pending mutations serially. When the Data Layer executes a mutation it sets the client's LastMutationID to match as part of the same transaction. If a MutationID is less than or equal to the client's LastMutationID or more than one more, the mutation is ignored. 

The client then calls Pull on the Diff Server, passing the ServerStateID from its most recent Snapshot (as found in the most recent Snapshot commit). The Diff Server retrieves the client's LastMutationID and the *entire* state for the user from the Data Layer. The Diff Server then checks its history to see if it has a cached copy of the state the client has (as identified by ServerStateID). If so, the new and old states are diff'd and if there is a delta a new ServerStateID is assigned, the delta is returned to the client, and the new state is stored in the Diff Server's history by ServerStateID. If the server doesn't have a copy of the client's data, the full user state is returned. In all cases, the client's LastMutationID is returned. 

If Pull returns a state update to the client, the client applies the state update as described above: it forks from the previous snapshot commit, applies any local mutations that are still pending (those with mutation ids greater than the LastMutationID indicated in the state update), and reveals the new state by setting head of master to the end of the new branch. The client can now forget about all pending mutations that have been confirmed, that is, all pending mutations with MutationIDs than or equal to the LastMutationID of the most recent state.

## Mutations outside the client

There is nothing in the design that requires that changes to user data must come through Replicache. In fact we expect there is great utility in mutating the user's state outside of clients, eg in batch jobs or in response to changes in other users' clients. So long as all transactions that mutate the user's data run at a proper isolation level and leave the database in a valid state, Replicache will faithfully converge all clients to the new state. 

## Push endpoint

By design, Replicache places a minimum of constraints on the Data Layer's Push endpoint. For correctness, it must execute mutations in order and ensure that the LastMutationID is updated transactionally along with any effects. Beyond that, Replicache imposes no requirements. For example, the Push endpoint need not be synchronous; it could accept a batch of mutations, enqueue them for execution elsewhere, and return. Similarly, the Push endpoint need not be consistent with the ClientView endpoint; as long as a mutation's effects and the change to LastMutationID are revealed to the ClientView endpoint atomically, the ClientView can lag or flap without affecting correctness.

## Conflicts

Conflicts are an unavoidable part of disconnected systems, but they don't need to be exceptionally painful. 

A common initial approach to conflict resolution is to attempt to merge the *effects* of divergent forks. This doesn't work well because if all you have are the effects of two forks, it can be difficult or impossible to reason about what the correct merge is.

Imagine a simple database consisting of only a single integer set to the value `1`. A client goes offline for awhile and through a series of changes, ends up with the value `2`. Meanwhile the server value goes through a series of changes and ends at `0`:

```
... - 1 - ... 0 <- server
        \ ... 2 <- offline client
```

What is the correct resolution? We can't possibly know without more information about what the *intent* of those changes were. Were they adding? setting? multiplying? clearing? In real life applications with complex data models, many developers, and many versions of the application live at once, this problem is much worse.

A better strategy is to capture the *intent* of changes. Replicache embraces this idea by recording, alongside each change, the name of the function that created the change along with the arguments it was passed. Later, when we need to rebase forks, we *replay* one fork atop the other by re-running the series of transaction functions against the newest state. The transaction functions have arbitrary logic and can realize the intended change differently depending on the state they are running against.

For example, a transaction that reserves an hour on a user's calendar could keep a status for the reservation in the user's data. The transaction might successfully reserve the hour when running locally for the first time, setting the status to RESERVED. Later, if still pending, the transaction might be replayed on top of a state where that hour is unavailable. In this case the transaction might update the status to UNAVAILABLE. Later during Push when played against the data layer the transaction will settle on one value or the other, and the client will converge on the value in the data layer. App code can rely on subscriptions to keep the UI correctly reflective of the reservation status, or to trigger notification of the user or some other kind of followup such trying the next available slot.

We believe the Replicache model for dealing with conflicts — to have defensively written, programmatic transaction logic on the server that replays client operations on top of the latest state — leads to fewer actual conflicts in practice. Our experience is that it preserves expressiveness of the data model and is far easier to reason about than other general models for avoiding or minimizing conflicts.

## Encryption

It is possible for users of the Diff Server to encrypt data such that the operators of Diff Server cannot read it. Since the Client View is a key/value store, users could encrypt the values using a key that Diff Server doesn't have, but which clients and the Data Layer do.

If done in a simple way, this could reduce the granularity (increase the size) of the diffs that Diff Server could produce, but there is nothing stopping users from being arbitrarily fancy with the granularity at which they encrypt data. In practice, we think a good starting point for users interested in this option is to encrypt at the value level and accept the smallish resulting increase in diff sizes.

# Constraints

**Data size** A primary constraint is the size of user data. In fetching all a user's data from the data layer during each pull, Replicache makes an explicit tradeoff of bandwidth for ease of implementation and integration. For this reason we are initially limiting user data to 20MB per user and recommend the Diff Server be deployed as close to the data layer as possible (e.g., in the same Availability Zone).

A second concern with data size is that it might be infeasible to complete large state update downloads on unreliable or slow connections. We can imagine a variety of potential solutions to this problem but for simplicity's sake we are punting on the problem for now. (The size constraint above helps here as well.)

**Blobs** Any truly offline first system must have first class bidirectional support for binary assets aka blobs (eg, profile pictures). In some cases these assets should be managed transactionally along with the user's data: either you get all the data and all the blobs it references or you get none of it. In any case, there is presently no special support for blobs in replicache. Users who need blobs are advised to base64 encode them as JSON strings in the user data. We plan to address this shortcoming in the future. 

**Duplicate transaction logic** You have to implement transactions twice, once in the mobile app and once in the data layer. Bummer. We can imagine potential solutions to this problem but it's not clear if the benefit would be worth the cost, or widely usable. It is also expected that client-side transactions will be significantly simpler as they are by nature *speculative*, having the canonical answer come from the server-side implementation.
