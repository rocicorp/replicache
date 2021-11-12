window.BENCHMARK_DATA = {
  "lastUpdate": 1636756666517,
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
      }
    ]
  }
}