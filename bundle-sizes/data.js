window.BENCHMARK_DATA = {
  "lastUpdate": 1636474232472,
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
      }
    ]
  }
}