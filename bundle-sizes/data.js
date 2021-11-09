window.BENCHMARK_DATA = {
  "lastUpdate": 1636427767535,
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
      }
    ]
  }
}