window.BENCHMARK_DATA = {
  "lastUpdate": 1625864318160,
  "repoUrl": "https://github.com/rocicorp/replicache",
  "entries": {
    "Benchmark": [
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
          "id": "4d26f554643b844e560a3d1cb6f54a23325982d9",
          "message": "Change perf output dir",
          "timestamp": "2021-07-09T13:50:36-07:00",
          "tree_id": "0f01cec1a52020bde21d25fad76c6d4fff4c7f01",
          "url": "https://github.com/rocicorp/replicache/commit/4d26f554643b844e560a3d1cb6f54a23325982d9"
        },
        "date": 1625863996321,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 5.22,
            "range": "±266.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.72,
            "range": "±8.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 2.92,
            "range": "±6.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 2.17,
            "range": "±4.0%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.64,
            "range": "±60.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.82,
            "range": "±6.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 4.46,
            "range": "±66.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 4.45,
            "range": "±66.7%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±2022.5%",
            "unit": "MB/s",
            "extra": "108 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 103.33,
            "range": "±536.8%",
            "unit": "ops/sec",
            "extra": "53 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.94,
            "range": "±0.3%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 1.18,
            "range": "±4.8%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 10.7,
            "range": "±28.3%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "subscription 100",
            "value": 6.52,
            "range": "±18.0%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 1.33,
            "range": "±5.9%",
            "unit": "ops/sec",
            "extra": "5 samples"
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
          "id": "47e896afef57da0f1e832db7decb0584d3fff613",
          "message": "Perf dashboard: Link to gh pages instead",
          "timestamp": "2021-07-09T13:56:05-07:00",
          "tree_id": "063fb3bf38286341a3b2de87ef69c2c28b234c8c",
          "url": "https://github.com/rocicorp/replicache/commit/47e896afef57da0f1e832db7decb0584d3fff613"
        },
        "date": 1625864317625,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 5.13,
            "range": "±258.4%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.78,
            "range": "±4.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 3.04,
            "range": "±6.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 2.2,
            "range": "±2.7%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.8,
            "range": "±55.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.94,
            "range": "±9.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 14.51,
            "range": "±341.0%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 4.38,
            "range": "±70.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±2660.5%",
            "unit": "MB/s",
            "extra": "119 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 103.94,
            "range": "±476.0%",
            "unit": "ops/sec",
            "extra": "53 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.9,
            "range": "±0.4%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 1.19,
            "range": "±1.2%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 10.7,
            "range": "±20.6%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "subscription 100",
            "value": 5.93,
            "range": "±21.1%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 1.32,
            "range": "±13.5%",
            "unit": "ops/sec",
            "extra": "5 samples"
          }
        ]
      }
    ]
  }
}