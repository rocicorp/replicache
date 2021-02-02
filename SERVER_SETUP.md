# Replicache Server Setup

This document walks you through adding [Replicache](https://replicache.dev) support to an existing web service.

Questions? Comments? We'd love to help you evaluate Replicache — [Join us on Slack](https://slack.replicache.dev/). 
You can also refer to our fully-functional [TODO sample application](https://github.com/rocicorp/replicache-sample-todo). For information about contributing, see our [contributing guide](contributing.md).

**Note:** This document assumes you already know what Replicache is, why you might need it, and broadly how it works. If that's not true, see the [Replicache homepage](https://replicache.dev) for an overview, or the [design document](design.md) for a detailed deep-dive.

# Overview

![Picture of Replicache Architecture](diagram.png)

Replicache is a per-user cache that sits between your backend and client. To integrate Replicache, you will make changes to both your backend and your client.

This document is about the server-side setup. To learn how to build a Replicache client, see [Replicache JavaScript SDK](https://github.com/rocicorp/replicache-sdk-js).

### Step 1: Downstream Sync

Implement a *Client View* endpoint on your service that returns the data that should be available locally on the client for each user. This endpoint should return the *entire* view every time it is requested.

Replicache will frequently query this endpoint and calculate a diff to send to each client.

For example, [sample TODO app](https://github.com/rocicorp/replicache-sample-todo) returns a Client View like this:

```jsonc
{
  "lastMutationID": 0,
  "clientView": {
    "/todo/1": {
      "title": "Take out the trash",
      "description": "Don't forget to pull it to the curb.",
      "done": false,
    },
    "/todo/2": {
      "title": "Pick up milk",
      "description": "2%",
      "done": true,
    },
    ...
  }
}
```

The key/value pairs you return are up to you — Replicache just makes sure they get to the client.

See [client-view-schema.jsonc](./client-view-schema.jsonc) for the schema of the Client View response.

#### Client View Authentication

Most applications return a Client View that is specific to the calling user. Replicache supports sending user credentials through the standard `Authorization` HTTP header. If authorization fails, the Client View should return HTTP 401 (Unauthorized). The Replicache client will prompt user code to reauthenticate in that case.

Note that there is nothing Replicache-specific about Client View authenticaiton.
Presumably your service already authenticates users so that they can't fetch
each others' data.

#### Errors

All responses other than HTTP 200 with a valid JSON Client View and HTTP 401 are treated as errors by the Diff Server. The Client View response is ignored and the app is sent the last known state instead.

### Step 2: Test Downstream Sync

The request to your Client View goes through the Diff Server, which turns the full Client View your service returns into a smaller delta to be applied to the state if any that your client has. If your service is publicly accessible, you can use the Diff Server service we provide. If not, for example your Client View is running on `localhost`, you can run the Diff Server yourself. 

Note that running the Diff Server yourself is convenient for evaluating
Replicache, but in order to launch to users "for real", your Client View will
need to be publicly accessible, and you will need to create a Replicache account
as outlined below.

#### If your Client View is publicly accessible...

[Sign up for a Replicache account](https://serve.replicache.dev/signup)
if you have not already. Note your `Account ID`. You will need to pass it to the
Diff Server when manually `curl`ing requests below and in the `diffServerAuth`
field of the
[ReplicacheOptions passed to the Replicache constructor](https://replicache-sdk-js.now.sh/interfaces/replicacheoptions.html)
when instantiating your JS client.

#### Else if your Client View is NOT publicly accessible..

Download the Diff Server:

```bash
# For OSX
curl -o diffs -L https://github.com/rocicorp/diff-server/releases/latest/download/diffs-osx
chmod u+x diffs

# For Linux
curl -o diffs -L https://github.com/rocicorp/diff-server/releases/latest/download/diffs-linux
chmod u+x diffs
```

Run it:

```bash
# Begins serving on localhost:7001
./<your-platform>/diffs --disable-auth=true --db=/tmp/replicache-db --account-db=/tmp/replicache-adb serve
```

The command line above disables the Diff Server auth check so you can pass any number
for the `Account ID` in the next step.

#### Pull from the Diff Server

To *pull* from the Diff Server provide the variables listed below and `curl` the request. 

```bash
# The URL of your Client View, e.g. http://yourservice.com/replicache-client-view.
CLIENT_VIEW=<Client View URL>
# The value of the Authorization HTTP header to send in the Client View request to your
# service, identifying the user to your service.
CLIENT_VIEW_AUTH=<Client View Authorization>
# If you are using the Diff Server service, https://serve.replicache.dev/pull.
# If you are running the Diff Server yourself, its address, e.g. http://localhost:7001/pull.
DIFF_SERVER=<Diff Server URL>
# The Account ID assigned during the signup step above if using the Diff Server service,
# otherwise any integer if you are running the Diff Server yourself, e.g., 123.
ACCOUNT_ID=<Account ID>
curl -H "Authorization: $ACCOUNT_ID" -d '{ \
  "clientID": "c1", \
  "clientViewAuth": "$CLIENT_VIEW_AUTH", \
  "clientViewURL": "$CLIENT_VIEW", \
  "baseStateID": "00000000000000000000000000000000", \
  "checksum": "00000000", \
  "lastMutationID": 0, \
  "version": 3 \
  }' $DIFF_SERVER
```

Take note of the returned `stateID` and `checksum`. Then make a change to the user's Client View in your service and pull again, but specifying a `baseStateID` and `checksum` like so:

```bash
BASE_STATE_ID=<stateid-from-previous-response>
CHECKSUM=<checksum-from-previous-reseponse>
# Use the same values for the following variables that you used above.
CLIENT_VIEW=<Client View URL>
CLIENT_VIEW_AUTH=<Client View Authorization>
DIFF_SERVER=<Diff Server URL>
ACCOUNT_ID=<Account ID>
curl -H "Authorization: $ACCOUNT_ID" -d '{ \
  "clientID": "c1", \
  "clientViewAuth": "$CLIENT_VIEW_AUTH", \
  "clientViewURL": "$CLIENT_VIEW", \
  "baseStateID": "$BASE_STATE_ID", \
  "checksum": "$CHECKSUM", \
  "lastMutationID": 0, \
  "version": 3 \
  }' $DIFF_SERVER
```

You'll get a response that includes only the diff!

### Step 3: Mutation ID Storage

Next up: Writes.

Replicache identifies each change (or *Mutation*) that originates on the Replicache Client with a *MutationID*.

Your service must store the last MutationID it has processed for each client, and return it to Replicache in the Client View response. This allows Replicache to know when it can discard the speculative version of that change from the client.

Storing the last MutationIDs can be done a number of ways, but typically they are stored in the same datastore as your user data. You must update the last MutationID for a client transactionally as part of each mutation.

If you use e.g., Postgres, for your user data, you might store Replicache Change IDs in a table like:

<table>
  <tr>
    <th colspan=2>ReplicacheMutationIDs</th>
  </tr>
  <tr>
    <td>ClientID</td>
    <td>CHAR(32)</td>
  </tr>
  <tr>
    <td>LastMutationID</td>
    <td>INT64</td>
  </tr>
</table>

### Step 4: Upstream Sync

Replicache implements upstream sync by queuing calls to your service on the client-side and uploading them in batches. Your batch endpoint can be any URL, and when you set your
client up you will provide the URL via the `batchURL` parameter in the Replicache client
constructor.

Here is an example batch request to our TODO example app backend.

```json
{
  "clientID": "CB94867E-94B7-48F3-A3C1-287871E1F7FD",
  "mutations": [
    {
      "id": 7,
      "name": "todoCreate",
      "args": {
        "id": "AE2E880D-C4BD-473A-B5E0-29A4A9965EE9",
        "text": "Take out the trash",
        "order": 0.5,
        "complete": false
      }
    },
    {
      "id": 8,
      "name": "todoUpdate",
      "args": {
        "id": "AE2E880D-C4BD-473A-B5E0-29A4A9965EE9",
        "complete": true
      }
    },
    ...
  ]
}
```

The response from the batch endpoint is **completely optional** — Replicache doesn't use it for anything.

However, we recommend returning information about failed requests in the response. Replicache prints these to the developer console for debugging purposes. Here is an example response:


```json
{
  "mutationInfos": [
    {
      "id": 8,
      "error": "Invalid POST data: syntax error: ..."
    },
    {
      "id": 9,
      "error": "Backend unavailable"
    }
  ]
}
```

See [batch-request-schema.jsonc](./batch-request-schema.jsonc) for the detailed schema of the payload Replicache sends to your batch endpoint. See [batch-response-schema.jsonc](./batch-response-schema.jsonc) for the response schema.

#### Implementing the Batch Endpoint

Conceptually, the batch endpoint receives an ordered batch of mutation requests and applies them in sequence, reporting any errors back to the client. There are some sublteties to be aware of, though:

* Replicache can send mutations that have already been processed. This is in fact common when the network is spotty. This is why you need to [store the last processed mutation ID](#step-4-upstream-sync): You **MUST** skip mutations you have already seen.
* Generally, mutations for a given client **SHOULD** be processed serially and in-order to achieve [causal consistency](https://jepsen.io/consistency/models/causal). However if you have special knowledge that pairs of mutations are commutative, you can process them in parallel.
* Each mutation **MUST** eventually be acknowledged by your service, by updating the stored `lastMutationID` value for the client and returning it in the client view.
  * If a mutation can't be processed temporarily (e.g., some server-side resource is temporarily unavailable), simply return early from the batch without updating `lastMutationID`. Replicache will retry the mutation later.
  * If a mutation can't be processed permanently (e.g., the request is invalid), mark the mutation processed by updating the stored `lastMutationID`, then continue with other mutations.
* You **MUST** update `lastMutationID` atomically with handling the mutation, otherwise the state reported to the client can be inconsistent.

A sample batch endpoint for Go is available in our [TODO sample app](https://github.com/rocicorp/replicache-sample-todo/blob/master/serve/handlers/batch/batch.go).

### Step 5: Example

Here's a bash transcript demonstrating a series of requests Replicache might make against our [sample TODO app](https://github.com/rocicorp/replicache-sample-todo):

```bash
BATCH=https://replicache-sample-todo.now.sh/serve/replicache-batch
CLIENT_VIEW=https://replicache-sample-todo.now.sh/serve/replicache-client-view
DIFF_SERVER=https://serve.replicache.dev/pull
ACCOUNT_ID=1 # The Replicache TODO sample account.

NEW_USER_EMAIL=$RANDOM@example.com

# Create a new user
curl -d "{\"email\":\"$NEW_USER_EMAIL\"}" https://replicache-sample-todo.now.sh/serve/login

CLIENT_VIEW_AUTH=<user-id-from-prev-cmd>
CLIENT_ID=$RANDOM
LIST_ID=$RANDOM
TODO_ID=$RANDOM

# Create a first list and todo
curl -H "Authorization: $CLIENT_VIEW_AUTH" 'https://replicache-sample-todo.now.sh/serve/replicache-batch' --data-binary @- << EOF
{
    "clientID": "$CLIENT_ID",
    "mutations": [
        {
            "id": 1,
            "name": "createList",
            "args": {
                "id": $LIST_ID
            }
        },
        {
            "id": 2,
            "name": "createTodo",
            "args": {
                "id": $TODO_ID,
                "listID": $LIST_ID,
                "text": "Walk the dog",
                "complete": false
            }
        }
    ]
}
EOF

# If successful, you should see an empty response e.g., {"mutationInfos":[]}

# Do an initial pull from diff-server
curl -H "Authorization: $ACCOUNT_ID" $DIFF_SERVER --data-binary @- << EOF
{ 
  "clientID": "$CLIENT_ID",
  "clientViewAuth": "$CLIENT_VIEW_AUTH",
  "clientViewURL": "$CLIENT_VIEW",
  "baseStateID": "00000000000000000000000000000000",
  "checksum": "00000000",
  "lastMutationID": 0,
  "version": 3
}
EOF

BASE_STATE_ID=<stateID from prev response>
CHECKSUM=<checksum from prev response>
LAST_MUTATION_ID=<lastMutationID from prev response>

# Create a second TODO
# Do this one via the classic REST API, circumventing Replicache entirely
TODO_ID=$RANDOM
curl -H "Authorization: $CLIENT_VIEW_AUTH" https://replicache-sample-todo.now.sh/serve/todo-create --data-binary @- << EOF
{
  "id": $TODO_ID,
  "listID": $LIST_ID,
  "text": "Take out the trash",
  "complete": false
}
EOF

# Do an incremental pull from diff-server
# Note that only the second todo is returned
curl -H "Authorization: $ACCOUNT_ID" $DIFF_SERVER --data-binary @- << EOF
{ 
  "clientID": "$CLIENT_ID",
  "clientViewAuth": "$CLIENT_VIEW_AUTH",
  "clientViewURL": "$CLIENT_VIEW",
  "baseStateID": "$BASE_STATE_ID",
  "checksum": "$CHECKSUM",
  "lastMutationID": $LAST_MUTATION_ID,
  "version": 3
}
EOF
```

### Step 6: 🎉🎉

Woo! You're done with the backend integration. What's next??

- [Build the Client UI](https://github.com/rocicorp/replicache-sdk-js)
- [Check out the full version of this sample](https://github.com/rocicorp/replicache-sample-todo)
- [Check out the richer React/Babel/GCal sample](https://github.com/rocicorp/replicache-sdk-js/tree/master/sample/cal)
