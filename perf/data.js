window.BENCHMARK_DATA = {
  "lastUpdate": 1625873613028,
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
          "id": "1b03d6185e4f91c65084ba13141b0084313b90eb",
          "message": "Reload the browser between each perf test (#428)\n\nSo that subscrioption tests are not affected by order",
          "timestamp": "2021-07-09T16:02:07-07:00",
          "tree_id": "afa5a9c70798e784206434a173e9dfb495dc385a",
          "url": "https://github.com/rocicorp/replicache/commit/1b03d6185e4f91c65084ba13141b0084313b90eb"
        },
        "date": 1625871882329,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 4.06,
            "range": "±226.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.17,
            "range": "±8.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 2.6,
            "range": "±8.4%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 1.85,
            "range": "±8.4%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.52,
            "range": "±43.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.32,
            "range": "±5.7%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 4.45,
            "range": "±45.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 4.24,
            "range": "±83.7%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±1373.1%",
            "unit": "MB/s",
            "extra": "72 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 75.08,
            "range": "±457.0%",
            "unit": "ops/sec",
            "extra": "41 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.19,
            "range": "±9.1%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 1.1,
            "range": "±4.9%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 8.7,
            "range": "±5.5%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 100",
            "value": 8.77,
            "range": "±8.2%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 7.78,
            "range": "±38.9%",
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
          "id": "196f2e56ff97249efbb3c41152ff2047a79a0ad9",
          "message": "Use non deprecated rollup-plugin-ts",
          "timestamp": "2021-07-09T16:25:12-07:00",
          "tree_id": "aa0bbde608bab7ab4426fe00eb5e4f9b46ca9b7f",
          "url": "https://github.com/rocicorp/replicache/commit/196f2e56ff97249efbb3c41152ff2047a79a0ad9"
        },
        "date": 1625873268843,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 4.32,
            "range": "±241.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.05,
            "range": "±3.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 2.47,
            "range": "±12.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 1.82,
            "range": "±13.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.31,
            "range": "±49.3%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.42,
            "range": "±3.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 4.15,
            "range": "±68.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 3.77,
            "range": "±4.0%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±1819.0%",
            "unit": "MB/s",
            "extra": "85 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 84.84,
            "range": "±630.3%",
            "unit": "ops/sec",
            "extra": "47 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.06,
            "range": "±7.2%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 0.99,
            "range": "±4.4%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 9.98,
            "range": "±13.7%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 100",
            "value": 9.06,
            "range": "±7.8%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 8.19,
            "range": "±44.6%",
            "unit": "ops/sec",
            "extra": "5 samples"
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
          "id": "9aff6290b694ff3f4729bccb2596f3afc2d91125",
          "message": "One more rename (#429)",
          "timestamp": "2021-07-09T23:19:26Z",
          "tree_id": "88f687c4dbafc49b11fbf807295b8f5e19d54580",
          "url": "https://github.com/rocicorp/replicache/commit/9aff6290b694ff3f4729bccb2596f3afc2d91125"
        },
        "date": 1625873458693,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 4.74,
            "range": "±218.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 4.64,
            "range": "±27.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 1.47,
            "range": "±6.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 2.32,
            "range": "±10.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 4.07,
            "range": "±44.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 4.01,
            "range": "±58.0%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 4.88,
            "range": "±58.4%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 4.41,
            "range": "±8.4%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±1851.2%",
            "unit": "MB/s",
            "extra": "86 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 77.21,
            "range": "±534.4%",
            "unit": "ops/sec",
            "extra": "42 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 5.9,
            "range": "±7.7%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 1.15,
            "range": "±15.9%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 9.86,
            "range": "±12.3%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 100",
            "value": 9.18,
            "range": "±16.0%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 8.82,
            "range": "±28.6%",
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
          "id": "943979acf47ff6865b90b70ac902eb6bf8bdf572",
          "message": "Update docusaurus etc",
          "timestamp": "2021-07-09T16:30:33-07:00",
          "tree_id": "113ce17c23595147a2662fe8899a2af749e29de0",
          "url": "https://github.com/rocicorp/replicache/commit/943979acf47ff6865b90b70ac902eb6bf8bdf572"
        },
        "date": 1625873612455,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 4.02,
            "range": "±241.1%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 3.7,
            "range": "±14.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 2.16,
            "range": "±258.5%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 1.72,
            "range": "±12.8%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x1000",
            "value": 3.18,
            "range": "±45.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "read tx 1024x5000",
            "value": 3.09,
            "range": "±61.6%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 3.72,
            "range": "±65.9%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 3.44,
            "range": "±6.2%",
            "unit": "MB/s",
            "extra": "5 samples"
          },
          {
            "name": "write single byte",
            "value": 0,
            "range": "±1593.8%",
            "unit": "MB/s",
            "extra": "72 samples"
          },
          {
            "name": "roundtrip write/subscribe/get",
            "value": 76.05,
            "range": "±444.1%",
            "unit": "ops/sec",
            "extra": "41 samples"
          },
          {
            "name": "create index 1024x1000",
            "value": 4.52,
            "range": "±1.9%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "create index 1024x5000",
            "value": 0.9,
            "range": "±6.0%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 10",
            "value": 8,
            "range": "±29.6%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 100",
            "value": 8.13,
            "range": "±45.3%",
            "unit": "ops/sec",
            "extra": "5 samples"
          },
          {
            "name": "subscription 1000",
            "value": 7.9,
            "range": "±19.4%",
            "unit": "ops/sec",
            "extra": "5 samples"
          }
        ]
      }
    ]
  }
}