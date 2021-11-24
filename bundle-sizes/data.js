window.BENCHMARK_DATA = {
  "lastUpdate": 1637714472627,
  "repoUrl": "https://github.com/rocicorp/replicache",
  "entries": {
    "Bundle Sizes": [
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "da05aa3319dedf3ad93862c2349cc097e41d9382",
          "message": "feat: Add Brotli compressed bundle sizes to Bundle Sizes dashboard (#679)\n\n### Problem\r\nBundle Size dashboard https://rocicorp.github.io/replicache/bundle-sizes/ and associated alerts currently only track non-compressed sizes of bundles.  What we really care about is Brotli compressed size.\r\n\r\n### Solution\r\nAdd Brotli compressed sizes of bundles to dashboard and alert.\r\nTo do this needed to move from `self-hosted` runner to `ubuntu-latest` as `brotli` command was not available in the `self-hosted` environment (but is in `ubuntu-latest`).  This is fine as we don't care about cpu/memory isolation for this benchmark as we do for the performance benchmarks, because we are just measuring byte size.",
          "timestamp": "2021-11-09T08:59:18-08:00",
          "tree_id": "e6c7667d804131fff367901c076321d5c4d8751a",
          "url": "https://github.com/rocicorp/replicache/commit/da05aa3319dedf3ad93862c2349cc097e41d9382"
        },
        "date": 1636477222293,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34800,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184636,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6996df2a55e0ad54d319dc1ee71c2dca19658eb3",
          "message": " docs: Add Bundle Sizes dashboard to HACKING.md (#680)",
          "timestamp": "2021-11-09T22:00:36Z",
          "tree_id": "1430b464de31793607ce754674c6881cbe62252d",
          "url": "https://github.com/rocicorp/replicache/commit/6996df2a55e0ad54d319dc1ee71c2dca19658eb3"
        },
        "date": 1636495296507,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34800,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184636,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "157153+phritz@users.noreply.github.com",
            "name": "Phritz",
            "username": "phritz"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "10153e05a9c8101428580a739f37524a639a9896",
          "message": "add checklist item for passing name to constructor",
          "timestamp": "2021-11-11T16:15:40-10:00",
          "tree_id": "802a122c7481f65a65e03f6f941c85c94a7dd81c",
          "url": "https://github.com/rocicorp/replicache/commit/10153e05a9c8101428580a739f37524a639a9896"
        },
        "date": 1636683415761,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34800,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184636,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9533421da8c2dcd39a206bac26788f7e69e71ebc",
          "message": "feat: Functionality for managing the ClientMap needed for Simplified Dueling Dags (#683)\n\nIn the Simplified Dueling Dags design for Realtime Persistence, each tab is a `client` and has its own `perdag` - an instance of `dag.Store` backed by IDB.  All tabs' `perdag` instances are backed by the same IDB object store, thus they share physical storage. \r\n\r\nTo keep track of each client's current `headHash` (and additional metadata such as heartbeatTimestampMS used for garbage collection of client perdags), a new `ClientMap` data structure is introduced.  The `ClientMap` is stored in a chunk in the `perdag` at the head `'clients'`.  This `ClientMap` chunk contains refs to each client's `headHash`.\r\n\r\nThis change implements helpers for reading and writing the `ClientMap`.     \r\n\r\nSee larger design at https://www.notion.so/Simplified-DD1-1ed242a8c1094d9ca3734c46d65ffce4\r\n\r\nPart of #671",
          "timestamp": "2021-11-12T14:36:39-08:00",
          "tree_id": "d91a7c4eefbaedecebc2f6b84af8e5f307d2df6d",
          "url": "https://github.com/rocicorp/replicache/commit/9533421da8c2dcd39a206bac26788f7e69e71ebc"
        },
        "date": 1636756664638,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185009,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34802,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184655,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34683,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "debd66e99de171002dbfef9310b135b628c08f31",
          "message": "fix: improve test description grammar in clients.test.ts (#684)",
          "timestamp": "2021-11-12T22:46:14Z",
          "tree_id": "2393949e016e01ee7f832025b2c1bd05591879a3",
          "url": "https://github.com/rocicorp/replicache/commit/debd66e99de171002dbfef9310b135b628c08f31"
        },
        "date": 1636757240192,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185009,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34802,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184655,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34683,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5dcc0e1bfb263bac50b27775730a12b40c81eeaa",
          "message": "chore: Allow unused vars starting with underscore (#691)",
          "timestamp": "2021-11-16T00:48:44Z",
          "tree_id": "0aa4e7f3dfbe6460cd65527115c86e9affe08c2e",
          "url": "https://github.com/rocicorp/replicache/commit/5dcc0e1bfb263bac50b27775730a12b40c81eeaa"
        },
        "date": 1637023801445,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185009,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34802,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184655,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34683,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "02a55e50e969d1e1a8e1d7f0a5ad5e731640c01c",
          "message": "chore: Address review comments on commit 9533421 (#693)\n\nSee https://github.com/rocicorp/replicache/pull/683",
          "timestamp": "2021-11-16T16:38:06Z",
          "tree_id": "e02c7eb284ca8f71fc67ffab2f1cf6919f5902a7",
          "url": "https://github.com/rocicorp/replicache/commit/02a55e50e969d1e1a8e1d7f0a5ad5e731640c01c"
        },
        "date": 1637080751187,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185006,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34709,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6b18ad07e3c3afd2978c8c37e0a57ae34c8d16c1",
          "message": "feat: Implement heartbeats mechanism needed for Client state garbage collection for Simplified Dueling Dags\n\nSimplified Dueling Dags requires a mechanism for collecting the perdag state for Clients (i.e. tabs) which have been closed.\r\n\r\nA Client (i.e. tab) that has been closed cannot reliably clean up its own state (due to crashes and force closes).  It is difficult for other Client (i.e. tabs) to determine if a tab has been closed and is gone for ever, or just has been frozen for a long time.  The approach taken here is to have each Client update a heartbeatTimestampMS once per minute while it is active.  Other Client's then collect a Client only if it hasn't been active for a very long time (current plan is 1 week).\r\n\r\nA client's heartbeat time is also updated when its memdag is persisted to the perdag.  This way the \"newest\" client state is roughly the state of the client with the most recent heartbeat time, which is useful for determining which client state a new client should choose for bootstrapping. \r\n\r\nA timestamp is used (as opposed to a heartbeat counter) in order to support expiration periods much longer than a typical session (e.g. 7 days).\r\n\r\nSee larger design at https://www.notion.so/Simplified-DD1-1ed242a8c1094d9ca3734c46d65ffce4\r\n\r\nPart of #671",
          "timestamp": "2021-11-16T16:54:14Z",
          "tree_id": "866491cc5cf051f5787bad2d3151b26e9be3405c",
          "url": "https://github.com/rocicorp/replicache/commit/6b18ad07e3c3afd2978c8c37e0a57ae34c8d16c1"
        },
        "date": 1637081717532,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185006,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34709,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9a4a5100173ac577e167f5838c6b35d4a7b60cf1",
          "message": "feat: Implements Client state Garbage Collection for Simplified Dueling Dags (#689)\n\nSimplified Dueling Dags requires a mechanism for collecting the perdag state for Clients (i.e. tabs) which have been closed.\r\n\r\nEvery **five minutes**, each Client collects any Clients that haven't updated their heartbeat timestamp **for at least seven days**. \r\n\r\nSee larger design at https://www.notion.so/Simplified-DD1-1ed242a8c1094d9ca3734c46d65ffce4\r\n\r\nPart of #671",
          "timestamp": "2021-11-16T17:26:47Z",
          "tree_id": "57bd8b69d05ccce9336b15c615de5c24a9ada2c0",
          "url": "https://github.com/rocicorp/replicache/commit/9a4a5100173ac577e167f5838c6b35d4a7b60cf1"
        },
        "date": 1637083672990,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185006,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34709,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ee9ed0ded7638b9881c487a0814e60cfabd2ddf4",
          "message": "refactor: Skip creating a Chunk & Commit in migrate (#694)\n\nThese extra objects are not needed here and makes other things harder to\r\nachieve.",
          "timestamp": "2021-11-16T19:35:39Z",
          "tree_id": "54dcd7f6326037bbc924d0226f6b0b4b510061c1",
          "url": "https://github.com/rocicorp/replicache/commit/ee9ed0ded7638b9881c487a0814e60cfabd2ddf4"
        },
        "date": 1637091409965,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 184996,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34808,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 184642,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34713,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "123687f2b772e8255894fb5820aaf12d831e9b4e",
          "message": "refactor: Make the hash function a property of the dag store (#695)\n\nThe dag store now takes the function to use when computing the hash of a\r\nchunk. This is needed because we want to use differn hash functions for\r\nmemdag and perdag.\r\n\r\nTowards #671",
          "timestamp": "2021-11-16T13:34:20-08:00",
          "tree_id": "f5ef20ab65404b9695d9151f722b46301da67cba",
          "url": "https://github.com/rocicorp/replicache/commit/123687f2b772e8255894fb5820aaf12d831e9b4e"
        },
        "date": 1637098524749,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185761,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185407,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34797,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "63a05379b317a84e7ad80fb5624370619e3e790a",
          "message": "fix: Fix bug where pusher/puller/pushURL/pullURL set after construction are ignored if initially none set. (#696)\n\nAlso updates tests to cover these cases.\r\n\r\nFixes #685",
          "timestamp": "2021-11-16T23:19:53Z",
          "tree_id": "0acd8b7078c5237cdf8a3543315696191fe046f4",
          "url": "https://github.com/rocicorp/replicache/commit/63a05379b317a84e7ad80fb5624370619e3e790a"
        },
        "date": 1637104855244,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185504,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34875,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185150,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34736,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d85d41e12214c88c9d7a9cfa7976ede120379fd8",
          "message": "refactor: Do not use temp hash as a sign of mutability in B+Tree (#697)\n\nWe used to use isTempHash to determine if the B+Tree node was mutable or\r\nnot (isTempHash === true => mutable). This is not going to work when the\r\nwhole MemDag is going to use temp hashes. Instead, use a flag on the\r\nnode.\r\n\r\nTowards #671",
          "timestamp": "2021-11-16T23:28:45Z",
          "tree_id": "2b022f710fa27dc85aa2024bf2d2a08af9d64efc",
          "url": "https://github.com/rocicorp/replicache/commit/d85d41e12214c88c9d7a9cfa7976ede120379fd8"
        },
        "date": 1637105384344,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185606,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34910,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185252,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34746,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "126b6a7e1918544d691bcd1a79f5ddae2f8dca0c",
          "message": "refactor: Make assertValidChunk part of dag Store (#698)\n\nFor memdag we will allow temp hashes but for perdag we will not.\r\n\r\nTowards #671",
          "timestamp": "2021-11-17T00:44:32Z",
          "tree_id": "5092a6fdda5e931512d51568d3954760d9a9bb66",
          "url": "https://github.com/rocicorp/replicache/commit/126b6a7e1918544d691bcd1a79f5ddae2f8dca0c"
        },
        "date": 1637109924751,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185875,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34884,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185521,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34792,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7ad07333fb6ea30a0e431a74aa942b3a5efe9997",
          "message": "refactor: Move createChunk to dag.Write (#699)\n\nIt was not needed on dag.Read.\r\n\r\nFollowup to #695",
          "timestamp": "2021-11-17T18:30:26Z",
          "tree_id": "611160eae10e771db88caa74c996b8e28f2f1ec0",
          "url": "https://github.com/rocicorp/replicache/commit/7ad07333fb6ea30a0e431a74aa942b3a5efe9997"
        },
        "date": 1637173893837,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185811,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34937,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185457,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34775,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "78c046eb0a372a03b64cdfda1f47a14e3a637ad8",
          "message": "refactor: Rename _kvr to _tx (#700)\n\nSince it is either a kv.Read or a kv.Write transaction.\r\n\r\nFollowup to #698",
          "timestamp": "2021-11-17T18:38:55Z",
          "tree_id": "4ef7b82fef552d81542061cae911535c52e96384",
          "url": "https://github.com/rocicorp/replicache/commit/78c046eb0a372a03b64cdfda1f47a14e3a637ad8"
        },
        "date": 1637174399505,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 185790,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34921,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185436,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34783,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "268c15c4d6043a93763c89b15941cde1580e96e5",
          "message": "refactor: Add back parse to dag/key.ts (#701)\n\nI need it for a test I'm writing...",
          "timestamp": "2021-11-17T20:25:51Z",
          "tree_id": "925063e5e1fb7037ce2085ee200eaa448f62396b",
          "url": "https://github.com/rocicorp/replicache/commit/268c15c4d6043a93763c89b15941cde1580e96e5"
        },
        "date": 1637180806946,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186070,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185716,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34874,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "71d5cbee735b4e55ab03fa1ad4b1da043d23b250",
          "message": "Update HACKING.md",
          "timestamp": "2021-11-17T15:03:56-08:00",
          "tree_id": "98955436162abc5380c12335eb0fa5ba13e1dec2",
          "url": "https://github.com/rocicorp/replicache/commit/71d5cbee735b4e55ab03fa1ad4b1da043d23b250"
        },
        "date": 1637190296158,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186070,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185716,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34874,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "phritz@users.noreply.github.com",
            "name": "phritz",
            "username": "phritz"
          },
          "committer": {
            "email": "157153+phritz@users.noreply.github.com",
            "name": "Phritz",
            "username": "phritz"
          },
          "distinct": true,
          "id": "e9da6cfdbe765d23d9719760bc4fc54df6c5af10",
          "message": "remove weblock test",
          "timestamp": "2021-11-17T17:12:43-10:00",
          "tree_id": "7ae962619ddfb419f29909ae36807ca30149c19f",
          "url": "https://github.com/rocicorp/replicache/commit/e9da6cfdbe765d23d9719760bc4fc54df6c5af10"
        },
        "date": 1637205226509,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186070,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185716,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34874,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8c50cb4dce1267fdf89c9bf67ce2e3b00df128b0",
          "message": "fix: Fix migraion of head (#708)\n\nThe migration from v1 to v2 was not updating the head so the migrated\r\ndag was GC'ed and the old dag was being kept.\r\n\r\nFixes #704",
          "timestamp": "2021-11-18T21:37:11Z",
          "tree_id": "f481b8d22633ae0b0d4544e2395fae3e45ed7dd9",
          "url": "https://github.com/rocicorp/replicache/commit/8c50cb4dce1267fdf89c9bf67ce2e3b00df128b0"
        },
        "date": 1637271499749,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186129,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34951,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185775,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34884,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f0c31e44c1d45be7a3382f6899cca9ad4bd80f3e",
          "message": "fix: Write the empty BTree node to the dag store (#709)\n\nPreviously we used the empty hash and didn't write this chunk. It meant\r\nthat there were refs that were the empty hash and the system had to be\r\nresilient to the valueHash being an empty hash etc.",
          "timestamp": "2021-11-18T21:45:31Z",
          "tree_id": "11c04e445113a25530dbb21cfc193a0423808496",
          "url": "https://github.com/rocicorp/replicache/commit/f0c31e44c1d45be7a3382f6899cca9ad4bd80f3e"
        },
        "date": 1637271994228,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186270,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 185916,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34858,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4bcae282030d4ce84e2ef5cb3fc45f16e152be22",
          "message": "refactor: Add PersistGatherVisitor (#702)\n\nAdd a DB/Dag Visitor -- This walks the entire dag using a semantic\r\nvisitor, which knows what each chunk represents.\r\n\r\nThen implement the PersistGatherVisitor as a visitor of the Dag Visitor\r\nwhich stops the traversal when it finds a non temp hash. It collects all\r\nthe chunks it sees and exposes them as a property.\r\n\r\nTowards #671",
          "timestamp": "2021-11-18T18:01:41-08:00",
          "tree_id": "c4956185616bada4ed21491ce0942334b5dd7531",
          "url": "https://github.com/rocicorp/replicache/commit/4bcae282030d4ce84e2ef5cb3fc45f16e152be22"
        },
        "date": 1637287367817,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186447,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35103,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186093,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34960,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "phritz@users.noreply.github.com",
            "name": "phritz",
            "username": "phritz"
          },
          "committer": {
            "email": "157153+phritz@users.noreply.github.com",
            "name": "Phritz",
            "username": "phritz"
          },
          "distinct": true,
          "id": "f63c28be2033af13c3dd6bc0c1fc272596b38480",
          "message": "address code review comments",
          "timestamp": "2021-11-18T20:46:37-10:00",
          "tree_id": "ee51c3f62b883eb3bdc7f044965b4d27ac756787",
          "url": "https://github.com/rocicorp/replicache/commit/f63c28be2033af13c3dd6bc0c1fc272596b38480"
        },
        "date": 1637304459481,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187025,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35162,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186671,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35000,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1fbcba8027a7a7aea04e3d6844b43128837ad422",
          "message": "refactor: remove default value of Meta for Commit's  M type param to improve typing of Commit (#715)\n\n### Problem\r\nHaving a default value of Meta for Commit's M type param led to less specific typing in many places. \r\n\r\n### Solution\r\nRemove the default and make typing more specific where possible.",
          "timestamp": "2021-11-19T12:20:41-08:00",
          "tree_id": "955289bad92a5f1b732439ac32d077b978ce5ff6",
          "url": "https://github.com/rocicorp/replicache/commit/1fbcba8027a7a7aea04e3d6844b43128837ad422"
        },
        "date": 1637353310708,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186946,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35137,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186592,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34990,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "186bb707de1b2d421b61d291a3bc010b05c74b22",
          "message": "fix: Provide more details to logger when push or pull fails (#716)\n\n### Problem\r\nPush and pull error logging lacks sufficient detail to debug errors.\r\n\r\nA pull failure currently logs to info (and a push error logs essentially the same):\r\n`Pull returned: PullError: Failed to pull`\r\n\r\nNot the most useful logging.  However, our `PushError` and `PullError` classes have a `cause?: Error` property with details on the underlying cause, it is just not logged.\r\n\r\n### Solution\r\nIf the error is a `PushError` or `PullError`, log the cause.\r\n\r\nUpdate log format to include stack traces for both the error, and cause.\r\n\r\nAlso update to use `error` instead of `info` logging.\r\n\r\nCloses #690",
          "timestamp": "2021-11-19T13:13:11-08:00",
          "tree_id": "950b3b51a836e7bd7295f81a785b14d499788f5d",
          "url": "https://github.com/rocicorp/replicache/commit/186bb707de1b2d421b61d291a3bc010b05c74b22"
        },
        "date": 1637356451353,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187112,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35140,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186758,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35019,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "15703ca4396be61447be6e572600e6b7fac5b9d6",
          "message": "refactor: Optimize scan (#717)\n\nThere are two kinds of optimizations in here:\r\n\r\n1. Get rid of intermediate for await loops.\r\n2. Get rid of yield*\r\n\r\nBoth of these adds extra Promise and IteratorResult objects.\r\n\r\nBy passing the convertEntry function all the way down into the BTree\r\niterator we do not need the intermediate for await loops.\r\n\r\nIn a few places we can return the async iterable iterator instead of\r\nyield* it. This only works if the function/method is not `async` of\r\n`async *`.\r\n\r\nTowards #711",
          "timestamp": "2021-11-19T20:42:54-08:00",
          "tree_id": "669656b5ed75ea43a0f7410caeb8b92d1d61bb32",
          "url": "https://github.com/rocicorp/replicache/commit/15703ca4396be61447be6e572600e6b7fac5b9d6"
        },
        "date": 1637383432096,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187327,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35199,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35042,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e9c2d7da548fc6e9c61c3b714390d0f5e10cf3c4",
          "message": "fix: Remove log spew from test (#720)\n\nThe mock fetch was returning `{}` which is not a valid PullResponse",
          "timestamp": "2021-11-22T10:50:17-08:00",
          "tree_id": "a614d776b75d54cb4781a0f9dbeb38cbd2d90d73",
          "url": "https://github.com/rocicorp/replicache/commit/e9c2d7da548fc6e9c61c3b714390d0f5e10cf3c4"
        },
        "date": 1637607071671,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187327,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35199,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35042,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "08ef17fa16e66267077de90e305fffdb44eb06b2",
          "message": "fix: correct log levels for push and pull errors to follow style guidelines (#719)\n\n### Problem\r\nPush and pull errors are being logged at level `error`, which violates our style guide for log levels: https://github.com/rocicorp/replicache/blob/main/CONTRIBUTING.md#style-general\r\n\r\n### Solution\r\nUpdate to use `info` level instead.",
          "timestamp": "2021-11-22T11:29:05-08:00",
          "tree_id": "68940fa618c677811048c59fab22c8225708931d",
          "url": "https://github.com/rocicorp/replicache/commit/08ef17fa16e66267077de90e305fffdb44eb06b2"
        },
        "date": 1637609399689,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187325,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35149,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186971,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35103,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b549045d3da37eb5b47d61a5c37d7b6997f6c4f4",
          "message": "fix: Silence and check error message (#722)\n\nThe test was hitting `console.error` which is good because it means the\r\ncode works. But we do not want errors to escape the tests. Instead\r\ninstall a stub for console.error and check that it was called.",
          "timestamp": "2021-11-22T21:11:48Z",
          "tree_id": "f296eae1275ee8d80c4c91aef2daa89927141929",
          "url": "https://github.com/rocicorp/replicache/commit/b549045d3da37eb5b47d61a5c37d7b6997f6c4f4"
        },
        "date": 1637615569327,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187325,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35149,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186971,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35103,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Greg Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "981248bf0caefd60754db4a64eb59524250dda8b",
          "message": "feat: Simplified Dueling Dags - Implement initing a new client including bootstraping from existing client state. (#712)\n\nSimplified Dueling Dags always creates a new Client for each new tab.  To enable fast startup of new tabs utilizing previous stored data Simplified Dueling Dags bootstraps new clients by forking an existing Client's state. \r\n\r\nWhen forking from another Client, the fork should be based on the existing Client's most recent base snapshot (which may not be its latest head).  This is necessary because pending mutations (LocalMutationCommits) cannot be forked as the last mutation id series is different per client.\r\n\r\nIt is important that the last mutation id for the new client be set to 0, since a replicache server implementation will start clients for which they do not have a last mutation id stored at last mutation id 0.  If the server receives a request from a client with a non-0 last mutation id, for which it does not have a last mutation id stored, it knows that it is unsafe for it to execute mutations form the client, as it could result in re-running mutations or otherwise failing to guarantee sequential execution of mutations.  This tells the server that this is an old client that it has GC'd (we need some way to signal this to the client so it can reset itself, see https://github.com/rocicorp/replicache/issues/335). \r\n\r\nWhen choosing a Client to bootstrap from, it is safe to pick any Client, but it is ideal to chose the Client with the most recent snapshot from the server.  Currently the age of snapshots is not stored, so this implementation uses a heuristic of choosing the base snapshot of the Client with the newest heartbeat timestamp. \r\n\r\nSee larger design at https://www.notion.so/Simplified-DD1-1ed242a8c1094d9ca3734c46d65ffce4#64e4299105dd490a9ffbc6c9c771f5d2\r\n\r\nPart of #671",
          "timestamp": "2021-11-22T14:54:58-08:00",
          "tree_id": "0438301398305ead0cb6f1d1ea6a99ef4ef18d2d",
          "url": "https://github.com/rocicorp/replicache/commit/981248bf0caefd60754db4a64eb59524250dda8b"
        },
        "date": 1637621764722,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187325,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35149,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186971,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35103,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "arv@roci.dev",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "058d17429a8b96780776bd2f39b1213094df5e16",
          "message": "feat: Add Persist Writer (#723)\n\nUse a Transformer to transform one dag tree into another.\r\n\r\nThen use this to implement a Persist Writer which uses the previous\r\ngathered chunks to determine what to write.\r\n\r\nTowards #671",
          "timestamp": "2021-11-23T16:40:01-08:00",
          "tree_id": "ab7f320030d3b25f28a7a938d93a08c786cfb06d",
          "url": "https://github.com/rocicorp/replicache/commit/058d17429a8b96780776bd2f39b1213094df5e16"
        },
        "date": 1637714469999,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187327,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35162,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186973,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35036,
            "unit": "bytes"
          }
        ]
      }
    ]
  }
}