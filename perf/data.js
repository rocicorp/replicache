window.BENCHMARK_DATA = {
  "lastUpdate": 1625876226183,
  "repoUrl": "https://github.com/rocicorp/replicache",
  "entries": {
    "Benchmark": [
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
          "id": "f6e56ad2f62d7c5af8874dceb58ff474d3e026b5",
          "message": "Update HACKING.md",
          "timestamp": "2021-07-09T17:14:41-07:00",
          "tree_id": "78293a0d823ba12b5d7c21a32850a5cdb82fe1e5",
          "url": "https://github.com/rocicorp/replicache/commit/f6e56ad2f62d7c5af8874dceb58ff474d3e026b5"
        },
        "date": 1625876225603,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 5.21,
            "range": "±235.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.57,
            "range": "±8.0%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 2.83,
            "range": "±8.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 2.15,
            "range": "±166.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.71,
            "range": "±52.7%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.94,
            "range": "±56.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 4.38,
            "range": "±69.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 4.42,
            "range": "±68.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±2445.7%",
            "unit": "MB/s",
            "extra": "101 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 100.9,
            "range": "±563.3%",
            "unit": "ops/sec",
            "extra": "55 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.53,
            "range": "±2.9%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 1.23,
            "range": "±5.6%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 11.45,
            "range": "±45.8%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "subscription 100",
            "value": 11.68,
            "range": "±9.6%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "subscription 1000",
            "value": 11.24,
            "range": "±56.0%",
            "unit": "ops/sec",
            "extra": "7 samples"
          }
        ]
      }
    ]
  }
}