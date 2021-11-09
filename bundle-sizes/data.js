window.BENCHMARK_DATA = {
  "lastUpdate": 1636477223960,
  "repoUrl": "https://github.com/rocicorp/replicache",
  "entries": {
    "Benchmark": [
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
          "id": "4813b8209c788bd8f1819bcf0de161a5881fe423",
          "message": "feat: Setup dashboard and alerts for bundle sizes (#677)\n\n### Problem\r\nWe are missing a way to see bundle size changes over time (i.e. across commits).  It would also be nice to get alerts when bundle sizes increase by more than a small percent.\r\n\r\n### Solution\r\n\r\n- Create a small node script that outputs the bundle sizes in the format needed for the github-action-benchmark customSmallerIsBetter tool.  \r\n- Set up yml for github action that will run this script and use github-action-benchmark to graph the sizes on a new dashboard at https://rocicorp.github.io/replicache/bundle-sizes/\r\n- Also configure an alert for when bundle sizes increase by more than **5%.** \r\n\r\nCloses #125",
          "timestamp": "2021-11-08T19:15:39-08:00",
          "tree_id": "468347858d21689b9523cb5b46ad0abf521c79ed",
          "url": "https://github.com/rocicorp/replicache/commit/4813b8209c788bd8f1819bcf0de161a5881fe423"
        },
        "date": 1636427767273,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "replicache.js size",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs size",
            "value": 184636,
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
          "id": "1fa2cfdc6334cbc8db8c506477397c4590b44e44",
          "message": "refactor: Rework test config to avoid missing new tests in src/ (#676)\n\n### Problem\r\nNew tests added to the `src/` dir are not run by `npm run test` unless the are explicitly added to `web-test-runner.config.mjs`.  This is unexpected as tests added to subdirs of src are automatically included, and so I was confused for sometime as to why a new test I added wasn't running.  \r\n\r\nThe reason for this is we don't want to run `src/worker.test.ts` with the other tests.\r\n\r\n### Solution\r\nMove `worker.test.ts` and `worker-test.ts` to a subdir `worker-tests`, and add `src/*.test.ts` to files config in `web-test-runner.config.mjs`.  Now new tests added to `src/` will automatically be included in `npm run test`.",
          "timestamp": "2021-11-09T16:10:00Z",
          "tree_id": "f9ca8796a9b450624c4b8841eccf4309cc1012ab",
          "url": "https://github.com/rocicorp/replicache/commit/1fa2cfdc6334cbc8db8c506477397c4590b44e44"
        },
        "date": 1636474232159,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "replicache.js size",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs size",
            "value": 184636,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "rocicorp",
            "username": "rocicorp"
          },
          "committer": {
            "name": "rocicorp",
            "username": "rocicorp"
          },
          "id": "89b38b43b42f3b277f9a0cf83097f0d8d72118ee",
          "message": "try to brotli compress bundles",
          "timestamp": "2021-11-09T16:10:04Z",
          "url": "https://github.com/rocicorp/replicache/pull/679/commits/89b38b43b42f3b277f9a0cf83097f0d8d72118ee"
        },
        "date": 1636475546108,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "replicache.js size",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs size",
            "value": 184636,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "rocicorp",
            "username": "rocicorp"
          },
          "committer": {
            "name": "rocicorp",
            "username": "rocicorp"
          },
          "id": "29131f73f8b6d9230c549247528dba51cae44d17",
          "message": "try to brotli compress bundles",
          "timestamp": "2021-11-09T16:10:04Z",
          "url": "https://github.com/rocicorp/replicache/pull/679/commits/29131f73f8b6d9230c549247528dba51cae44d17"
        },
        "date": 1636476109584,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "replicache.js size",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "replicache.js.br size",
            "value": 34800,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs size",
            "value": 184636,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs.br size",
            "value": 34659,
            "unit": "bytes"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "eric@ericanderson.ca",
            "name": "Eric Anderson",
            "username": "aroc"
          },
          "committer": {
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "29ab1cd78593f937371a03c78c57d6600a909e74",
          "message": "Fix import from wrong lib",
          "timestamp": "2021-11-09T06:43:22-10:00",
          "tree_id": "5f2e49e296d540f573ef8ed9ae99c24c5d7b1747",
          "url": "https://github.com/rocicorp/replicache/commit/29ab1cd78593f937371a03c78c57d6600a909e74"
        },
        "date": 1636476230611,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "replicache.js size",
            "value": 184990,
            "unit": "bytes"
          },
          {
            "name": "replicache.mjs size",
            "value": 184636,
            "unit": "bytes"
          }
        ]
      }
    ],
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
      }
    ]
  }
}