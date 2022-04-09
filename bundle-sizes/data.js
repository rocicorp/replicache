window.BENCHMARK_DATA = {
  "lastUpdate": 1649498133241,
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
          "id": "c1daafb647a418aac0dbd9f524bc9fc81c2fddab",
          "message": "feat: Add Persist Fixup Transformer (#726)\n\nThis is another transformer that changes the hashes in a DAG. It walks\r\ndown the DAG and \"rewrites\" chunks with a new hash, provided as a\r\nmapping from old hash to new hash. The old chunks will get garbage\r\ncollected as usual.\r\n\r\nTowards #671",
          "timestamp": "2021-11-29T12:58:34-08:00",
          "tree_id": "a4efe0191a8af00489944c95df1913d8ac67972e",
          "url": "https://github.com/rocicorp/replicache/commit/c1daafb647a418aac0dbd9f524bc9fc81c2fddab"
        },
        "date": 1638219575390,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187347,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35234,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186993,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35066,
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
          "id": "c62688fa2b642e9cb30f99c9e8941b2c2b325814",
          "message": "refactor: Rename HashType -> HashRefType (#728)",
          "timestamp": "2021-11-29T21:51:24Z",
          "tree_id": "feae4c9d117afa0b36577f017436a81a313d26b6",
          "url": "https://github.com/rocicorp/replicache/commit/c62688fa2b642e9cb30f99c9e8941b2c2b325814"
        },
        "date": 1638222749137,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187375,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35189,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 187021,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35094,
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
          "id": "595e2080c81118598507f71b339718cc17f34980",
          "message": "feat: A transformer that computes the chunk hash (#727)\n\nThis does not need a `dag.Read` or `dag.Write`. It only operates on the\r\ngathered chunks in the map from the previous step.\r\n\r\nThe input is a `Map<TempHash, Chunk<TempHash>>` and the output is the\r\nsame logical map but the hashes have been computed based on the chunk\r\ndata; `Map<PerHash, Chunk<PerHash>>`\r\n\r\nTowards Implement Dueling Dags #671",
          "timestamp": "2021-11-29T22:04:23Z",
          "tree_id": "68e2ed63093fd5546b9ac01b375e73cdb1a350ec",
          "url": "https://github.com/rocicorp/replicache/commit/595e2080c81118598507f71b339718cc17f34980"
        },
        "date": 1638223544600,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187415,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 187061,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35083,
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
          "id": "9481c4c9c98824eb61351652590e2a76fbb8243d",
          "message": "refactor: Rename hash in db transformer (#729)\n\nUse NewHash and OldHash type aliases",
          "timestamp": "2021-11-29T14:19:36-08:00",
          "tree_id": "3a14d318369964c4e54758ef112ce6571e37a420",
          "url": "https://github.com/rocicorp/replicache/commit/9481c4c9c98824eb61351652590e2a76fbb8243d"
        },
        "date": 1638224441684,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187415,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 187061,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35083,
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
          "id": "764f55e3acad523db351d26814241fedd5c6aa5d",
          "message": "feat: Add mappings to db.Transformer (#730)\n\nThis writes the `Map<OldHash, NewHash>` as the transformer writes new\r\nchunks\r\n\r\nTowards #671",
          "timestamp": "2021-11-29T14:50:12-08:00",
          "tree_id": "3c2429d283df9c2b6ed9890a5ab349da773ccc61",
          "url": "https://github.com/rocicorp/replicache/commit/764f55e3acad523db351d26814241fedd5c6aa5d"
        },
        "date": 1638226275930,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 187415,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 187061,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 35083,
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
          "id": "d9a71bc9bba229c02820b228492aed80055a4232",
          "message": "chore: Update to TS 4.5 (#731)",
          "timestamp": "2021-11-29T23:13:02Z",
          "tree_id": "489d506acefea690ec4c97348b3998013d5728b6",
          "url": "https://github.com/rocicorp/replicache/commit/d9a71bc9bba229c02820b228492aed80055a4232"
        },
        "date": 1638227653034,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34908,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34813,
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
          "id": "b57c94ff9a0f6be3c8eb902c7bd3b09f4635f526",
          "message": "chore: Update web test runner and deps (#732)",
          "timestamp": "2021-11-29T23:29:34Z",
          "tree_id": "757f1d3f3ef72908e4af5571c5ff92eb9a294381",
          "url": "https://github.com/rocicorp/replicache/commit/b57c94ff9a0f6be3c8eb902c7bd3b09f4635f526"
        },
        "date": 1638228641090,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34908,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34813,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "distinct": true,
          "id": "5e4afe41b36cb118680a72bcee25d5e0be2713c4",
          "message": "refactor: Rename classes",
          "timestamp": "2021-11-29T15:45:37-08:00",
          "tree_id": "3b032c8809033402712d8cc34c3268e331629ea7",
          "url": "https://github.com/rocicorp/replicache/commit/5e4afe41b36cb118680a72bcee25d5e0be2713c4"
        },
        "date": 1638229598330,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34908,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34813,
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
          "id": "febb5b7850e578fcb9d28ac34c40ec826511c1f5",
          "message": "fix: Persist Write Transformer should preserve hashes (#734)\n\nNow we precompute the hashes of the chunks we are going to write so we\r\nneed to preserve the hashes of the chunks passed in.\r\n\r\nTowards #671",
          "timestamp": "2021-11-30T11:47:50-08:00",
          "tree_id": "0b72a243a323014e3ceabd33be923e97d9ef8975",
          "url": "https://github.com/rocicorp/replicache/commit/febb5b7850e578fcb9d28ac34c40ec826511c1f5"
        },
        "date": 1638301727334,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34925,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34839,
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
          "id": "1bb8f57514f85290571577bf8aeabf33d53326c3",
          "message": "feat: Add nativeHashOf (#736)\n\nAnd change type signature of hashOf to take a JSON value as well.",
          "timestamp": "2021-11-30T15:22:04-08:00",
          "tree_id": "445490f7a5b19347bd0a94806fd43ac58289c941",
          "url": "https://github.com/rocicorp/replicache/commit/1bb8f57514f85290571577bf8aeabf33d53326c3"
        },
        "date": 1638314589881,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34894,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34790,
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
          "id": "56f34dbd0ca3b49551b6fd9e53ea64f67c2257ab",
          "message": "refactor: Move sync/client to persist (#737)",
          "timestamp": "2021-11-30T23:27:25Z",
          "tree_id": "fd6253a068d52e058d36ec36d7f919f194684d9e",
          "url": "https://github.com/rocicorp/replicache/commit/56f34dbd0ca3b49551b6fd9e53ea64f67c2257ab"
        },
        "date": 1638314900258,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34894,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34790,
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
          "id": "7769f098922ccfaf05275834f1d179dce35f1941",
          "message": "feat: Add top level persist function (#738)\n\nThis combines the different persist steps into a single function.\r\n\r\nTowards #671",
          "timestamp": "2021-11-30T16:16:44-08:00",
          "tree_id": "a7b57fc71e057a964a7595442ddd2d42d7907619",
          "url": "https://github.com/rocicorp/replicache/commit/7769f098922ccfaf05275834f1d179dce35f1941"
        },
        "date": 1638317875307,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34894,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34790,
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
          "id": "3774ee574c60dadfd0d1838cad772bbbd07f4d1d",
          "message": "refactor: Remove persist WriteTransformer (#739)\n\nTurns out that we can just write the chunks since we computed the hashes\r\nin an earlier step.\r\n\r\nPersist ComputeTransformer now takes over some of the work of\r\nWriteTransformer.\r\n\r\nTowards #671",
          "timestamp": "2021-11-30T16:42:02-08:00",
          "tree_id": "b2f1822cbff505e219d07816cf59e822c8a3b80f",
          "url": "https://github.com/rocicorp/replicache/commit/3774ee574c60dadfd0d1838cad772bbbd07f4d1d"
        },
        "date": 1638319382280,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186442,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34894,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186088,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34790,
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
          "id": "5aa948f4d672290172792aa86ce02d83d51c77b4",
          "message": "feat!: Include versions in IDB name (#741)\n\nFor Simplified Dueling Dags we need to ensure that different tabs\r\nrunning different versions of Replicache do not interact with IDB data\r\nit does not know how to read/write.\r\n\r\nTo achieve this the name if the IDB database now contains the\r\n`REPLICACHE_FORMAT_VERSION` (which is currently at `3`).\r\n\r\nThe IDB name also contains the `schemaVersion` som if the schema changes\r\na fresh IDB database is used. The motivation is the same. Multiple tabs\r\nwith different schemaVersions should not interact with the same IDB\r\ndatabase.\r\n\r\nBREAKING CHANGE\r\n\r\nTowards #671",
          "timestamp": "2021-12-02T11:10:18-08:00",
          "tree_id": "67017af060aaec2267e5b8a4364522faad25ad08",
          "url": "https://github.com/rocicorp/replicache/commit/5aa948f4d672290172792aa86ce02d83d51c77b4"
        },
        "date": 1638472288919,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186627,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34966,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186273,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34850,
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
          "id": "6b6d213bb554525a6834ce2cb8e5b76ebfa7f934",
          "message": "refactor: Use abstract db transformer (#744)\n\nThe old code was pretty silly and used runtime type checks. Now we use\r\nan abstract base class and static type checking.",
          "timestamp": "2021-12-02T19:40:31Z",
          "tree_id": "2f8163c1d1660a21218ef59c2eeae2a1e1e41b3c",
          "url": "https://github.com/rocicorp/replicache/commit/6b6d213bb554525a6834ce2cb8e5b76ebfa7f934"
        },
        "date": 1638474094681,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186627,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34966,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186273,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34850,
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
          "id": "9b0af12031ba19b1c27b5372ba3f18f60df2307d",
          "message": "refactor: persist test to usa a suite (#745)",
          "timestamp": "2021-12-02T20:00:31Z",
          "tree_id": "25f5e4a33cbd87f1332df015bed6c573c0e4679d",
          "url": "https://github.com/rocicorp/replicache/commit/9b0af12031ba19b1c27b5372ba3f18f60df2307d"
        },
        "date": 1638475302301,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186627,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34966,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186273,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34850,
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
          "id": "f2d0d0c6cfdbcaf351ab71b29060314bfa9f6731",
          "message": "refactor: Make commit statics module functions (#749)\n\nStatic methods are generally an anti-pattern in JS. They are sometimes\r\nnice from an API perspective, but tree shaking generally has problems\r\nwith them.\r\n\r\nThe only real valid use case I can think of is when you need to inherit\r\nstatic methods. In other words when your statics references `this`.",
          "timestamp": "2021-12-02T16:26:52-08:00",
          "tree_id": "3bd6ea9d57c96a9ad5c85867bac2be7dda672472",
          "url": "https://github.com/rocicorp/replicache/commit/f2d0d0c6cfdbcaf351ab71b29060314bfa9f6731"
        },
        "date": 1638491279135,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186385,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35014,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34912,
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
          "id": "3d65d8110a477049d5b8afdbc179702e7c26434d",
          "message": "chore: Add sync head test for persist (#750)\n\nTest that the sync head is updated correctly when doing persist",
          "timestamp": "2021-12-02T16:32:36-08:00",
          "tree_id": "0cf779260f27312cb1f8897bfa61c99420160aba",
          "url": "https://github.com/rocicorp/replicache/commit/3d65d8110a477049d5b8afdbc179702e7c26434d"
        },
        "date": 1638491616129,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186385,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35014,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34912,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "alexandru_turcanu@ymail.com",
            "name": "Alexandru Turcanu",
            "username": "Pondorasti"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5d0a073a6bcc111c869219e284e4c083f3b46ad9",
          "message": "Update sample-replidraw.md (#751)",
          "timestamp": "2021-12-06T14:37:10-08:00",
          "tree_id": "2e810c3a48d20e7f48f1994dd845f02590bf0d72",
          "url": "https://github.com/rocicorp/replicache/commit/5d0a073a6bcc111c869219e284e4c083f3b46ad9"
        },
        "date": 1638830287214,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186385,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35014,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34912,
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
          "id": "c47eff4dcd846bb28bca07308a0b572869861679",
          "message": "feat: Move all client map updating to retrying updateClients pattern that enables using async native hashing outside of perdag transaction  (#752)\n\n### Problem\r\nFor Simplified Dueling Dags we want to allow using an async native hash\r\nfunction. That means that the hash of a chunk has to be computed\r\noutside the DAG transaction (because of IDB's auto commit bug/feature).\r\n\r\nThis mostly works well on the perdag because it gets it's chunks from\r\nthe memdag using the persist function which allows us to precompute all\r\nthe hashes; **except for the hash of the clients map**.\r\n\r\n### Solution\r\nTo not require a sync hash function we instead precompute the hash of\r\nthe clients map outside the DAG transaction and then write it in the tx.\r\nHowever, by doing this there is a small chance that the clients map\r\nchanged since we mutated it and computed the hash for it. If it did\r\nchange we now retry the update clients function with the new up to date\r\nclients map.\r\n\r\nFixes #735\r\nFixes #743",
          "timestamp": "2021-12-07T19:32:44Z",
          "tree_id": "de95959cf263b0e34008ee562672f0d503e06adf",
          "url": "https://github.com/rocicorp/replicache/commit/c47eff4dcd846bb28bca07308a0b572869861679"
        },
        "date": 1638905623733,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186570,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35068,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34935,
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
          "id": "76e609e60595097434f969f2bed6adb343210186",
          "message": "chore: Remove dead test code (#755)\n\nThis code was left over from when we removed the weblocks test",
          "timestamp": "2021-12-07T23:33:48Z",
          "tree_id": "083182b167c6b0b43e711e0a4948d60af57d616b",
          "url": "https://github.com/rocicorp/replicache/commit/76e609e60595097434f969f2bed6adb343210186"
        },
        "date": 1638920085207,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186570,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35068,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34935,
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
          "id": "958734ed575e55a648d42e873e22e2573780a4b9",
          "message": "chore: Split replicache.test.ts (#756)\n\nIt was getting too large. This breaks out all the tests that contains\r\n'subscribe'/'subscription' in their title.",
          "timestamp": "2021-12-08T00:03:38Z",
          "tree_id": "90f1462f5f0caaf2fbd719269f7bd8520bad86be",
          "url": "https://github.com/rocicorp/replicache/commit/958734ed575e55a648d42e873e22e2573780a4b9"
        },
        "date": 1638921875821,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186570,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 35068,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186216,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34935,
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
          "id": "83a4a1e607421a6aa3b323ab02a28b06d7c4d9cb",
          "message": "fix: Subscriptions with errors never recovered (#757)\n\nEven if we get an exception calling the subscription query body we need\r\nto keep track of the keys.\r\n\r\nCloses #754",
          "timestamp": "2021-12-08T00:22:28Z",
          "tree_id": "c74ca1d0671acdad2808cb513113ba24803895c7",
          "url": "https://github.com/rocicorp/replicache/commit/83a4a1e607421a6aa3b323ab02a28b06d7c4d9cb"
        },
        "date": 1638923017302,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 186588,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 34995,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 186234,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 34900,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "distinct": true,
          "id": "279fb79df9bd862bdc9ed03a3a746e638d34035d",
          "message": "chore: Remove prolly/",
          "timestamp": "2021-12-09T11:41:44-08:00",
          "tree_id": "9ef5aae8289c0968bb4c7549d420673f1091376e",
          "url": "https://github.com/rocicorp/replicache/commit/279fb79df9bd862bdc9ed03a3a746e638d34035d"
        },
        "date": 1639078968313,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141351,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29187,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140997,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29093,
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
          "id": "ae89eca17baa249a8b68796f8a120ea34deac58a",
          "message": "fix: Incorrect ref count (#761)\n\nIf there is a diamond shape (or similar) we could end up writing a stale\r\nref count.\r\n\r\nThis happened because we read the ref count async and when that resolves\r\nwe end up with the same ref count in more than one possible execution of\r\nchangeRefCount and the ref count gets modified and written in both those\r\ncalls to changeRefCount.\r\n\r\nBy only loading the ref count once, and after that only operate on the\r\ncache we can ensure we are always working with the up to data ref count.",
          "timestamp": "2021-12-10T11:52:03-08:00",
          "tree_id": "92db6a93979b5f1e49d72d3dc61bb6904f79c242",
          "url": "https://github.com/rocicorp/replicache/commit/ae89eca17baa249a8b68796f8a120ea34deac58a"
        },
        "date": 1639165974312,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142077,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29293,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141723,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29197,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "distinct": true,
          "id": "bedf419842d30445c1174b61f0cc3a88ea34c2b2",
          "message": "comments: Forgot to commit these comments\n\nFollow up to ae89eca17baa249a8b68796f8a120ea34deac58a",
          "timestamp": "2021-12-10T12:33:23-08:00",
          "tree_id": "08d9ed444b0bf8f0fa41b8c172e1ec1678f491ea",
          "url": "https://github.com/rocicorp/replicache/commit/bedf419842d30445c1174b61f0cc3a88ea34c2b2"
        },
        "date": 1639168645743,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142077,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29293,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141723,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29197,
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
          "id": "b727a6d23cfeea645a52c3a30d9e4ef78b2c03a1",
          "message": "chore: Build a minified bundle too (#763)\n\nThis is only used in the dashboard and it is not included in the npm\r\npackage (at the moment).",
          "timestamp": "2021-12-10T21:29:22Z",
          "tree_id": "9bd0d788c81a930cfe55e25e23275261242e377f",
          "url": "https://github.com/rocicorp/replicache/commit/b727a6d23cfeea645a52c3a30d9e4ef78b2c03a1"
        },
        "date": 1639171829630,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142077,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29293,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141723,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29197,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 78567,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 22722,
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
          "id": "2ce13a01e35b7d485008d516d573be0242d7bf3e",
          "message": "chore: Remove endian functions (#764)\n\nNo longer used",
          "timestamp": "2021-12-10T21:42:55Z",
          "tree_id": "b6094484cc8895ce1c1a95a539e33ad8e68fde81",
          "url": "https://github.com/rocicorp/replicache/commit/2ce13a01e35b7d485008d516d573be0242d7bf3e"
        },
        "date": 1639172633658,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142077,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29293,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141723,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29197,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 78567,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 22722,
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
          "id": "3aa8064fcfef6b42a6ae6966360215d7101faf26",
          "message": "feat: Add slurp function (#762)\n\nThis walks a dag from a commit and copies the chunks over to another\r\ndag.\r\n\r\nTowards #671",
          "timestamp": "2021-12-10T22:03:19Z",
          "tree_id": "d71f446d95d3369c37d417f95ec8fd2a75512545",
          "url": "https://github.com/rocicorp/replicache/commit/3aa8064fcfef6b42a6ae6966360215d7101faf26"
        },
        "date": 1639173873220,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142077,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29293,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141723,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29197,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 78567,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 22685,
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
          "id": "26ef0cf8b43da04dbd67413b21d3fc6dedeb77eb",
          "message": "feat: Add persist to Replicache (#753)\n\nSee Simplified Dueling Dags design doc\r\n\r\nReplicache now creates two DAG stores backed by two different KV stores.\r\nThese are referred to as `memdag` and `perdag`.\r\n\r\nReplicache operates on the memdag and once in a while it does a persist\r\nwhich syncs data from the memdag to the perdag.\r\n\r\nTowards #671",
          "timestamp": "2021-12-10T15:11:23-08:00",
          "tree_id": "0c1216d38ded7f3855b145a64c3581f79b6124f2",
          "url": "https://github.com/rocicorp/replicache/commit/26ef0cf8b43da04dbd67413b21d3fc6dedeb77eb"
        },
        "date": 1639177943413,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164562,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32940,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164208,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32793,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25141,
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
          "id": "abf8eccba602014745c95e0b47775b3310eb335a",
          "message": "feat!: Make ReplicacheOptions name required (#759)\n\nIt is important to not use a generic default name if you ever intend to\r\nallow Replicache to be used by multiple users on the same machine.\r\nTherefore remove the default name value.\r\n\r\nBREAKING CHANGE\r\n\r\nFixes #742",
          "timestamp": "2021-12-10T23:21:06Z",
          "tree_id": "b26246137ba42d1910ef6b04b161c222bea23eea",
          "url": "https://github.com/rocicorp/replicache/commit/abf8eccba602014745c95e0b47775b3310eb335a"
        },
        "date": 1639178523471,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164545,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32929,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164191,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32811,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89639,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25119,
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
          "id": "7ca403125d598b8eb8d3671ea83c3c2b2855d2ff",
          "message": "refactor: Extract interface for dag.Store,dag.Read, and dag.Write (#766)\n\nIn preparation for adding a dag.LazyStore implementation, extract an interface for the dag Store.  \r\n\r\nTowards #671",
          "timestamp": "2021-12-16T09:32:38-08:00",
          "tree_id": "6d10b94ba47235b41af5e19ba3998333e5b55e30",
          "url": "https://github.com/rocicorp/replicache/commit/7ca403125d598b8eb8d3671ea83c3c2b2855d2ff"
        },
        "date": 1639676025164,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164634,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32977,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164280,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32809,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89666,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25250,
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
          "id": "c64a26a30accc9e1aac2b90f306d6edfdb728534",
          "message": "refactor: move getSizeOfValue from src/btree/ to src/json.ts (#770)\n\n### Problem\r\n`getSizeOfValue` is needed by the upcoming Lazy DagStore for Simplified Dueling Dags.  It is needed for implementing LRU caching with a size limit.  However the dag/ directory should not depend on the btree/ directory, as dag is at a lower abstraction layer than btree.\r\n\r\n### Solution\r\nMove `getSizeOfValue` to src/json.ts.  This is a logic place of the function as it computes the size of a `ReadonlyJsonValue`.",
          "timestamp": "2021-12-17T11:01:26-08:00",
          "tree_id": "c310dedbfe7bda117d86d546c5814edd6a79ac13",
          "url": "https://github.com/rocicorp/replicache/commit/c64a26a30accc9e1aac2b90f306d6edfdb728534"
        },
        "date": 1639767748345,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164599,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32909,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164245,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32828,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89662,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25153,
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
          "id": "077a5da788bd1940afd0325a4cefe15ec1be7f0e",
          "message": "refactor: Split readCommit into readCommit/readCommitForBTreeRead/readCommitForBTreeWrite to avoid duck-typing (#767)\n\nThis allows us to get rid of some ugly runtime duck-typing.",
          "timestamp": "2021-12-17T11:11:30-08:00",
          "tree_id": "c9bb40821a972b0319ea8e35c013a53afb8f2854",
          "url": "https://github.com/rocicorp/replicache/commit/077a5da788bd1940afd0325a4cefe15ec1be7f0e"
        },
        "date": 1639768341191,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164847,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32927,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164493,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32810,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25083,
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
          "id": "fae7daffaa5f5ce72b8062458dc433a9e770ef2e",
          "message": "refactor: Extract ref count updating logic out of dag WriteImpl so it can be reused by lazy dag store. (#769)\n\nPulls Garbage Collection logic into its own module, so that it can be shared with the upcoming lazy dag store implementation for Simplified Dueling Dags.\r\n\r\nInterface:\r\n```ts\r\nexport type HeadChange = {\r\n  new: Hash | undefined;\r\n  old: Hash | undefined;\r\n};\r\n\r\nexport type RefCountUpdates = Map<Hash, number>;\r\n\r\nexport interface GarbageCollectionDelegate {\r\n  getRefCount: (hash: Hash) => Promise<number>;\r\n  getRefs: (hash: Hash) => Promise<readonly Hash[] | undefined>;\r\n}\r\n\r\n/**\r\n * Computes how ref counts should be updated when a dag write is commited.\r\n * Does not modify the dag store.\r\n * @param headChanges Heads that were changed by the dag write.\r\n * @param putChunks Chunks that were put by the dag write.\r\n * @param delegate Delegate used for loading ref information from the dag store.\r\n * @returns Map from chunk Hash to new ref count.  Chunks with a new ref count of 0 should\r\n * be deleted.  All hashes in `putChunks` will have an entry (which will be zero if a\r\n * newly put chunk is not reachable from any head).\r\n */\r\nexport async function computeRefCountUpdates(\r\n  headChanges: Iterable<HeadChange>,\r\n  putChunks: ReadonlySet<Hash>,\r\n  delegate: GarbageCollectionDelegate,\r\n): Promise<RefCountUpdates> \r\n```\r\n\r\nPart of #671",
          "timestamp": "2021-12-17T11:39:13-08:00",
          "tree_id": "54cdf820fe49a32f66bf97d9200d7901add7d24a",
          "url": "https://github.com/rocicorp/replicache/commit/fae7daffaa5f5ce72b8062458dc433a9e770ef2e"
        },
        "date": 1639770015782,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165119,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 32983,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164765,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 32837,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 89549,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 25166,
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
          "id": "a3887061c3dacf4f9803dc3c8d98d815b22bad88",
          "message": "Remove wasm hash (#765)\n\nThis removes wasm hash\r\n\r\nWe no longer use sync hashing so we can use the local native hash functions.",
          "timestamp": "2022-01-10T15:09:26+01:00",
          "tree_id": "a59608e16bc306f0649bca1cb3a9b3f8914d75bc",
          "url": "https://github.com/rocicorp/replicache/commit/a3887061c3dacf4f9803dc3c8d98d815b22bad88"
        },
        "date": 1641823834135,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 133286,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24735,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 132934,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24620,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64677,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17599,
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
          "id": "7bc61066df2cb4402d5bb75895a4ab6691d1c564",
          "message": "feat: Simplified Dueling Dags - Implement a dag.LazyStore for memdag (#771)\n\nImplements a DAG Store which lazily loads values from a source store and then caches \r\nthem in an LRU cache.  The memory cache for chunks from the source store\r\nsize is limited to `sourceCacheSizeLimit` bytes, and values are evicted in an LRU\r\nfashion.  **The purpose of this store is to avoid holding the entire client view\r\n(i.e. the source store's content) in each client tab's JavaScript heap.**\r\n\r\nThis store's heads are independent from the heads of source store, and are only\r\nstored in memory.\r\n\r\nChunks which are put with a temp hash (see `isTempHash`) are assumed to not be\r\npersisted to the source store and thus are cached separately from the source store\r\nchunks.  These temp chunks cannot be evicted, and their sizes are not counted\r\ntowards the source chunk cache size.  A temp chunk will be deleted if it is no longer\r\nreachable from one of this store's heads.\r\n\r\nWrites only manipulate the in memory state of this store and do not alter the source\r\nstore.  Thus values must be written to the source store through a separate process \r\n(see persist implemented in 7769f09).\r\n\r\nIntended use:\r\n\r\n1. source store is the 'perdag', a slower persistent store (i.e. dag.StoreImpl using a kv.IDBStore)\r\n2. this store's 'main' head is initialized to the hash of a chunk containing a snapshot \r\ncommit in the 'perdag'\r\n3. reads from this store lazily read chunks from the source store and cache them\r\n4. writes are initially made to this store using temp hashes (i.e. temp chunks)\r\n5. writes are asynchronously persisted to the perdag through a separate process.  \r\nSee persist implemented in 7769f09. This process gathers all temp chunks from this store, \r\ncomputes real hashes for them and then writes them to the perdag.  It then replaces in this \r\ndag all the temp chunks written to the source with chunks with permanent hashes and \r\nupdates heads to reference these permanent hashes instead of the temp hashes.  This \r\nresults  in the temp chunks being deleted from this store and the chunks with permanent \r\nhashes being placed in this store's LRU cache of source chunks.\r\n\r\n**Performance**\r\nOn our existing performance benchmarks outperforms the existing mem dag store \r\n( dag.StoreImpl on top of kv.MemStore).   The current benchmarks really only test \r\nperformance of the temp hashes cache though, since they don't use persist at all.  \r\nI believe this outperforms the existing mem dag store because the temp hashes cache\r\nis just a straightforward Map<Hash, Chunk>, and is thus a bit simpler than \r\ndag.StoreImpl on top of kv.MemStore which uses 3 keys per chunk.  A follow up is to \r\nadd some benchmarks that exercise persists and lazy loading.  \r\n\r\n```\r\n[greg replicache [grgbkr/ssd-lazy-dag-impl]$ npm run perf -- --format replicache\r\n\r\n> replicache@8.0.0 perf\r\n> node perf/runner.js \"--format\" \"replicache\"\r\n\r\n\r\nRunning 16 benchmarks on Chromium...\r\n[LazyDag] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.70/0.80/0.90/1.40 ms avg=0.73 ms (19 runs sampled)\r\n[LazyDag] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.00/1.90/3.90 ms avg=1.25 ms (17 runs sampled)\r\n[LazyDag] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/2.20/2.50/2.50 ms avg=1.97 ms (7 runs sampled)\r\n[LazyDag] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=16.40/20.60/28.70/39.00 ms avg=20.30 ms (19 runs sampled)\r\n[LazyDag] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=38.30/41.50/45.00/58.90 ms avg=43.28 ms (12 runs sampled)\r\n[LazyDag] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=47.30/48.50/71.30/71.30 ms avg=58.49 ms (9 runs sampled)\r\n[LazyDag] scan 1024x1000 50/75/90/95%=1.20/1.50/2.50/2.70 ms avg=1.49 ms (19 runs sampled)\r\n[LazyDag] create index 1024x5000 50/75/90/95%=105.80/124.90/130.50/130.50 ms avg=139.61 ms (7 runs sampled)\r\nwriteSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.70/0.90/1.00/1.60 ms avg=0.85 ms (19 runs sampled)\r\nwriteSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.60/2.50/4.70 ms avg=1.79 ms (16 runs sampled)\r\nwriteSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.20/2.30/2.40/2.40 ms avg=2.57 ms (7 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 0) 50/75/90/95%=18.60/20.40/22.10/39.30 ms avg=21.08 ms (19 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 1) 50/75/90/95%=38.00/45.00/50.20/59.70 ms avg=46.58 ms (11 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 2) 50/75/90/95%=50.60/66.30/75.00/75.00 ms avg=63.77 ms (8 runs sampled)\r\nscan 1024x1000 50/75/90/95%=1.20/1.60/2.30/3.10 ms avg=1.53 ms (19 runs sampled)\r\ncreate index 1024x5000 50/75/90/95%=104.30/115.70/117.30/117.30 ms avg=137.03 ms (7 runs sampled)\r\nDone!\r\n```\r\n\r\nPart of #671",
          "timestamp": "2022-01-10T13:00:14-08:00",
          "tree_id": "d6d88c199e3a86698b56ca9eed390f4c34dd2e1f",
          "url": "https://github.com/rocicorp/replicache/commit/7bc61066df2cb4402d5bb75895a4ab6691d1c564"
        },
        "date": 1641848477204,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 133296,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24735,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 132944,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24632,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64673,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17594,
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
          "id": "815731dc5d2cfe1e0bcc89234c2a5a7362f44b80",
          "message": "refactor: Also rename nativeHashOfClients (#774)\n\nFollow up to a388706",
          "timestamp": "2022-01-11T10:32:29Z",
          "tree_id": "d12b4ee580478bf5c9aa4961d4b41c4beccf6cff",
          "url": "https://github.com/rocicorp/replicache/commit/815731dc5d2cfe1e0bcc89234c2a5a7362f44b80"
        },
        "date": 1641897206691,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 133284,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24731,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 132932,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24619,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64673,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17594,
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
          "id": "1ad995e550c175b8513cec6475617d84ece16494",
          "message": "chore: Update esbuild to 0.14.11 (#776)\n\nGets some enum inlining",
          "timestamp": "2022-01-11T14:42:37Z",
          "tree_id": "1c8343854d3cc93b349212b5b60702c626b7e5f5",
          "url": "https://github.com/rocicorp/replicache/commit/1ad995e550c175b8513cec6475617d84ece16494"
        },
        "date": 1641912233574,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 134406,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24941,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 133128,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24574,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64117,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17457,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "anotherjesse@gmail.com",
            "name": "Jesse Andrews",
            "username": "anotherjesse"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "d59496c5f0a4ff701078a5e4704d3d70b1454222",
          "message": "Update conclusion guide to point to replidraw2\n\nreplidraw.vercel.app is now a page saying \"This was left to be taken over.\"",
          "timestamp": "2022-01-11T08:49:22-08:00",
          "tree_id": "2d5fcca50a24f2d119f17938a199898c3243b8f3",
          "url": "https://github.com/rocicorp/replicache/commit/d59496c5f0a4ff701078a5e4704d3d70b1454222"
        },
        "date": 1641919831134,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 134406,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24941,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 133128,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24574,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64117,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17457,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "2b73b931967d8f435ddd4eecb60f03e836ca4718",
          "message": "Nit: it's still called Replidraw",
          "timestamp": "2022-01-11T06:55:48-10:00",
          "tree_id": "6291206e764598c1fcb0caafc1752bc96a277056",
          "url": "https://github.com/rocicorp/replicache/commit/2b73b931967d8f435ddd4eecb60f03e836ca4718"
        },
        "date": 1641920217372,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 134406,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24941,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 133128,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24574,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64117,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17457,
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
          "id": "dfb20a2afd9c3c9155e17dec2ad5480d4eee2d89",
          "message": "chore: Update docusaurus and algolia (#779)",
          "timestamp": "2022-01-13T14:31:53+01:00",
          "tree_id": "7749cb3e98826b2c248afce04b7f758fa37af28f",
          "url": "https://github.com/rocicorp/replicache/commit/dfb20a2afd9c3c9155e17dec2ad5480d4eee2d89"
        },
        "date": 1642080780866,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 134406,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 24941,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 133128,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 24574,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64117,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 17457,
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
          "id": "c685a9a90ae87cafe3ee3c15b4e47f65978c5784",
          "message": "feat: Simplified Dueling Dags - Integrate dag.LazyStore into Replicache (#777)\n\nUpdate Replicache to use new dag.LazyStore (implemented in 7bc6106) for the memdag.  \r\nReplace use of dag.StoreImpl on top of kv.MemStore.  Lazy loading is now used instead of\r\nslurp.\r\n\r\n**Performance**\r\nOutperforms dag.StoreImpl on top of kv.MemStore with slurp on all existing benchmarks.  \r\nAlso outperforms slurp on WIP benchmark for startup from persistent storage when the \r\namount of data stored is > ~4MB.\r\n\r\nIn the below output lines starting with `[LazyStore]` are with LazyStore and the other lines are with dag.StoreImpl on top of kv.MemStore using slurp (this was done with a small local patch for comparing).\r\n\r\n```\r\ngreg replicache [grgbkr/ssd-startup-benchmark-on-checked-in-code]$ npm run perf -- --format replicache\r\n\r\n> replicache@8.0.0 perf\r\n> node perf/runner.js \"--format\" \"replicache\"\r\n\r\nRunning 40 benchmarks on Chromium...\r\n[LazyStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.60/0.70/0.80/1.50 ms avg=0.69 ms (19 runs sampled)\r\n[LazyStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.20/1.30/1.60 ms avg=1.16 ms (11 runs sampled)\r\n[LazyStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.60/2.20/2.20 ms avg=1.76 ms (7 runs sampled)\r\n[LazyStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=83.60/86.10/137.30/137.30 ms avg=110.81 ms (7 runs sampled)\r\n[LazyStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=36.90/47.60/53.70/56.60 ms avg=44.20 ms (12 runs sampled)\r\n[LazyStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=45.30/51.20/67.70/67.70 ms avg=57.71 ms (9 runs sampled)\r\n[LazyStore] scan 1024x1000 50/75/90/95%=1.20/1.50/2.20/2.70 ms avg=1.43 ms (19 runs sampled)\r\n[LazyStore] create index 1024x5000 50/75/90/95%=95.00/101.50/106.50/106.50 ms avg=124.14 ms (7 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x100 stored 50/75/90/95%=9.50/10.20/10.50/10.60 ms avg=10.72 ms (19 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x1000 stored 50/75/90/95%=25.90/26.40/26.80/27.10 ms avg=28.57 ms (18 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x2000 stored 50/75/90/95%=27.10/28.30/32.90/84.10 ms avg=35.00 ms (15 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x3000 stored 50/75/90/95%=27.90/28.50/33.00/35.60 ms avg=31.82 ms (16 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x4000 stored 50/75/90/95%=27.90/34.40/46.10/61.50 ms avg=36.80 ms (14 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x5000 stored 50/75/90/95%=27.50/29.90/30.20/40.20 ms avg=31.90 ms (16 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x6000 stored 50/75/90/95%=31.20/56.90/63.60/77.90 ms avg=47.06 ms (11 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x7000 stored 50/75/90/95%=27.70/55.00/57.40/61.10 ms avg=42.12 ms (12 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x8000 stored 50/75/90/95%=30.10/42.70/77.90/78.80 ms avg=43.28 ms (12 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x9000 stored 50/75/90/95%=28.50/29.00/32.30/43.70 ms avg=33.43 ms (15 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x10000 stored 50/75/90/95%=28.30/28.70/29.20/36.10 ms avg=32.13 ms (16 runs sampled)\r\n[LazyStore] startup read 1024x100 from 1024x100000 stored 50/75/90/95%=54.60/67.10/72.20/72.20 ms avg=73.43 ms (7 runs sampled)\r\nwriteSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.70/0.90/1.00/1.50 ms avg=0.83 ms (19 runs sampled)\r\nwriteSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/2.30/2.80/4.90 ms avg=2.12 ms (11 runs sampled)\r\nwriteSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.10/2.90/2.90/2.90 ms avg=2.60 ms (7 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 0) 50/75/90/95%=70.60/90.90/112.40/112.40 ms avg=91.83 ms (7 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 1) 50/75/90/95%=34.60/47.30/54.50/56.60 ms avg=43.95 ms (12 runs sampled)\r\npopulate 1024x1000 (clean, indexes: 2) 50/75/90/95%=47.50/48.70/67.40/67.40 ms avg=59.67 ms (9 runs sampled)\r\nscan 1024x1000 50/75/90/95%=1.20/1.50/2.20/2.80 ms avg=1.48 ms (19 runs sampled)\r\ncreate index 1024x5000 50/75/90/95%=99.60/106.30/109.60/109.60 ms avg=129.09 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x100 stored 50/75/90/95%=9.00/9.40/9.70/9.70 ms avg=9.91 ms (19 runs sampled)\r\nstartup read 1024x100 from 1024x1000 stored 50/75/90/95%=14.00/14.40/15.10/15.30 ms avg=15.51 ms (19 runs sampled)\r\nstartup read 1024x100 from 1024x2000 stored 50/75/90/95%=19.10/20.00/28.60/93.00 ms avg=25.45 ms (19 runs sampled)\r\nstartup read 1024x100 from 1024x3000 stored 50/75/90/95%=26.70/28.10/29.80/64.60 ms avg=31.74 ms (16 runs sampled)\r\nstartup read 1024x100 from 1024x4000 stored 50/75/90/95%=31.60/33.20/35.10/37.10 ms avg=36.14 ms (14 runs sampled)\r\nstartup read 1024x100 from 1024x5000 stored 50/75/90/95%=54.30/55.10/114.20/114.20 ms avg=73.50 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x6000 stored 50/75/90/95%=62.20/94.20/97.10/97.10 ms avg=82.19 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x7000 stored 50/75/90/95%=55.20/90.60/94.00/94.00 ms avg=77.96 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x8000 stored 50/75/90/95%=57.80/62.30/63.20/63.20 ms avg=69.91 ms (8 runs sampled)\r\nstartup read 1024x100 from 1024x9000 stored 50/75/90/95%=66.30/80.30/111.00/111.00 ms avg=89.51 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x10000 stored 50/75/90/95%=82.10/89.40/114.30/114.30 ms avg=101.73 ms (7 runs sampled)\r\nstartup read 1024x100 from 1024x100000 stored 50/75/90/95%=638.90/645.50/675.20/675.20 ms avg=805.41 ms (7 runs sampled)\r\n```\r\n\r\n\r\nPart of #671",
          "timestamp": "2022-01-13T16:42:00Z",
          "tree_id": "369435529f4fffdc3b64fefc2c95531892f6ad5c",
          "url": "https://github.com/rocicorp/replicache/commit/c685a9a90ae87cafe3ee3c15b4e47f65978c5784"
        },
        "date": 1642092170920,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141318,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25855,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140040,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25479,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67701,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18184,
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
          "id": "b770a25b38b5660978475c1c6180238c8f3b30fa",
          "message": "refactor: Delete unused slurp and merge kv.MemStore into kv.TestMemStore (#778)\n\nWith the integration of dag.LazyStore slurp is no longer used, and kv.MemStore is only \r\nused via kv.TestMemStore in tests.",
          "timestamp": "2022-01-13T16:46:23Z",
          "tree_id": "ad9557b50cc861bb2572061f5ec2ca19242b6184",
          "url": "https://github.com/rocicorp/replicache/commit/b770a25b38b5660978475c1c6180238c8f3b30fa"
        },
        "date": 1642092433294,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141318,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25855,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140040,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25479,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67701,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18167,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "b328e1b9dc1dd5c9a9772a1c54be386f43facde6",
          "message": "Adds a timestamp field to mutations.\n\nNote: Format change. Not changing REPLICACHE_FORMAT_VERSION constant\nbecause we should only do so once per release by policy, so that\nshould be something we do during release.",
          "timestamp": "2022-01-13T15:14:57-10:00",
          "tree_id": "fbcc9161c769af14eb09bbd0e143e1aac9ec66aa",
          "url": "https://github.com/rocicorp/replicache/commit/b328e1b9dc1dd5c9a9772a1c54be386f43facde6"
        },
        "date": 1642122965733,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141688,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25914,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140410,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25559,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67903,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18257,
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
          "id": "875ff1a992cb7c2dc0d90c4ccfe0d7f2bece8c10",
          "message": "refactor: inline call to scan (#782)",
          "timestamp": "2022-01-14T15:13:21Z",
          "tree_id": "821548d06d6a0751e724d5e3a4cec69d62c46b67",
          "url": "https://github.com/rocicorp/replicache/commit/875ff1a992cb7c2dc0d90c4ccfe0d7f2bece8c10"
        },
        "date": 1642173255034,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141580,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25902,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140302,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25534,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67865,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18226,
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
          "id": "ce2baacce6723f0323a6016d30c383caf6bdaa1b",
          "message": "feat: Add benchmarks for startup from persisted state  (#780)\n\nAdd two benchmarks for startup from persisted state based on the Replicache performance envelope (#595).\r\n\r\n1. Init replicache and read 100 KB of data from 100 MB of persisted state using `get`s of random keys.\r\n2. Init replicache and read 100 KB of data from 100 MB of persisted state using `scan` starting at a random key.",
          "timestamp": "2022-01-14T18:42:39Z",
          "tree_id": "8b5dd619bc07989b24c6aac25d82a4f7d8318423",
          "url": "https://github.com/rocicorp/replicache/commit/ce2baacce6723f0323a6016d30c383caf6bdaa1b"
        },
        "date": 1642185819999,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141662,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25929,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140384,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25554,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67884,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18229,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "6389906ff304c1df117d6c8df64168f3ace49433",
          "message": "Remove unused public field `now`.\n\nWas accidentally introduced in b328e1b9dc1dd5c9a9772a1c54be386f43facde6.",
          "timestamp": "2022-01-14T09:42:49-10:00",
          "tree_id": "0da9982524ffbe52004f2a6b96a4c88abd306b6a",
          "url": "https://github.com/rocicorp/replicache/commit/6389906ff304c1df117d6c8df64168f3ace49433"
        },
        "date": 1642189427604,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
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
          "id": "392daf1054735a3e92bcb1aa3e5f7df8f0f649d7",
          "message": "chore: Reenable testing in WebKit (#786)\n\nWith updated deps the test runner works again",
          "timestamp": "2022-01-17T14:04:10Z",
          "tree_id": "b03fa1b4476a482f3db2810c0911a3cf31a39db2",
          "url": "https://github.com/rocicorp/replicache/commit/392daf1054735a3e92bcb1aa3e5f7df8f0f649d7"
        },
        "date": 1642428308737,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
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
          "id": "25925524c1ed8ef02d1f918f09f38f0d9d18426c",
          "message": "chore: remove useMemstore from perf (#787)\n\nI printed MemStore so we would have some overlap in the perf graphs",
          "timestamp": "2022-01-17T15:40:45+01:00",
          "tree_id": "5f6d3bbbd8747c4ccb5838b49f448319408f6d1d",
          "url": "https://github.com/rocicorp/replicache/commit/25925524c1ed8ef02d1f918f09f38f0d9d18426c"
        },
        "date": 1642430507232,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
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
          "id": "c580626bbc774f957a156bea67c0bc333faa8edc",
          "message": "chore: Remove typedoc dependency (#788)\n\nIt is only used from doc/ now and doc/ has its own package.json",
          "timestamp": "2022-01-20T15:17:49+01:00",
          "tree_id": "e9e4603413cfa2e13a0d2c0179b1c802d5fad49c",
          "url": "https://github.com/rocicorp/replicache/commit/c580626bbc774f957a156bea67c0bc333faa8edc"
        },
        "date": 1642688320036,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
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
          "id": "a2d4a74471b8a34258f0b890e5d084727178f141",
          "message": "doc: client view cannot be a function of clientID (#790)\n\nclient view cannot be a function of clientID since we fork an existing\r\nclient view and create a new client with the same client view but a new\r\nclient id.\r\n\r\ncloses #789",
          "timestamp": "2022-01-25T11:49:27+01:00",
          "tree_id": "08df3a6ca33ecd72182ec1790d9cad8bd810eb69",
          "url": "https://github.com/rocicorp/replicache/commit/a2d4a74471b8a34258f0b890e5d084727178f141"
        },
        "date": 1643107829841,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "7b11da7752680afe9a7779f57cbf531dec110e49",
          "message": "Bump version to 9.0.0-beta.0.",
          "timestamp": "2022-01-25T17:59:42-10:00",
          "tree_id": "818871428e210fd8638dea919044d7e785e2298c",
          "url": "https://github.com/rocicorp/replicache/commit/7b11da7752680afe9a7779f57cbf531dec110e49"
        },
        "date": 1643169655883,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141622,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25888,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140344,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25551,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67853,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18221,
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
          "id": "931c9bb00d2667a0ea2ab98ce5fd22d4a775a85e",
          "message": "feat: Simplified Dueling Dags - Mutation Recover - Add mutationID and  lastServerAckdMutationID to Client. (#792)\n\nAdd `mutationID` and  `lastServerAckdMutationID` to `Client` and update `initClient` and `persist` to\r\nwrite them appropriately.  These new fields will be used by other clients to determine if a client has \r\npending mutations (persisted local mutations unacknowledged by the server) that it can push on the \r\nother client's behalf.  We will refer to this process as “mutation recovery”, as one client is recovering the\r\n mutations of another client, by reading them from the other client’s perdag stage and pushing on the \r\nother client’s behalf. \r\n\r\nSee [Mutation Recovery design](https://www.notion.so/Mutation-Recovery-Avoiding-Mutation-Loss-using-PerDag-state-f54025b52cbc435692abca3307947d15). \r\n\r\nPart of #671",
          "timestamp": "2022-01-26T10:16:01-08:00",
          "tree_id": "a651b0b7764a81fc88b50a42970476f92f615103",
          "url": "https://github.com/rocicorp/replicache/commit/931c9bb00d2667a0ea2ab98ce5fd22d4a775a85e"
        },
        "date": 1643221018431,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142171,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25975,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140893,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25638,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68089,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18286,
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
          "id": "60391d56ba0a4ffb1b37764a18e04033203f84ce",
          "message": "refactor!: Remove deprecated pushAuth/getPushAuth and pullAuth/getPullAuth (#796)\n\nRemoves `Replicache.getPushAuth` and `Replicache.getPullAuth` which were deprecated and replaced by `Replicache.getAuth`.\r\nRemoves `ReplicacheOptions.pushAuth` and `ReplicacheOptions.pullAuth` which were deprecated and replaced by `ReplicacheOptions.auth`. \r\n\r\nThese fields were deprecated by 9c3a49bc4b16924a3d8e0af5bbd4208156d20174, and have been deprecated since release [v6.4.0](https://github.com/rocicorp/replicache/releases/tag/v6.4.0).  \r\n \r\nThis will make some work on mutation recovery cleaner.\r\n\r\nBREAKING CHANGE: Removes `Replicache#getPushAuth` and `Replicache#getPullAuth`.  Usages should be updated to use `Replicache#getAuth`. Removes `ReplicacheOptions.pushAuth` and `ReplicacheOptions.pullAuth`.  Usages should be updated to use `ReplicacheOptions.auth`.",
          "timestamp": "2022-01-27T08:03:24-08:00",
          "tree_id": "9a04c9e9ff9b5dd5ae43a0df023b927ac4e36977",
          "url": "https://github.com/rocicorp/replicache/commit/60391d56ba0a4ffb1b37764a18e04033203f84ce"
        },
        "date": 1643299467192,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141875,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25915,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140597,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25582,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67873,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18218,
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
          "id": "c36f0d53f711f31a095aea4a1e9b5b53b7227426",
          "message": "refactor: Extract reauth retry logic from push and pull into shared method. (#797)\n\nExtract reauth retry logic from push and pull into shared method.  This reduces duplication and also will allow for reuse of this logic for mutation recovery.",
          "timestamp": "2022-01-27T08:19:43-08:00",
          "tree_id": "1f46e28ce4482de6a95f7a34917e30afa834ba3b",
          "url": "https://github.com/rocicorp/replicache/commit/c36f0d53f711f31a095aea4a1e9b5b53b7227426"
        },
        "date": 1643300438484,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142199,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26030,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140921,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25684,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68081,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18288,
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
          "id": "09be25008105ff50a3fb8b97effa99c0a2c65d00",
          "message": "feat: Simplified Dueling Dags - Mutation Recovery - Add an optional parameter to beingPull for disabling the creation of a sync branch from the pull response (#798)\n\nFor Mutation Recover we need to be able to pull to confirm mutations have been applied on the server by \r\nlooking at the responses `lastMutationID`, but we do not want to apply the response to the DAG.  Add an \r\noption to beginPull to not create a sync branch from the pull response.\r\n\r\nAlso add the `PullResponse` to `BeginPullResponse`, as it will be need by Mutation Recovery to get the \r\n`lastMutationID`. \r\n\r\nPart of #671",
          "timestamp": "2022-01-27T09:41:37-08:00",
          "tree_id": "e3ddf924293db282515f45b49ec9bcd548e15df3",
          "url": "https://github.com/rocicorp/replicache/commit/09be25008105ff50a3fb8b97effa99c0a2c65d00"
        },
        "date": 1643305376380,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142382,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26067,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141104,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25702,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68159,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18302,
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
          "id": "39007eaf0f075ef6535072d2cc12e16fa7386b92",
          "message": "refactor!: Update Replicache.schemaVersion to readonly. (#800)\n\nThis should always have been readonly, the schema version of a Replicache instance should be constant through out its life.   Previously modifying this had no effect.\r\n\r\nBREAKING CHANGE:  Code modifying Replicache.schemaVersion must be removed (to resolve TypeScript errors).",
          "timestamp": "2022-01-28T17:01:02Z",
          "tree_id": "4dffed004fa86f3e015f8d9d4886944fcb16d584",
          "url": "https://github.com/rocicorp/replicache/commit/39007eaf0f075ef6535072d2cc12e16fa7386b92"
        },
        "date": 1643389326986,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 142382,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26067,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 141104,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25702,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68159,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18302,
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
          "id": "8ba35ffca743d3121557939a220b31d597300c4c",
          "message": "chore: Delete change broadcast code (#801)\n\nIn the new unified storage model of simplified dueling dags changes are shared between \r\ntabs via syncing with the server.   This code is no longer needed, possibly impacting\r\nperformance and causing spurious firing of subscriptions.",
          "timestamp": "2022-01-28T12:33:57-08:00",
          "tree_id": "54b8f4d0cf89ee91da25553e5e71fcd3430e2a62",
          "url": "https://github.com/rocicorp/replicache/commit/8ba35ffca743d3121557939a220b31d597300c4c"
        },
        "date": 1643402089455,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 140371,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 25721,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 139093,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25368,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67023,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18008,
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
          "id": "d939623e76df90efdbfd0116a20201fb0d428aed",
          "message": "feat: Track Replicache IndexedDB databases in another IndexedDB database for mutation recovery and db gc. (#802)\n\n### Problem\r\nWe need to be able to find old Replicache IndexedDB databases (i.e. databases with previous schema \r\nversions or replicache format versions), so that we can recover mutations from them and also GC them.\r\n\r\n### Solution\r\nKeep track of Replicache IndexedDB databases in a IndexedDB database. \r\n\r\nUnfortunately Firefox does not implement [IDBFactory.databases](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases), or we would use that api.\r\n\r\nIndexedDB is used over LocalStorage because LocalStorage's lack of concurrency control makes\r\nit very difficult to avoid write clobbering when updating a list or map.",
          "timestamp": "2022-01-28T13:13:52-08:00",
          "tree_id": "8ac31a2e70bf642e8b7aff4160a946d19abd7ada",
          "url": "https://github.com/rocicorp/replicache/commit/d939623e76df90efdbfd0116a20201fb0d428aed"
        },
        "date": 1643404487939,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 141850,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26009,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 140572,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 25649,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67764,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18219,
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
          "id": "1538c424e2369c36c5a41c7876f0dad338e59768",
          "message": "feat: Simplified Dueling Dag - Mutation Recovery - Implement the mutation recovery process. (#799)\n\n### Problem \r\nWith Simplified Dueling Dags mutations that have not been synced to the server when a tab is \r\nunloaded (or frozen and never unfrozen) are lost.  This can occur in common user flows, and \r\nwill result in unexpected data loss.  The impact is worst when the user has been offline or has \r\na flakey connection as there will be more local mutations that have not been synced.   Cases \r\nwhere this will occur:\r\n\r\n- Refresh before changes have been pushed\r\n- Close before changes have been pushed\r\n- Navigate away before changes have been pushed\r\n- Tab backgrounded and frozen before changes have been pushed (seems unlikely) and tab is not revisited before client is gc’d\r\n- Tab crash before changes have been pushed\r\n\r\n### Solution\r\nReplicache clients will try to recover mutations from other Replicache client's perdag state.   \r\nA Replicache client can recover another Replicache client's mutations if the other clients has \r\nthe same name (and thus can share auth), the same domain, and a Replicache format and \r\nschema version understood by the client.   A Replicache client will try to recover other\r\nclients' mutation at startup, reconnection and on a 5 minute interval\r\n\r\nSee full design at https://www.notion.so/replicache/Mutation-Recovery-Avoiding-Mutation-Loss-using-PerDag-state-f54025b52cbc435692abca3307947d15",
          "timestamp": "2022-02-01T22:16:09-08:00",
          "tree_id": "079a53d5ca1a2250cd9d0382fbf519a24247084f",
          "url": "https://github.com/rocicorp/replicache/commit/1538c424e2369c36c5a41c7876f0dad338e59768"
        },
        "date": 1643782640850,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148195,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26833,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 146917,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26516,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70793,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18866,
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
          "id": "eab7fb6ffa9276450dd185cbbd43adc0f05b7c83",
          "message": "chore: Use esbuild mangle-props (#805)\n\nFor even smaller minimized output",
          "timestamp": "2022-02-03T19:32:01Z",
          "tree_id": "aa42e322ed574d072fc61e3c228a151ae56d4953",
          "url": "https://github.com/rocicorp/replicache/commit/eab7fb6ffa9276450dd185cbbd43adc0f05b7c83"
        },
        "date": 1643916820201,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148195,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26833,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 146917,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26516,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63761,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18131,
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
          "id": "ac33faf50ceb379998ad1697305c29d19f32644a",
          "message": "fix: fix benchmarks broken by mutation recovery change (#808)\n\nThese were broken by 1538c424e2369c36c5a41c7876f0dad338e59768. \r\n\r\nthree fixes.\r\n1. close other indexeddbs we try to recover\r\n2. delete IDBDatabasesStore indexeddb db after each benchmark.  this way mutationRecovery is not try to recover a ton of dbs during benchmarks. \r\n3. make the indexeddb deletion code in perf tests more robost.  There is no way to wait for an indexeddb close to complete (the api is silently async).  If you call delete when a close is in process, it fails with a onblocked event.  Add code that will delay 100ms and then retry delete after a onblocked event (up to 10 retries).",
          "timestamp": "2022-02-04T09:38:42-08:00",
          "tree_id": "cc81b015c7757441e11493bb603a6ccb7ac5d27e",
          "url": "https://github.com/rocicorp/replicache/commit/ac33faf50ceb379998ad1697305c29d19f32644a"
        },
        "date": 1643996389954,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148273,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26845,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 146995,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26515,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63790,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18129,
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
          "id": "b980904005580a5817719681526191cf1f4a6598",
          "message": "fix: remove debugging console.log from benchmarks (#809)\n\nRemove debugging console.log from benchmarks.\r\n\r\nAccidentally check in here ac33faf50ceb379998ad1697305c29d19f32644a.",
          "timestamp": "2022-02-04T17:48:53Z",
          "tree_id": "a522d5c2f6e79528a5c1a0933d75a22b036797f5",
          "url": "https://github.com/rocicorp/replicache/commit/b980904005580a5817719681526191cf1f4a6598"
        },
        "date": 1643996994583,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148273,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26845,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 146995,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26515,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63790,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18129,
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
          "id": "f988f1c1db5ec5b9dd43020c64625508f26100d4",
          "message": "fix: Simplified Dueling Dags - Mutation Recovery - Do not recover mutation from clients with a different Replicache name (#810)\n\nProblem\r\n======\r\nA client _**MUST NOT**_ recover mutations from a client with a different Replicache name.  This is because a client uses its auth to push the mutations.  This is safe for client's with the same name as they are for the same user.  However, pushing on behalf of a client with a different name is very bad, as it will apply the mutations for a different user.\r\n\r\nSolution\r\n======\r\nAdd Replicache name to the IndexedDBDatabase records, and only recover mutations for clients with the same Repliache name.  Add a test for this behavior.\r\n\r\nAlso adds versioning to IDBDatabasesStore for easing handling of future format changes of  IndexedDBDatabase records.",
          "timestamp": "2022-02-04T11:13:49-08:00",
          "tree_id": "39fda2b737e9e2f1c8850b4befe56dcda321ebd3",
          "url": "https://github.com/rocicorp/replicache/commit/f988f1c1db5ec5b9dd43020c64625508f26100d4"
        },
        "date": 1644002092868,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148400,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26901,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 147122,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26549,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63875,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18151,
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
          "id": "a42745809efa825f769f9f737ee04aa8c8b6fc34",
          "message": "fix: add runtime checking for require non-empty Replicache name (#811)\n\nFixes #795",
          "timestamp": "2022-02-04T11:57:56-08:00",
          "tree_id": "f0410a9d31507acc580e6aeaebb0e1381cb05dc2",
          "url": "https://github.com/rocicorp/replicache/commit/a42745809efa825f769f9f737ee04aa8c8b6fc34"
        },
        "date": 1644004742692,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148435,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26917,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 147157,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26560,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63903,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18163,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c90c0ab1716b4084552e706e409d98593f3f2b94",
          "message": "Revert \"add licensing client\" (#816)\n\nThis reverts commit 01d45a4e465834217c5844766383d23b7ddb6170.\r\n\r\nThe CI cannot fetch the package",
          "timestamp": "2022-02-07T12:23:38+01:00",
          "tree_id": "f0410a9d31507acc580e6aeaebb0e1381cb05dc2",
          "url": "https://github.com/rocicorp/replicache/commit/c90c0ab1716b4084552e706e409d98593f3f2b94"
        },
        "date": 1644233084832,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 148435,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 26917,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 147157,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26560,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 63903,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18163,
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
          "id": "ef25543da8c82f8f445a4a325e275fdd2c2eebf5",
          "message": "feat: Simplified Dueling Dags - Mutation Recovery - Make recovery robust to errors and exit early on close. (#820)\n\n**Problem**\r\nIf the Mutation Recovery process stops on the first error encountered.  This means a single problematic db or client can prevent recovery of all other clients.  \r\n\r\n**Solution**\r\nUpdates Mutation Recovery logic to be more robust against errors.  If an error occurs recovering a particular \r\nclient or db, the logic will now log that error, and continue trying to recover other clients/dbs. \r\n\r\nAdding the above robustness requires the process to handle the Replicache instance being closed more explicitly.  Previously the process would stop on the first error encountered due to the Replicache intance being closed. \r\nThis change updates the logic to check if this Replicache instance is closed before processing each db, and \r\neach client inside each db, and exits early if this Replicache instance is closed.",
          "timestamp": "2022-02-07T10:50:38-08:00",
          "tree_id": "5e435a973dfba442a47b8c253a19db93f0de9913",
          "url": "https://github.com/rocicorp/replicache/commit/ef25543da8c82f8f445a4a325e275fdd2c2eebf5"
        },
        "date": 1644259904149,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150333,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27122,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149055,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26799,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64767,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18394,
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
          "id": "ab8990ae58853906ae0b6c465354a88f73d01d64",
          "message": "feat: Simplified Dueling Dags - Mutation Recovery - Optimize mutation recovery at startup by reusing client map read by client init. (#821)\n\n**Problem**\r\nMutation recovery regressed our median startup scan benchmark by ~20% (25 ms to 30 ms).\r\n\r\n**Solution**\r\nTry to mitigate by reusing the client map read by `persist.initClient`, rather than reading it in a new IndexedDB transaction.",
          "timestamp": "2022-02-07T19:11:00Z",
          "tree_id": "2b2db7a63b0903d8350230c5f486b3d3f34bfe61",
          "url": "https://github.com/rocicorp/replicache/commit/ab8990ae58853906ae0b6c465354a88f73d01d64"
        },
        "date": 1644261112829,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150437,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27174,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149159,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26829,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18390,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "83e15f22b04332eea9d3261a7c925633ca8f61c8",
          "message": "chore(deps): bump shelljs from 0.8.4 to 0.8.5 in /doc (#807)\n\nBumps [shelljs](https://github.com/shelljs/shelljs) from 0.8.4 to 0.8.5.\r\n- [Release notes](https://github.com/shelljs/shelljs/releases)\r\n- [Changelog](https://github.com/shelljs/shelljs/blob/master/CHANGELOG.md)\r\n- [Commits](https://github.com/shelljs/shelljs/compare/v0.8.4...v0.8.5)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: shelljs\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-02-08T09:42:32Z",
          "tree_id": "ed93870c93382e0dd1f45d97516fa53ad6c068c3",
          "url": "https://github.com/rocicorp/replicache/commit/83e15f22b04332eea9d3261a7c925633ca8f61c8"
        },
        "date": 1644313413822,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150437,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27174,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149159,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26829,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18390,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "85b33812235990fb733fe1c972ed2bf7b0fe080d",
          "message": "chore(deps): bump nanoid from 3.1.30 to 3.2.0 (#806)\n\nBumps [nanoid](https://github.com/ai/nanoid) from 3.1.30 to 3.2.0.\r\n- [Release notes](https://github.com/ai/nanoid/releases)\r\n- [Changelog](https://github.com/ai/nanoid/blob/main/CHANGELOG.md)\r\n- [Commits](https://github.com/ai/nanoid/compare/3.1.30...3.2.0)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: nanoid\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-02-08T09:47:48Z",
          "tree_id": "9357019f947b0291b6f3b8854be8cb19ee8bc1e4",
          "url": "https://github.com/rocicorp/replicache/commit/85b33812235990fb733fe1c972ed2bf7b0fe080d"
        },
        "date": 1644313726540,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150437,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27174,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149159,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26829,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18390,
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
          "id": "29bdaea299cfe232146d43257b8de433cf620b53",
          "message": "fix: Improve isolation of tests' and benchmarks' indexeddb state to reduce flakiness (#822)\n\nIn tests add a uuid to indexeddb database names (Replicache name and IDBDatbasesStore DB) \r\nto isolate tests' indexed db state.\r\n \r\nAlso fixes a bug in kv.IDBStore which was blocking IndexedDB opened by these stores from being \r\ndeleted.   In order to not block deletion of the db, the connection needs to be closed on \r\n`onversionchange`.  Previously the code was only setting up \r\n`db.onversionchange = () => db.close()` in `onupgradeneeded` which only fires if the db didnt \r\nalready exist.  Code is updated to always setup `db.onversionchange = () => db.close()`. \r\n\r\nWhile this fix allows the IndexedDB databases to be reliably deleted, it did not prevent races \r\naround deletion.  Before isolating with uuid, I was observing that after one test's teardown \r\nawait the deletion of a database with name X, if the next test opened the database with name \r\nX, the test would _sometimes_ get an error that its connection to X was closed, suggestion some \r\nrace where the deletion is not truly complete when the success callback for the deletion is invoked.\r\n\r\nFixes #819",
          "timestamp": "2022-02-08T08:38:33-08:00",
          "tree_id": "eff3bafc09cfe2daf99c93c9a90b75c61d174f10",
          "url": "https://github.com/rocicorp/replicache/commit/29bdaea299cfe232146d43257b8de433cf620b53"
        },
        "date": 1644338484568,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150495,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27179,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149217,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64795,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18461,
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
          "id": "f28980eefa4f3a207bf0fba9a951d4897e10434b",
          "message": "chore: improve createPushBody arg name and type in replicache-mutation-recovery.test (#825)",
          "timestamp": "2022-02-08T16:58:41Z",
          "tree_id": "0bca3f8cbaaee4977ae459e03d40e2a957fbbae2",
          "url": "https://github.com/rocicorp/replicache/commit/f28980eefa4f3a207bf0fba9a951d4897e10434b"
        },
        "date": 1644339586403,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150495,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27179,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149217,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64795,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18461,
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
          "id": "206685bc9a816076212b730fd7cfcdfbc30fb346",
          "message": "fix: Fix flakiness of replicache-persist.test.ts on Webkit (#828)\n\n**Problem**\r\nreplicache-persist.test is flacky on webkit because the persist process does not always complete before we \r\ncreate a new replicache and try to read the persisted data.  This happens more on webkit because it uses a \r\ntimeout rather than request idle callback to start persist.\r\n\r\n**Solution**\r\nWait for persist to complete (detected by polling the ClientMap) before creating a new Replicache and verifying\r\nit bootstraps from the persisted data.",
          "timestamp": "2022-02-08T14:46:30-08:00",
          "tree_id": "f9ce8fb2628921e04181765d799e989bdf6ae24d",
          "url": "https://github.com/rocicorp/replicache/commit/206685bc9a816076212b730fd7cfcdfbc30fb346"
        },
        "date": 1644360447725,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 150495,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27179,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149217,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26830,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 64795,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18461,
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
          "id": "d5dd28f357ec112864e2c73d9b62889d58dcbf0a",
          "message": "add licensing client",
          "timestamp": "2022-02-09T08:59:32-10:00",
          "tree_id": "68fe6087af007d111f07bd5ae04d4d49716f93bf",
          "url": "https://github.com/rocicorp/replicache/commit/d5dd28f357ec112864e2c73d9b62889d58dcbf0a"
        },
        "date": 1644433233602,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 231116,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 39780,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 229838,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 39428,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 115215,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 29012,
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
          "id": "9e495fa0259e0b9a0c2ab8400b4fcfff725761cf",
          "message": "add npmrc setup to perf CI",
          "timestamp": "2022-02-09T09:58:27-10:00",
          "tree_id": "906e2479cb21ccc7337e7432ca6cd220a0565239",
          "url": "https://github.com/rocicorp/replicache/commit/9e495fa0259e0b9a0c2ab8400b4fcfff725761cf"
        },
        "date": 1644436777133,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 231116,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 39780,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 229838,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 39428,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 115215,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 29012,
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
            "email": "157153+phritz@users.noreply.github.com",
            "name": "Phritz",
            "username": "phritz"
          },
          "distinct": true,
          "id": "bfd812b0026bd025ddb0fa3f59cc658220d7695d",
          "message": "Revert \"add npmrc setup to perf CI\"\n\nThis reverts commit 9e495fa0259e0b9a0c2ab8400b4fcfff725761cf.",
          "timestamp": "2022-02-09T10:03:59-10:00",
          "tree_id": "68fe6087af007d111f07bd5ae04d4d49716f93bf",
          "url": "https://github.com/rocicorp/replicache/commit/bfd812b0026bd025ddb0fa3f59cc658220d7695d"
        },
        "date": 1644437110547,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 231116,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 39780,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 229838,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 39428,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 115215,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 29012,
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
          "id": "6231b09ba697cb4f4a8d5e86bd7c1cf7310f39aa",
          "message": "add npmrc setup to perf CI",
          "timestamp": "2022-02-09T10:16:36-10:00",
          "tree_id": "8bb9428403c5ce6bddc6802b781f9c3f97569966",
          "url": "https://github.com/rocicorp/replicache/commit/6231b09ba697cb4f4a8d5e86bd7c1cf7310f39aa"
        },
        "date": 1644437886362,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 231116,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 39780,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 229838,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 39428,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 115215,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 29012,
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
          "id": "5104a8aa842acfae3fa3c1c04c372036a07820b1",
          "message": "bump licensing version",
          "timestamp": "2022-02-09T16:34:32-10:00",
          "tree_id": "78501dc8e5dcb27550eb36d03ba3658616fb9d0a",
          "url": "https://github.com/rocicorp/replicache/commit/5104a8aa842acfae3fa3c1c04c372036a07820b1"
        },
        "date": 1644460523447,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151000,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27353,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27002,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65053,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18511,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "d95d8bf18d84dc465f2cbe58069668fc86a2a6cd",
          "message": "refactor: Rename ReplicacheOptions.name and Replicache.name to userID.",
          "timestamp": "2022-02-09T21:03:00-10:00",
          "tree_id": "eb04d410445c922c61098f2237f9729188c85f7b",
          "url": "https://github.com/rocicorp/replicache/commit/d95d8bf18d84dc465f2cbe58069668fc86a2a6cd"
        },
        "date": 1644476635298,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151205,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27364,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149924,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27034,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65110,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18525,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "0a38f9f297fbf8159a1029785f957550ed3ba6c8",
          "message": "feat: Update Replicache Format Version from 3 to 4 for v9 release.",
          "timestamp": "2022-02-09T21:11:21-10:00",
          "tree_id": "b3bec3c3f0b36ece2eac1ddeea03246bea432003",
          "url": "https://github.com/rocicorp/replicache/commit/0a38f9f297fbf8159a1029785f957550ed3ba6c8"
        },
        "date": 1644477137173,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151205,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27398,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149924,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27030,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65110,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18597,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "addf5ffcdf1b8f4e851efdfc383527c38852f020",
          "message": "Bump version to 9.0.0-beta.1.",
          "timestamp": "2022-02-09T21:21:00-10:00",
          "tree_id": "965012483a7f03b4773ccef5a1595ace6db0ff71",
          "url": "https://github.com/rocicorp/replicache/commit/addf5ffcdf1b8f4e851efdfc383527c38852f020"
        },
        "date": 1644477721514,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151205,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27398,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149924,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27030,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65110,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18597,
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
          "id": "b40de269b9e8e178f11b098f6eb3112e4c5d53d6",
          "message": "refactor: Rename ReplicacheOptions.userID and Replicache.userID back to name. (#835)\n\nThis reverts commit d95d8bf18d84dc465f2cbe58069668fc86a2a6cd.\r\n\r\nWe realized we will need both a userID, and another identifier to support multiple Replicache instance for the same user (e.g. roomID).  We will do this api change in v10 rather than v9.  \r\n\r\nAdded details to documentation for `name` around Replicache bootsrapping and mutation recovery.",
          "timestamp": "2022-02-10T10:16:34-08:00",
          "tree_id": "1a01a62b035c7dd373dc90ab77b43deed02fb261",
          "url": "https://github.com/rocicorp/replicache/commit/b40de269b9e8e178f11b098f6eb3112e4c5d53d6"
        },
        "date": 1644517056804,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151000,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27331,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27012,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65053,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18536,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "e4c67f42481f9025f633e4cdc7dd9a5ff9089b40",
          "message": "Update package-lock.json",
          "timestamp": "2022-02-10T09:58:21-10:00",
          "tree_id": "eeb1e3a80ad7d59f6aa308ab13c6827b6387c236",
          "url": "https://github.com/rocicorp/replicache/commit/e4c67f42481f9025f633e4cdc7dd9a5ff9089b40"
        },
        "date": 1644523158801,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151000,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27331,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27012,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65053,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18536,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5c76f54b247e4412c7db6fc46601d034e76f736e",
          "message": "chore(deps): bump follow-redirects from 1.14.7 to 1.14.8 in /doc (#840)\n\nBumps [follow-redirects](https://github.com/follow-redirects/follow-redirects) from 1.14.7 to 1.14.8.\r\n- [Release notes](https://github.com/follow-redirects/follow-redirects/releases)\r\n- [Commits](https://github.com/follow-redirects/follow-redirects/compare/v1.14.7...v1.14.8)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: follow-redirects\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2022-02-14T15:36:49+01:00",
          "tree_id": "8e9d6faf0f16a1611482d62c7028d321cd27f1fc",
          "url": "https://github.com/rocicorp/replicache/commit/5c76f54b247e4412c7db6fc46601d034e76f736e"
        },
        "date": 1644849477866,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151000,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27331,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27012,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65053,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18536,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "358212cc1d153cea6ff39763417588fa1d7c6d7b",
          "message": "feat!: Prefix the IDB name with `rep:` (#842)\n\nFixes #836",
          "timestamp": "2022-02-14T20:37:34Z",
          "tree_id": "786bdf0e700af26f989ec4b73c1be94b7b6f4c50",
          "url": "https://github.com/rocicorp/replicache/commit/358212cc1d153cea6ff39763417588fa1d7c6d7b"
        },
        "date": 1644871117881,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151004,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27337,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149726,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27006,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65057,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18516,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3290f8e97df2d9ff17a4863225e7fa9e8e3d3a84",
          "message": "fix: Do not use window (#844)\n\nReplicache runs in web workers so we should not use `window`.",
          "timestamp": "2022-02-15T09:32:00Z",
          "tree_id": "de8378ca2c47e049794fe7ac1dbd8ee93475b8ce",
          "url": "https://github.com/rocicorp/replicache/commit/3290f8e97df2d9ff17a4863225e7fa9e8e3d3a84"
        },
        "date": 1644917588775,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151009,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27346,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 149731,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 26999,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65019,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18506,
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
          "id": "4c2001ad37721e7f148ccaa52803bb242ca1d467",
          "message": "fix: Catch errors in background interval processes and log appropriatly. (#846)\n\nProblem\r\n=======\r\nWe have a report of the following exception being thrown from `heartbeat.ts` after a Replicache instance is closed and a new one created as part of a development setup using Replicache, Reach hooks, and Next with HMR.\r\n\r\n```\r\nDOMException: Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.\r\n```\r\n\r\nWe do stop the heartbeat interval when a Replicache instance is closed, however there is a race that can lead to the above exception: if the Replicache instance is closed while the hearbeat update is running.  \r\n\r\nThis is a fairly narrow race, so I'm still uncertain if this is what the issue reporter is hitting. \r\n\r\nSolution\r\n=======\r\nCatch errors in interval based background processes and log them to 'debug' if the error occurred after the Replicache instance was closed (as this is an expected error), and to 'error' otherwise.  Applied this to the \"heartbeat\" and \"ClientGC\" processes.  The \"mutation recovery\" process already does this.\r\n\r\nAlso added so additional debug logging to aid in further debugging if this does not fix the issue for the reporter.\r\n\r\n\r\nFixes #843",
          "timestamp": "2022-02-24T13:50:42-08:00",
          "tree_id": "016622276cf1e1891a63442d984787a4b6a7cd30",
          "url": "https://github.com/rocicorp/replicache/commit/4c2001ad37721e7f148ccaa52803bb242ca1d467"
        },
        "date": 1645739510439,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151984,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27539,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 150706,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27180,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65484,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18643,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "47cc40a5d7506b6d63a51726a7b09117cafc6b8b",
          "message": "Bump version to 9.0.0-beta.2.",
          "timestamp": "2022-02-24T14:57:06-10:00",
          "tree_id": "c995678e0be78655a28ecbca40f03f7806bfdbc6",
          "url": "https://github.com/rocicorp/replicache/commit/47cc40a5d7506b6d63a51726a7b09117cafc6b8b"
        },
        "date": 1645750707165,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151984,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27539,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 150706,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27180,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65484,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18643,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9fd50e10f5d36932829f4ba3b36075b077097ed9",
          "message": "chore(deps): bump prismjs from 1.26.0 to 1.27.0 in /doc (#847)\n\nBumps [prismjs](https://github.com/PrismJS/prism) from 1.26.0 to 1.27.0.\r\n- [Release notes](https://github.com/PrismJS/prism/releases)\r\n- [Changelog](https://github.com/PrismJS/prism/blob/master/CHANGELOG.md)\r\n- [Commits](https://github.com/PrismJS/prism/compare/v1.26.0...v1.27.0)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: prismjs\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2022-02-28T16:59:44+01:00",
          "tree_id": "f6abe36d483070d27fb0679fc82bfa4486d50986",
          "url": "https://github.com/rocicorp/replicache/commit/9fd50e10f5d36932829f4ba3b36075b077097ed9"
        },
        "date": 1646064062685,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 151984,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 27539,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 150706,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27180,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 65484,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 18643,
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
          "id": "0b84a67f0833fbb7a0de50a0d405dccc9ab801c8",
          "message": "add license check call",
          "timestamp": "2022-03-01T09:40:46-10:00",
          "tree_id": "b8d351b8c26c8193d0dff936984f9b9570371955",
          "url": "https://github.com/rocicorp/replicache/commit/0b84a67f0833fbb7a0de50a0d405dccc9ab801c8"
        },
        "date": 1646163722034,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 154964,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28129,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153686,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27778,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 66966,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19095,
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
          "id": "bd50f9923ebeb5c1173ccab8ece313f86a53d414",
          "message": "move license check to after ready",
          "timestamp": "2022-03-01T11:05:58-10:00",
          "tree_id": "ff62bc9b92adbea5d47f4a470930c71b11207cf8",
          "url": "https://github.com/rocicorp/replicache/commit/bd50f9923ebeb5c1173ccab8ece313f86a53d414"
        },
        "date": 1646168834823,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "5ff1b23494583122722ee8b838f2461d7d1e005c",
          "message": "Merge tag 'v9.0.0'",
          "timestamp": "2022-03-02T21:52:28-10:00",
          "tree_id": "bab29d3f8f85d03163ad42eca82bca9a9ddafc2a",
          "url": "https://github.com/rocicorp/replicache/commit/5ff1b23494583122722ee8b838f2461d7d1e005c"
        },
        "date": 1646294045425,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "dda2cb70ea1a1b42e060bb2a87c225dcc976de60",
          "message": "Update HACKING.md",
          "timestamp": "2022-03-02T21:59:08-10:00",
          "tree_id": "24954f807b5dbb38a309ad675ea5727f1960a729",
          "url": "https://github.com/rocicorp/replicache/commit/dda2cb70ea1a1b42e060bb2a87c225dcc976de60"
        },
        "date": 1646294418158,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "6234c54a4867e05434a4a70f619f4f90f72e6ea0",
          "message": "Add 64MB write/sub/read benchmark 😬",
          "timestamp": "2022-03-03T18:33:21-10:00",
          "tree_id": "75ee393bac3b03824fe824005ccb1afb0f8684cb",
          "url": "https://github.com/rocicorp/replicache/commit/6234c54a4867e05434a4a70f619f4f90f72e6ea0"
        },
        "date": 1646368460722,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "0dc390fa2a3f877c197e0662e0fd7011f62f3a1c",
          "message": "Add 10MB populate tests.",
          "timestamp": "2022-03-03T22:08:06-10:00",
          "tree_id": "be54ded722ca79dc78bd25a21ac5a8d406ced9d1",
          "url": "https://github.com/rocicorp/replicache/commit/0dc390fa2a3f877c197e0662e0fd7011f62f3a1c"
        },
        "date": 1646381380242,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "2442bc5dcad97769c22c67c6105e3aa56b2cd4e3",
          "message": "Minor perf optimization to benchmarks. This reduces time of the 16MB\nrun by about 10%. It has no affect on the result of the benchmark,\njust the setup overhead.",
          "timestamp": "2022-03-06T19:17:51-10:00",
          "tree_id": "4f059426f705279bcddcfd4813fb211302ede79b",
          "url": "https://github.com/rocicorp/replicache/commit/2442bc5dcad97769c22c67c6105e3aa56b2cd4e3"
        },
        "date": 1646630333907,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3a5da8644030a6e0fcaa88ca7ce4a57d3a1edd91",
          "message": "Update HACKING.md",
          "timestamp": "2022-03-06T21:39:41-10:00",
          "tree_id": "af940f1102c11e93395bbca2502d1f3c6ec3a3a8",
          "url": "https://github.com/rocicorp/replicache/commit/3a5da8644030a6e0fcaa88ca7ce4a57d3a1edd91"
        },
        "date": 1646638843155,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "200a6a3f93dd2113f3f82131a93fe785ed57529a",
          "message": "Update HACKING.md",
          "timestamp": "2022-03-06T21:40:08-10:00",
          "tree_id": "e562d16195580c3715a8f741165d3f77802d625e",
          "url": "https://github.com/rocicorp/replicache/commit/200a6a3f93dd2113f3f82131a93fe785ed57529a"
        },
        "date": 1646638862961,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 155238,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28170,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 153960,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 27821,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67016,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19088,
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
          "id": "f4c021b0bf9fa162f83d28073606d31cb21c21c3",
          "message": "add license active ping",
          "timestamp": "2022-03-07T15:34:43-10:00",
          "tree_id": "aa97a954c6ffb7d5118e95178ff0370161248d97",
          "url": "https://github.com/rocicorp/replicache/commit/f4c021b0bf9fa162f83d28073606d31cb21c21c3"
        },
        "date": 1646703571651,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 157202,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28378,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 155924,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28052,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67895,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19250,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "039d333ab98e8c463a7f38e5f8d595ea17fab6d3",
          "message": "fix: Log subscribe errors if no onError (#864)\n\nIf `onError` is provided to a subscription the `onError` handler gets\r\ncalled with the exception as argument.\r\n\r\nIf there is no `onError` then we log the error to the console.\r\n\r\nFixes #862",
          "timestamp": "2022-03-10T13:39:22+01:00",
          "tree_id": "f546b2d44cb01c5f7a0902f67d74bed0ad640780",
          "url": "https://github.com/rocicorp/replicache/commit/039d333ab98e8c463a7f38e5f8d595ea17fab6d3"
        },
        "date": 1646916016027,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 157317,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28385,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 156039,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28059,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 67934,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19255,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "97d56722c35cabd0b351270b6882ed176b0aa59c",
          "message": "chore: Add a mustGetChunk that throws if missing (#866)\n\nNow, all code paths that gets a required chunk uses `mustGetChunk`. When\r\nthe chunk is missing this throws a `MissingChunkError`.\r\n\r\nThe idea is that the caller will detect these errors and see if the\r\nclient might have been GC'd.\r\n\r\nTowards #784",
          "timestamp": "2022-03-11T15:36:22+01:00",
          "tree_id": "00a630d694322f53471681e582e4e3e67f34f5c2",
          "url": "https://github.com/rocicorp/replicache/commit/97d56722c35cabd0b351270b6882ed176b0aa59c"
        },
        "date": 1647009433549,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 157644,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28463,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 156366,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28094,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68101,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19336,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2cbbf982f0c932e5d99e3e5a02bbfd78be38991d",
          "message": "feat: Check if client exists in persist (#867)\n\nWe now check if the client ID exists in the client map when we do a\r\n`persist`. If it doesn't we throw a `MissingClientError`.\r\n\r\nFor testing purpose we can skip this check.\r\n\r\nThe intended use is to handle clients that are missing and raise an\r\n\"event\" on the Replicache instance when this happens.\r\n\r\nTowards #784",
          "timestamp": "2022-03-12T15:18:34Z",
          "tree_id": "77cebeb2bca9496c2f4744b4acd5824c8e87eba7",
          "url": "https://github.com/rocicorp/replicache/commit/2cbbf982f0c932e5d99e3e5a02bbfd78be38991d"
        },
        "date": 1647098373171,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 158309,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28582,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 157031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28225,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68379,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19430,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "dcc2469f6c1a4b7d29fe0bbb0dc6852f38e93aec",
          "message": "chore: Add another scan perf test with ~10MB (#869)",
          "timestamp": "2022-03-14T14:53:46+01:00",
          "tree_id": "6bfda283c3719624f9c43fc31524364f7cfba866",
          "url": "https://github.com/rocicorp/replicache/commit/dcc2469f6c1a4b7d29fe0bbb0dc6852f38e93aec"
        },
        "date": 1647266090446,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 158309,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28582,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 157031,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28225,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 68379,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19430,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8cdf0b0600c2c664a3ca1be5287ac8045ec3b03a",
          "message": "feat: Add onClientStateNotFound (#868)\n\nThis hooks up the test if the client exists. If the client does not\r\nexist we call `onClientStateNotFound`.\r\n\r\nThe test for the client missing is done in persist, query, mutate,\r\nheartbeat as well as in visibilitychange when the visibilityState\r\nis visible.\r\n\r\nFixes #784",
          "timestamp": "2022-03-15T11:23:57+01:00",
          "tree_id": "e1febd87d09354224a1f9d97113c3c103475a841",
          "url": "https://github.com/rocicorp/replicache/commit/8cdf0b0600c2c664a3ca1be5287ac8045ec3b03a"
        },
        "date": 1647339899123,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160617,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28924,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159339,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28576,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69310,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19702,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "48772c7be90d3d4bd290a072e6538a91b33c32d8",
          "message": "chore: Rename MissingChunkError (#871)\n\nTo ChunkNotFoundError\r\n\r\nTo be consistent with ClientStateNotFound",
          "timestamp": "2022-03-15T15:38:31+01:00",
          "tree_id": "26cc0140149ea31eaab0a712232b76de83651467",
          "url": "https://github.com/rocicorp/replicache/commit/48772c7be90d3d4bd290a072e6538a91b33c32d8"
        },
        "date": 1647355164916,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160624,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28916,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159346,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28578,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69313,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f3b14231a2cea9046b8b8bb1d32a0292abe4c96b",
          "message": "chore: No need to depend on node-fetch (#873)",
          "timestamp": "2022-03-17T11:09:14+01:00",
          "tree_id": "f87eb9816ea793753f18e7090eb379ffa3eba4e6",
          "url": "https://github.com/rocicorp/replicache/commit/f3b14231a2cea9046b8b8bb1d32a0292abe4c96b"
        },
        "date": 1647511829582,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160624,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28916,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159346,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28578,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69313,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0d0c2bdd037ff1b1a73293e8e674cf1db6db67dc",
          "message": "chore: Use @rocicorp/lock (#874)",
          "timestamp": "2022-03-17T10:25:09Z",
          "tree_id": "1185a4b475e38318f2426787b7e6a67e79ab4f1a",
          "url": "https://github.com/rocicorp/replicache/commit/0d0c2bdd037ff1b1a73293e8e674cf1db6db67dc"
        },
        "date": 1647512760866,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160889,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28952,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159611,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28598,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69403,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19714,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d14daf02433e6216abf87582d6b9fe70a7c41069",
          "message": "chore: Remove flag to persist (#875)\n\nFix tests to not need to skip the checking of missing clients\r\n\r\nFollowup to #867",
          "timestamp": "2022-03-17T11:19:18Z",
          "tree_id": "773ad72c0d4a90f86752157c0058f09e4db511ad",
          "url": "https://github.com/rocicorp/replicache/commit/d14daf02433e6216abf87582d6b9fe70a7c41069"
        },
        "date": 1647516021281,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160850,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28949,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159572,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28592,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69397,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19729,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a4f9ee79c822bdc4455a64007e0948f11515d777",
          "message": "chore: Use @rocicorp/resolver (#877)",
          "timestamp": "2022-03-17T16:47:41+01:00",
          "tree_id": "0c5604b8b2fb2e763fdbbdba8bd281be6960a762",
          "url": "https://github.com/rocicorp/replicache/commit/a4f9ee79c822bdc4455a64007e0948f11515d777"
        },
        "date": 1647532296391,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160642,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 28935,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159364,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28613,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69307,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19660,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "95de115b2a8df1035032bdcd9a0a1c246b4582f4",
          "message": "chore: Use @rocicorp/logger (#879)",
          "timestamp": "2022-03-17T21:33:40Z",
          "tree_id": "a43b51fac7168625a1027424a6c7ab15652af571",
          "url": "https://github.com/rocicorp/replicache/commit/95de115b2a8df1035032bdcd9a0a1c246b4582f4"
        },
        "date": 1647552875366,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161052,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29055,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159774,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28716,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69439,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19746,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6811fc73abb2865a681f7709db4cfbd8f90721d2",
          "message": "fix: Use json deepEqual in splice computation (#881)\n\nThis could potentionally lead to a subscription firing when the value\r\ndidn't change.\r\n\r\nFixes #841",
          "timestamp": "2022-03-18T15:08:40+01:00",
          "tree_id": "fd906a5a0d92049b124ca2801da43350074a312b",
          "url": "https://github.com/rocicorp/replicache/commit/6811fc73abb2865a681f7709db4cfbd8f90721d2"
        },
        "date": 1647612587026,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161060,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29052,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28718,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69440,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19757,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b7e18a7dd53fd4d59ef73179b111422c8f61217f",
          "message": "chore: Increase timeout for startup (#882)\n\nUse default value of 30s",
          "timestamp": "2022-03-18T15:33:58Z",
          "tree_id": "6c2d9ee2995d0df9942fb522eac3b4f3b6d3bfa5",
          "url": "https://github.com/rocicorp/replicache/commit/b7e18a7dd53fd4d59ef73179b111422c8f61217f"
        },
        "date": 1647617697717,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161060,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29052,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28718,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69440,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19757,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "57afd41a345e37dccddcf01817fecd4d63662711",
          "message": "chore: Use @rocicorp deps directly (#888)\n\nInstead of going through a deps.ts file",
          "timestamp": "2022-03-22T16:29:59+01:00",
          "tree_id": "08c33cecaa51c695fe8707a807aa61548b0b4b82",
          "url": "https://github.com/rocicorp/replicache/commit/57afd41a345e37dccddcf01817fecd4d63662711"
        },
        "date": 1647963065655,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161060,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29052,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159782,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28718,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69440,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19765,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8787290fcf2f491737cd4ff97d4b0d7f801c41dc",
          "message": "chore!: Removal of deprecated Replicache methods. (#890)\n\nThis removes the following deprecated methods from the Replicache\r\ninstance:\r\n- scan\r\n- has\r\n- isEmpty\r\n- get\r\n\r\nThese have been deprecated since 8.0",
          "timestamp": "2022-03-22T15:34:07Z",
          "tree_id": "4d80a29c22df1b29f06ce8905865874a8a9449e9",
          "url": "https://github.com/rocicorp/replicache/commit/8787290fcf2f491737cd4ff97d4b0d7f801c41dc"
        },
        "date": 1647963304567,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160666,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29010,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159388,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28682,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69226,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19681,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "b97153d576dac82c91d6a8b2e372dec1ad8b4413",
          "message": "Review comments",
          "timestamp": "2022-03-22T06:25:33-10:00",
          "tree_id": "9b1a6dae1611b2b594a5bd5cac76ca8360ff13d1",
          "url": "https://github.com/rocicorp/replicache/commit/b97153d576dac82c91d6a8b2e372dec1ad8b4413"
        },
        "date": 1647966431171,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160700,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29021,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159403,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28664,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69244,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19739,
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
          "id": "0181a23a3c9da60595ac115d9794a938fdbcb73f",
          "message": "licensing calls throw on non-200 response",
          "timestamp": "2022-03-24T15:50:48-10:00",
          "tree_id": "de48003e8c6c84808f0be396c462f4a8a152e7b8",
          "url": "https://github.com/rocicorp/replicache/commit/0181a23a3c9da60595ac115d9794a938fdbcb73f"
        },
        "date": 1648173119324,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 160829,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29050,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 159532,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28680,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69283,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19757,
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
          "id": "f887494bae563bf29f9f20c58c7f4ffc8f6eeae0",
          "message": "include profileID in push and pull requests",
          "timestamp": "2022-03-24T19:12:33-10:00",
          "tree_id": "9c3a13a391ee0de6010951805283b784bd4d0446",
          "url": "https://github.com/rocicorp/replicache/commit/f887494bae563bf29f9f20c58c7f4ffc8f6eeae0"
        },
        "date": 1648185208216,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161733,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29177,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 160436,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28834,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69675,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19855,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f29860cf7592972f7badec12adcc95a598240b4f",
          "message": "chore(deps): bump node-forge from 1.2.1 to 1.3.0 in /doc (#892)\n\nBumps [node-forge](https://github.com/digitalbazaar/forge) from 1.2.1 to 1.3.0.\r\n- [Release notes](https://github.com/digitalbazaar/forge/releases)\r\n- [Changelog](https://github.com/digitalbazaar/forge/blob/main/CHANGELOG.md)\r\n- [Commits](https://github.com/digitalbazaar/forge/compare/v1.2.1...v1.3.0)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: node-forge\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-03-25T09:33:14Z",
          "tree_id": "51af46ed4b53fa43a0733c62d76485b5e2225440",
          "url": "https://github.com/rocicorp/replicache/commit/f29860cf7592972f7badec12adcc95a598240b4f"
        },
        "date": 1648200856632,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161733,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29177,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 160436,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28834,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69675,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19855,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "aa197f8642f49c68458b6d77e1d84737b373825c",
          "message": "chore: Only use LogContext in Replicache class (#889)",
          "timestamp": "2022-03-25T11:28:29+01:00",
          "tree_id": "af54b1e23fa77fc5b85b6a8432712b104ef52e42",
          "url": "https://github.com/rocicorp/replicache/commit/aa197f8642f49c68458b6d77e1d84737b373825c"
        },
        "date": 1648204165861,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161589,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29171,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 160292,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28799,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69614,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19887,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e2eb9382477a36e7f8f73ee4197b1e7aac01c468",
          "message": "feat: Disable a bunch of assertions in prod (#891)\n\nWhen `process.env.NODE_ENV === 'production'` we skip validating the\r\nshape of the chunks (is it a Commit? is it a B+Tree?) as well as\r\nskipping validating that the JSONValue is really a JSONValue.\r\n\r\nFixes #876",
          "timestamp": "2022-03-25T12:36:40+01:00",
          "tree_id": "76884438356588dba9be9a34760f82528785ac86",
          "url": "https://github.com/rocicorp/replicache/commit/e2eb9382477a36e7f8f73ee4197b1e7aac01c468"
        },
        "date": 1648208264589,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 161880,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29221,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 160583,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 28867,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 69673,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 19875,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "212797317a92afe88c5215fb42a03204232dcb7b",
          "message": "feat: New Phone, Who Dis? (#880)\n\nThe server can now tell the client that it does not know about a client.\r\nWhen this happens the client calls `onClientStateNotFound`.\r\n\r\nThe server can return:\r\n\r\n```json\r\n{\"error\": \"ClientStateNotFound\"}\r\n```\r\n\r\nFixes #335",
          "timestamp": "2022-03-25T15:50:43+01:00",
          "tree_id": "0218084ca8e5fe753868c1ae9130d2cffe8f37dc",
          "url": "https://github.com/rocicorp/replicache/commit/212797317a92afe88c5215fb42a03204232dcb7b"
        },
        "date": 1648219906617,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163175,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29416,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161878,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29059,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70188,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20022,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d923876d25a9b8bbc2365ea4d2088c782b4c10ec",
          "message": "refactor: Remove unused ScanResult parameters (#896)\n\nNow that the deprecated scan has been removed we can remov some of the\r\nparameters to ScanResult etc.",
          "timestamp": "2022-03-25T15:06:14Z",
          "tree_id": "8384c82537a6f6d25019824ef8f87ddb9c22aa8a",
          "url": "https://github.com/rocicorp/replicache/commit/d923876d25a9b8bbc2365ea4d2088c782b4c10ec"
        },
        "date": 1648220860466,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163110,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29403,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161813,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29047,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70156,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20008,
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
          "id": "985df5049653322767c8ba72f37048514b2ed377",
          "message": "update to latest licensing beta",
          "timestamp": "2022-03-25T14:32:09-10:00",
          "tree_id": "a834e5fc3ebc1fdd65e307c810879d6d06cc024d",
          "url": "https://github.com/rocicorp/replicache/commit/985df5049653322767c8ba72f37048514b2ed377"
        },
        "date": 1648254795006,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "dc6bba3bef2dce5ae3f6cdefcf83d48754a75138",
          "message": "Replicache chat with todo in sidebar",
          "timestamp": "2022-03-25T22:27:31-10:00",
          "tree_id": "6e7bf18867134579122450d2130fbdd3508c19ec",
          "url": "https://github.com/rocicorp/replicache/commit/dc6bba3bef2dce5ae3f6cdefcf83d48754a75138"
        },
        "date": 1648283315893,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "88780821d1440bd143ff8e875a967f445e83c24b",
          "message": "Update Getting Started to use TodoMVC.",
          "timestamp": "2022-03-25T22:39:26-10:00",
          "tree_id": "20d990413e6e9baccc549a0d650a3eae27d73d45",
          "url": "https://github.com/rocicorp/replicache/commit/88780821d1440bd143ff8e875a967f445e83c24b"
        },
        "date": 1648284033414,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "94f650398f2934b2cb7589de9dd71c00a271265d",
          "message": "Add missing cd command",
          "timestamp": "2022-03-25T22:45:21-10:00",
          "tree_id": "83b0b3ade733de88f6b5f8b60ceb9b13c9c99f44",
          "url": "https://github.com/rocicorp/replicache/commit/94f650398f2934b2cb7589de9dd71c00a271265d"
        },
        "date": 1648284387763,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4a9b69699a3e9095271d16321367fa34edb9401a",
          "message": "chore(deps): bump minimist from 1.2.5 to 1.2.6 (#898)\n\nBumps [minimist](https://github.com/substack/minimist) from 1.2.5 to 1.2.6.\r\n- [Release notes](https://github.com/substack/minimist/releases)\r\n- [Commits](https://github.com/substack/minimist/compare/1.2.5...1.2.6)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: minimist\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-03-26T20:26:26Z",
          "tree_id": "1524f6f0f4435de01f1a53a6c221ccb814cb3809",
          "url": "https://github.com/rocicorp/replicache/commit/4a9b69699a3e9095271d16321367fa34edb9401a"
        },
        "date": 1648326444602,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "be941afc8e67b730324d6ff963a8c498b4190c05",
          "message": "Whoops fix the images in the integration guide.",
          "timestamp": "2022-03-26T19:52:52-10:00",
          "tree_id": "d8f58c93960a4f84588ff3c35b457a4844171276",
          "url": "https://github.com/rocicorp/replicache/commit/be941afc8e67b730324d6ff963a8c498b4190c05"
        },
        "date": 1648360463680,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "74e097f8edf4fe6c4394faafc2816958068dbb7d",
          "message": "spruce",
          "timestamp": "2022-03-26T20:04:24-10:00",
          "tree_id": "04ca355887d2f77e393027671ecf28e2e8da97ff",
          "url": "https://github.com/rocicorp/replicache/commit/74e097f8edf4fe6c4394faafc2816958068dbb7d"
        },
        "date": 1648361145535,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "03048aff75c1aafb60850319e4a03a1c047cad0a",
          "message": "Fix another confused image in the docs.",
          "timestamp": "2022-03-27T23:09:17-10:00",
          "tree_id": "3844e04ea092a7feb515c9ac3fd18faa2b84673c",
          "url": "https://github.com/rocicorp/replicache/commit/03048aff75c1aafb60850319e4a03a1c047cad0a"
        },
        "date": 1648458692546,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9759bd452e9344b7499e1a45b375627a8555f43f",
          "message": "chore(deps): bump minimist from 1.2.5 to 1.2.6 in /doc (#899)\n\nBumps [minimist](https://github.com/substack/minimist) from 1.2.5 to 1.2.6.\r\n- [Release notes](https://github.com/substack/minimist/releases)\r\n- [Commits](https://github.com/substack/minimist/compare/1.2.5...1.2.6)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: minimist\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-03-28T10:01:18Z",
          "tree_id": "ebd325c5965796a81f86e8758b56eabcc9206b87",
          "url": "https://github.com/rocicorp/replicache/commit/9759bd452e9344b7499e1a45b375627a8555f43f"
        },
        "date": 1648461735642,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7fd4930ca748a18fbb09c76e638d18d9e6d2c773",
          "message": "chore: Silence tests (#902)\n\nAnd assert we log the right thing",
          "timestamp": "2022-03-28T13:23:13+02:00",
          "tree_id": "c89257f33b364f2714998eea26d8523a7a987597",
          "url": "https://github.com/rocicorp/replicache/commit/7fd4930ca748a18fbb09c76e638d18d9e6d2c773"
        },
        "date": 1648466649529,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1980d07d5ee7dc00489f6f8b724189b1f997e3ce",
          "message": "chore(deps): bump ansi-regex from 4.1.0 to 4.1.1 in /doc (#900)\n\nBumps [ansi-regex](https://github.com/chalk/ansi-regex) from 4.1.0 to 4.1.1.\r\n- [Release notes](https://github.com/chalk/ansi-regex/releases)\r\n- [Commits](https://github.com/chalk/ansi-regex/compare/v4.1.0...v4.1.1)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: ansi-regex\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\n\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Erik Arvidsson <erik.arvidsson@gmail.com>",
          "timestamp": "2022-03-28T11:26:32Z",
          "tree_id": "927e2dd248fa0eb309648ff31ceb5719c18d9d6c",
          "url": "https://github.com/rocicorp/replicache/commit/1980d07d5ee7dc00489f6f8b724189b1f997e3ce"
        },
        "date": 1648466852739,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163163,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29421,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 161866,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29066,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70192,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20012,
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
          "id": "445973d7e1bc34089dbe197e0f96516a955307b8",
          "message": "enable licensing by default",
          "timestamp": "2022-03-28T20:42:05-10:00",
          "tree_id": "aa1479e99a84b0b40b6af7d8c7ce353a947f4a30",
          "url": "https://github.com/rocicorp/replicache/commit/445973d7e1bc34089dbe197e0f96516a955307b8"
        },
        "date": 1648536175710,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163482,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29484,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162185,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29105,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70346,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20102,
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
          "id": "0a302aac0547d57a02b81a923ad5744b2d960fd5",
          "message": "change get-license command",
          "timestamp": "2022-03-30T14:35:57-10:00",
          "tree_id": "89857bac8496f7f36c82e6fa0284d7a2922536d8",
          "url": "https://github.com/rocicorp/replicache/commit/0a302aac0547d57a02b81a923ad5744b2d960fd5"
        },
        "date": 1648687017274,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163364,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29463,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162067,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29103,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70298,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20041,
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
          "id": "e1ca4c3a861febfa38382e6952b330a87e054243",
          "message": "add licensing to docs",
          "timestamp": "2022-03-30T16:16:51-10:00",
          "tree_id": "f732073cfd1bf198778edf6dcb509aa270178328",
          "url": "https://github.com/rocicorp/replicache/commit/e1ca4c3a861febfa38382e6952b330a87e054243"
        },
        "date": 1648693067181,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163364,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29463,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162067,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29103,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70298,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20041,
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
          "id": "0538bb7311b9a188880ca701c6b398918355beec",
          "message": "typo",
          "timestamp": "2022-03-30T17:35:26-10:00",
          "tree_id": "b6f2f61fb5415eed2ad92fec051de1578c68b32d",
          "url": "https://github.com/rocicorp/replicache/commit/0538bb7311b9a188880ca701c6b398918355beec"
        },
        "date": 1648697777196,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163364,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29463,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162067,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29103,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70298,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20041,
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
          "id": "6838d99364a68fdbea999b4dbe50159c3cb4f545",
          "message": "format",
          "timestamp": "2022-03-31T13:34:45-10:00",
          "tree_id": "86238d95ae7bf7b50bc440b4423e2eb549847b09",
          "url": "https://github.com/rocicorp/replicache/commit/6838d99364a68fdbea999b4dbe50159c3cb4f545"
        },
        "date": 1648769738507,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 163517,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29479,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162220,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29125,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70393,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20081,
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
          "id": "a677307c3b34cec2515fdb101d7e7fdd15f8f8d9",
          "message": "feature: Enable custom log handling by adding logSink to ReplicacheOptions (#907)",
          "timestamp": "2022-04-01T10:55:44-07:00",
          "tree_id": "ed08918deb4165a71402ca85a2590b65676e143b",
          "url": "https://github.com/rocicorp/replicache/commit/a677307c3b34cec2515fdb101d7e7fdd15f8f8d9"
        },
        "date": 1648835807601,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164039,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29610,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162720,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29235,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20204,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "42a3decd81ff5161f1ad0d75d08156ad4159443c",
          "message": "feat!: Switch to use a ScanReader and expose it to the API. (#906)\n\nThis changes scan to use a ScanReader instead of an async iterator.\r\n\r\nIt also exposes a function that returns a ScanResult from a ScanReader\r\nand ScanOptions.\r\n\r\n```ts\r\ndeclare const options: ScanOptions;\r\ndeclare const reader: ScanReader;\r\n\r\nconst scanResult = makeScanResult(reader, options);\r\n```\r\n\r\nIf you are trying to implement Replicache's scan API you now only need\r\nto write a function that creates a ScanReader.\r\nmakeScanResult will take care of seeking to the correct\r\nposition and reading the data.\r\n\r\nWhen working with index scans you need to use `ScanReader<IndexKey>`\r\n\r\nCloses #607",
          "timestamp": "2022-04-04T11:48:15Z",
          "tree_id": "ec5226eacf72808de19616007d0ceddf612b4bdd",
          "url": "https://github.com/rocicorp/replicache/commit/42a3decd81ff5161f1ad0d75d08156ad4159443c"
        },
        "date": 1649072959441,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 166079,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29901,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164738,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29542,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71705,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20446,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "distinct": true,
          "id": "b5d7a12ffa9cbd2fe418f75191435c6a066d5b10",
          "message": "Revert \"feat!: Switch to use a ScanReader and expose it to the API. (#906)\"\n\nRegressed writeSubRead\n\nThis reverts commit 42a3decd81ff5161f1ad0d75d08156ad4159443c.",
          "timestamp": "2022-04-04T14:45:59+02:00",
          "tree_id": "ed08918deb4165a71402ca85a2590b65676e143b",
          "url": "https://github.com/rocicorp/replicache/commit/b5d7a12ffa9cbd2fe418f75191435c6a066d5b10"
        },
        "date": 1649076443880,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164039,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29610,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 162720,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29235,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 70652,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20204,
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
          "id": "590410fc060dcf64c011e483f314f2e2a7fc2d28",
          "message": "fix: Update mutation recovery to handle push and/or pull being disabled appropriately. (#912)",
          "timestamp": "2022-04-05T15:29:31-07:00",
          "tree_id": "6ce6e5d7d8e9461c316050ce21af098b1e32a129",
          "url": "https://github.com/rocicorp/replicache/commit/590410fc060dcf64c011e483f314f2e2a7fc2d28"
        },
        "date": 1649197831164,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 164697,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29722,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163378,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29363,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71017,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20319,
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
          "id": "0b8a99ffb95d63e33d89bd29e95ae9b6348ec8df",
          "message": "feature: Add some internal hidden options needed for reflect (#915)\n\nAdds\r\n1. disableLicensing\r\n2. disableMutationRecovery",
          "timestamp": "2022-04-05T17:11:04-07:00",
          "tree_id": "52c33a5b2d63a3bb9b09128094f9e4651cc41702",
          "url": "https://github.com/rocicorp/replicache/commit/0b8a99ffb95d63e33d89bd29e95ae9b6348ec8df"
        },
        "date": 1649203914868,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165147,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29781,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163828,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29423,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71167,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20361,
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
          "id": "26fe74fa24065a88b1c19946254185e1ca9a7f2c",
          "message": "chore: bump version to 10.0.0-alpha.0 (#916)",
          "timestamp": "2022-04-06T00:30:50Z",
          "tree_id": "5b9730c49e4ec05eecc696267cec988ea1766699",
          "url": "https://github.com/rocicorp/replicache/commit/26fe74fa24065a88b1c19946254185e1ca9a7f2c"
        },
        "date": 1649205112628,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165147,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29781,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163828,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29423,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71167,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20361,
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
          "id": "5a7eb810aa7fc764c446b59fb25fe34279e34f65",
          "message": "Bump version to 10.0.0-alpha.0 in VERSION and BSL.txt. (#917)",
          "timestamp": "2022-04-06T00:48:06Z",
          "tree_id": "5a08f9c9585b9c6cccdb451cd93427070c330850",
          "url": "https://github.com/rocicorp/replicache/commit/5a7eb810aa7fc764c446b59fb25fe34279e34f65"
        },
        "date": 1649206155765,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165147,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29781,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163828,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29423,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71167,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20361,
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
          "id": "c2c115c97fe5ad8e4e28bee65802d153c2a43e0b",
          "message": "fix: d.ts output to include necessary @rocicorp/lock and @rocicorp/logger declarations. (#918)",
          "timestamp": "2022-04-06T10:51:18-07:00",
          "tree_id": "20acf79dc16071eba1881a462c72d31ef9722094",
          "url": "https://github.com/rocicorp/replicache/commit/c2c115c97fe5ad8e4e28bee65802d153c2a43e0b"
        },
        "date": 1649267533352,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165147,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29781,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163828,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29423,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71167,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20361,
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
          "id": "d29165b986a555a215245ec54db7438a13099f45",
          "message": "feature: export TEST_LICENSE_KEY from src/mod.ts for customer use in tests (#925)",
          "timestamp": "2022-04-07T00:33:33Z",
          "tree_id": "49ea61b8353f0004f94f5cb443539ede22fc9959",
          "url": "https://github.com/rocicorp/replicache/commit/d29165b986a555a215245ec54db7438a13099f45"
        },
        "date": 1649291667196,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165191,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29794,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 163848,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29425,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71190,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20368,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2c83f22f50924474cc5f9d5e60ccb9c3dc8252b1",
          "message": "feat!: Expose a way to reuse ScanResult (#926)\n\nWe now expose a method called `makeScanResult`. It takes a `ScanOptions`\r\nand a function that returns an async iterator.\r\n\r\n```ts\r\nmakeScanResult({prefix: 'b'}, async function* (fromKey) {\r\n  // yield ['a', 1];\r\n  yield ['b', 2];\r\n});\r\n```\r\n\r\nor when using an index:\r\n\r\n```ts\r\nmakeScanResult(\r\n  {prefix: 'b', indexName: 'i'},\r\n  async function* (indexName, fromSecondaryKey, fromPrimaryKey) {\r\n    // yield [['as', 'ap', 1];\r\n    yield [['bs', 'bp', 2];\r\n});\r\n```\r\n\r\nTo make this work we moved the limit and exclusive handling to the top\r\nlevel iterator loop.\r\n\r\nWe now compute the fromKey and pass that into the iterator.\r\n\r\nFixes #607",
          "timestamp": "2022-04-07T17:41:30+02:00",
          "tree_id": "8aa8e6398ac326bca7d0cc8ba31a6c88b8970fb2",
          "url": "https://github.com/rocicorp/replicache/commit/2c83f22f50924474cc5f9d5e60ccb9c3dc8252b1"
        },
        "date": 1649346159717,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 166952,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30131,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 165587,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29767,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71693,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20565,
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
          "id": "c5c0baaec8a29dd6c1fc39e05a1d490bcf1b3a8b",
          "message": "refactor: Small improvements to internal options (#927)\n\n1. Add a ReplicacheInternalOptions type def.\r\n2. Have replicacheForTesting accept internal options so tests dont have to cast.\r\n3. Switch options from disable to enable.",
          "timestamp": "2022-04-07T21:09:06Z",
          "tree_id": "90119f28eaf2055aba7bd6f4e7269026aff662fb",
          "url": "https://github.com/rocicorp/replicache/commit/c5c0baaec8a29dd6c1fc39e05a1d490bcf1b3a8b"
        },
        "date": 1649365799517,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 166831,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30141,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 165466,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29756,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71671,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20615,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "distinct": true,
          "id": "9857468fe380479c39cf0167576937a489bae3a4",
          "message": "Bump version to 10.0.0-alpha.1.",
          "timestamp": "2022-04-07T15:46:56-07:00",
          "tree_id": "141175ca5b517ef20c51cb2afd3537fa8960b7e6",
          "url": "https://github.com/rocicorp/replicache/commit/9857468fe380479c39cf0167576937a489bae3a4"
        },
        "date": 1649371761861,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 166831,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30141,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 165466,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29756,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71671,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20615,
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
          "id": "77b3d3085fe2ad1f0725c77b3785a472240611d4",
          "message": "update licensing and complain if version too old",
          "timestamp": "2022-04-07T16:54:26-10:00",
          "tree_id": "404f0bd6069142da8f04b8e90827e7a2cb8d1efd",
          "url": "https://github.com/rocicorp/replicache/commit/77b3d3085fe2ad1f0725c77b3785a472240611d4"
        },
        "date": 1649386529031,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167648,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30325,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166283,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29948,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72149,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20782,
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
            "email": "157153+phritz@users.noreply.github.com",
            "name": "Phritz",
            "username": "phritz"
          },
          "distinct": true,
          "id": "be73814502de08cac0aa766536752088aee359e1",
          "message": "Revert \"feat!: Expose a way to reuse ScanResult (#926)\"\n\nThis reverts commit 2c83f22f50924474cc5f9d5e60ccb9c3dc8252b1.",
          "timestamp": "2022-04-07T17:34:25-10:00",
          "tree_id": "b8626822b9d71d27cbc046bab6054b3b23d50cf1",
          "url": "https://github.com/rocicorp/replicache/commit/be73814502de08cac0aa766536752088aee359e1"
        },
        "date": 1649388924119,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 165887,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 29967,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 164544,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29613,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 71646,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20598,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "cbca2683838451ee438a07201156dece12107508",
          "message": "feat!: Expose makeScanResult (#931)\n\n* Revert \"Revert \"feat!: Expose a way to reuse ScanResult (#926)\"\"\r\n\r\nThis reverts commit be73814502de08cac0aa766536752088aee359e1.\r\n\r\n* fix!: Make scan returns the public type\r\n\r\nAlso, try to simplify the types of scan further",
          "timestamp": "2022-04-08T11:31:36+02:00",
          "tree_id": "33b8064789434489f6c2bf49e5985ee9fbcb14b9",
          "url": "https://github.com/rocicorp/replicache/commit/cbca2683838451ee438a07201156dece12107508"
        },
        "date": 1649410361135,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167696,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30340,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166305,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29965,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72174,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20809,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "430ef7c560a151eead8e6530bcf4015478788042",
          "message": "refactor: Convert the key for btree index iterator early (#932)\n\nInstead of converting the key from third party BTree iterators to our\r\nencoded string, convert our encoded string to to an entry. Then let the\r\nmain scan loop work with IndexKey as needed.\r\n\r\nThe benefit is that for external iterators we do not have to go from\r\nIndexKey to string and back to IndexKey.",
          "timestamp": "2022-04-08T14:00:08+02:00",
          "tree_id": "316f5884bda87d3be80dc289292de0c2b5d934c3",
          "url": "https://github.com/rocicorp/replicache/commit/430ef7c560a151eead8e6530bcf4015478788042"
        },
        "date": 1649419276916,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167681,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30291,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166290,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29928,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72181,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20744,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6dd3dcf3025c3258b9391b700aa787b2b500d516",
          "message": "refactor: Move fromKeyForIndexScan to same file (#933)\n\nWe have fromKeyForIndexScan and fromKeyForIndexScanInternal. Move them\r\nnext to each other.",
          "timestamp": "2022-04-08T14:57:00+02:00",
          "tree_id": "a2656aaf012eef5aa9bc8b18c799b53129bd9703",
          "url": "https://github.com/rocicorp/replicache/commit/6dd3dcf3025c3258b9391b700aa787b2b500d516"
        },
        "date": 1649422684145,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167683,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30253,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166292,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29878,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72181,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20708,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "committer": {
            "email": "greg@roci.dev",
            "name": "Gregory Baker",
            "username": "grgbkr"
          },
          "distinct": true,
          "id": "b0d8e2af7decb2096d9de3b01349f20504f3aac5",
          "message": "Bump version to 10.0.0-alpha.2.",
          "timestamp": "2022-04-08T12:07:36-07:00",
          "tree_id": "de57362341e4dca795468ffdac521fb2fbaa5743",
          "url": "https://github.com/rocicorp/replicache/commit/b0d8e2af7decb2096d9de3b01349f20504f3aac5"
        },
        "date": 1649445004949,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167683,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30253,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166292,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29878,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72181,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20708,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "19b66a6454874120cf03b7175a9363e5fc70bcef",
          "message": "chore: Update deps (#934)\n\nMainly to get a newer TS",
          "timestamp": "2022-04-08T20:08:23Z",
          "tree_id": "06bf99e8e44795cb354741120751edc0a3d41756",
          "url": "https://github.com/rocicorp/replicache/commit/19b66a6454874120cf03b7175a9363e5fc70bcef"
        },
        "date": 1649448559673,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167339,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30169,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166292,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29878,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72203,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20796,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "erik.arvidsson@gmail.com",
            "name": "Erik Arvidsson",
            "username": "arv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ace708fbd7d769658d853eedf5e58612d1e6d2eb",
          "message": "chore: Add type test for scan().keys().toArray (#936)\n\nThis ensures that the type of `scan().keys().toArray()` has the correct\r\ntype.",
          "timestamp": "2022-04-09T11:54:30+02:00",
          "tree_id": "05aae6587b59c8784055dec096e2ba0ab281bbe7",
          "url": "https://github.com/rocicorp/replicache/commit/ace708fbd7d769658d853eedf5e58612d1e6d2eb"
        },
        "date": 1649498129735,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Size of replicache.js",
            "value": 167339,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.js.br (Brotli compressed)",
            "value": 30169,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs",
            "value": 166292,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.mjs.br (Brotli compressed)",
            "value": 29878,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs",
            "value": 72203,
            "unit": "bytes"
          },
          {
            "name": "Size of replicache.min.mjs.br (Brotli compressed)",
            "value": 20796,
            "unit": "bytes"
          }
        ]
      }
    ]
  }
}