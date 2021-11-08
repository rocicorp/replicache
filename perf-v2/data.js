window.BENCHMARK_DATA = {
  "lastUpdate": 1636407263802,
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
          "id": "87908ada3556051bc253d515483e3ba30874692d",
          "message": "feat: Create new perf dashboard where all measures are median ms (and thus smaller is better) (#654)\n\nThis does not get rid of the existing perf dashboard at https://rocicorp.github.io/replicache/perf/ and the alerts based on that, but rather adds a new one at https://rocicorp.github.io/replicache/perf-v2/ with corresponding alerts.  This ensures we have continuity of our benchmark data.  Once sufficient history is built up on the new dashbaord, we can clean up the old one (which will also allow some simplification/cleanup of the related code).  In the meantime we will get double alerts.\r\n\r\nThis utilizes the `customSmallerIsBetter` tool option of github-action-benchmark (see https://github.com/benchmark-action/github-action-benchmark#examples).\r\n\r\nWe have been using the `benchmarkjs` tool option, and emulating the output of that library https://github.com/bestiejs/benchmark.js, though we are not actually using the library.  Rather we are using our own custom benchmark implementation.\r\n\r\nExample JSON output:\r\n\r\n```\r\nGregorys-MacBook-Pro:replicache greg$ node perf/runner.js --format=json --run \"scan\"\r\n[\r\n  {\r\n    \"name\": \"scan 1024x1000\",\r\n    \"unit\": \"median ms\",\r\n    \"value\": 52.5,\r\n    \"range\": \"8.70\",\r\n    \"extra\": \"scan 1024x1000 50/75/90/95%=52.50/54.40/59.30/59.30 ms avg=51.34 ms (10 runs sampled)\"\r\n  },\r\n  {\r\n    \"name\": \"scan 1024x5000\",\r\n    \"unit\": \"median ms\",\r\n    \"value\": 236.5,\r\n    \"range\": \"27.50\",\r\n    \"extra\": \"scan 1024x5000 50/75/90/95%=236.50/246.40/264.00/264.00 ms avg=242.74 ms (5 runs sampled)\"\r\n  },\r\n  {\r\n    \"name\": \"[MemStore] scan 1024x1000\",\r\n    \"unit\": \"median ms\",\r\n    \"value\": 1.7000000178813934,\r\n    \"range\": \"4.10\",\r\n    \"extra\": \"[MemStore] scan 1024x1000 50/75/90/95%=1.70/2.00/2.20/2.30 ms avg=1.86 ms (269 runs sampled)\"\r\n  },\r\n  {\r\n    \"name\": \"[MemStore] scan 1024x5000\",\r\n    \"unit\": \"median ms\",\r\n    \"value\": 10.300000011920929,\r\n    \"range\": \"7.10\",\r\n    \"extra\": \"[MemStore] scan 1024x5000 50/75/90/95%=10.30/10.60/11.20/11.30 ms avg=10.53 ms (48 runs sampled)\"\r\n  }\r\n]\r\n```",
          "timestamp": "2021-11-02T19:11:53Z",
          "tree_id": "aebffe03f018e7b52440c41b9b910cca36f0c0a3",
          "url": "https://github.com/rocicorp/replicache/commit/87908ada3556051bc253d515483e3ba30874692d"
        },
        "date": 1635880971337,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 189.19999980926514,
            "unit": "median ms",
            "range": "±42.2%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=189.20/189.60/231.40/231.40 ms avg=194.78 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 279.6000003814697,
            "unit": "median ms",
            "range": "±31.3%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=279.60/282.20/310.90/310.90 ms avg=279.90 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 497.90000009536743,
            "unit": "median ms",
            "range": "±26.2%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=497.90/520.40/524.10/524.10 ms avg=505.88 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 775.9000000953674,
            "unit": "median ms",
            "range": "±18.9%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=775.90/778.30/794.80/794.80 ms avg=777.50 ms (5 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 79.69999980926514,
            "unit": "median ms",
            "range": "±7.4%",
            "extra": "read tx 1024x1000 50/75/90/95%=79.70/82.30/82.70/82.70 ms avg=78.03 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 376.09999990463257,
            "unit": "median ms",
            "range": "±766.6%",
            "extra": "read tx 1024x5000 50/75/90/95%=376.10/379.80/1142.70/1142.70 ms avg=527.86 ms (5 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 77.80000019073486,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "scan 1024x1000 50/75/90/95%=77.80/81.20/82.50/82.50 ms avg=77.97 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 363.7999997138977,
            "unit": "median ms",
            "range": "±782.2%",
            "extra": "scan 1024x5000 50/75/90/95%=363.80/372.60/1146.00/1146.00 ms avg=520.54 ms (5 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 385.40000009536743,
            "unit": "median ms",
            "range": "±25.9%",
            "extra": "create index 1024x1000 50/75/90/95%=385.40/397.40/411.30/411.30 ms avg=389.26 ms (5 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1859.2000002861023,
            "unit": "median ms",
            "range": "±1020.5%",
            "extra": "create index 1024x5000 50/75/90/95%=1859.20/2005.50/2879.70/2879.70 ms avg=2085.48 ms (5 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 68.59999990463257,
            "unit": "median ms",
            "range": "±4.9%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=68.60/71.50/73.50/73.50 ms avg=68.56 ms (8 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 220.30000019073486,
            "unit": "median ms",
            "range": "±20.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=220.30/223.90/240.70/240.70 ms avg=224.46 ms (5 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 235.40000009536743,
            "unit": "median ms",
            "range": "±27.0%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=235.40/241.10/262.40/262.40 ms avg=238.42 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 119.69999980926514,
            "unit": "median ms",
            "range": "±21.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=119.70/124.30/141.50/141.50 ms avg=122.14 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 112.09999990463257,
            "unit": "median ms",
            "range": "±12.5%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=112.10/117.50/124.60/124.60 ms avg=113.18 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 436.7000002861023,
            "unit": "median ms",
            "range": "±20.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=436.70/438.10/457.40/457.40 ms avg=438.90 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 709.3999996185303,
            "unit": "median ms",
            "range": "±14.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=709.40/715.40/716.50/716.50 ms avg=707.62 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 3.5,
            "unit": "median ms",
            "range": "±6.5%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=3.50/4.60/4.80/5.10 ms avg=4.03 ms (125 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25,
            "unit": "median ms",
            "range": "±18.3%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.00/25.50/28.10/43.30 ms avg=25.97 ms (20 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=2.60/3.20/3.60/3.70 ms avg=2.87 ms (174 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 15.900000095367432,
            "unit": "median ms",
            "range": "±18.6%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=15.90/17.10/20.40/22.70 ms avg=17.17 ms (30 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 267.59999990463257,
            "unit": "median ms",
            "range": "±9.4%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=267.60/274.10/277.00/277.00 ms avg=267.54 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 1325.0999999046326,
            "unit": "median ms",
            "range": "±28.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=1325.10/1351.30/1353.70/1353.70 ms avg=1331.14 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/4.20/4.40/4.60 ms avg=4.25 ms (118 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 13.699999809265137,
            "unit": "median ms",
            "range": "±6.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=13.70/14.60/15.20/15.60 ms avg=13.52 ms (37 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 11.400000095367432,
            "unit": "median ms",
            "range": "±234.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=11.40/13.00/13.80/16.60 ms avg=22.00 ms (23 runs sampled)"
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
          "id": "14ed81fdcdd8b3f2bf281ba19353ebecd84e7c56",
          "message": "chore: Fix index perf tests (#656)\n\nAn index value needs to be a string and that string cannot contain \\0\r\ncharacters.",
          "timestamp": "2021-11-02T19:32:08Z",
          "tree_id": "83cd2269af185aa3a3a636ce8efe355c72440372",
          "url": "https://github.com/rocicorp/replicache/commit/14ed81fdcdd8b3f2bf281ba19353ebecd84e7c56"
        },
        "date": 1635882134446,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 188.5,
            "unit": "median ms",
            "range": "±40.1%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=188.50/208.70/228.60/228.60 ms avg=198.40 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 275.90000009536743,
            "unit": "median ms",
            "range": "±31.8%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=275.90/287.20/307.70/307.70 ms avg=284.04 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 340.7999997138977,
            "unit": "median ms",
            "range": "±27.2%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=340.80/357.10/368.00/368.00 ms avg=346.38 ms (5 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 418.30000019073486,
            "unit": "median ms",
            "range": "±41.4%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=418.30/440.90/459.70/459.70 ms avg=425.86 ms (5 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 80.69999980926514,
            "unit": "median ms",
            "range": "±6.9%",
            "extra": "read tx 1024x1000 50/75/90/95%=80.70/80.90/83.60/83.60 ms avg=78.31 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 368.30000019073486,
            "unit": "median ms",
            "range": "±760.0%",
            "extra": "read tx 1024x5000 50/75/90/95%=368.30/377.70/1128.30/1128.30 ms avg=520.12 ms (5 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 78.7999997138977,
            "unit": "median ms",
            "range": "±7.7%",
            "extra": "scan 1024x1000 50/75/90/95%=78.80/84.90/86.50/86.50 ms avg=79.94 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 355.80000019073486,
            "unit": "median ms",
            "range": "±761.2%",
            "extra": "scan 1024x5000 50/75/90/95%=355.80/365.40/1117.00/1117.00 ms avg=507.64 ms (5 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 234.7999997138977,
            "unit": "median ms",
            "range": "±34.4%",
            "extra": "create index 1024x1000 50/75/90/95%=234.80/255.30/269.20/269.20 ms avg=243.58 ms (5 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1162.7999997138977,
            "unit": "median ms",
            "range": "±1752.6%",
            "extra": "create index 1024x5000 50/75/90/95%=1162.80/1205.90/2915.40/2915.40 ms avg=1521.58 ms (5 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 66.19999980926514,
            "unit": "median ms",
            "range": "±7.9%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=66.20/69.40/74.10/74.10 ms avg=67.10 ms (8 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 217.5,
            "unit": "median ms",
            "range": "±17.0%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=217.50/225.00/234.50/234.50 ms avg=221.88 ms (5 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 266.80000019073486,
            "unit": "median ms",
            "range": "±17.2%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=266.80/272.50/276.10/276.10 ms avg=263.04 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 121.5,
            "unit": "median ms",
            "range": "±17.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=121.50/125.80/138.50/138.50 ms avg=123.12 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 104.09999990463257,
            "unit": "median ms",
            "range": "±21.6%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=104.10/106.90/125.70/125.70 ms avg=108.76 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 215.40000009536743,
            "unit": "median ms",
            "range": "±25.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=215.40/219.30/241.20/241.20 ms avg=215.84 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 285.2000002861023,
            "unit": "median ms",
            "range": "±48.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=285.20/291.50/333.60/333.60 ms avg=291.96 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±6.4%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=3.30/4.40/4.60/4.90 ms avg=3.78 ms (133 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 24,
            "unit": "median ms",
            "range": "±16.7%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=24.00/25.00/28.50/40.70 ms avg=25.19 ms (20 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.299999713897705,
            "unit": "median ms",
            "range": "±22.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/5.60/6.10/8.80 ms avg=4.62 ms (109 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 15.699999809265137,
            "unit": "median ms",
            "range": "±18.0%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=15.70/16.50/19.80/22.20 ms avg=16.75 ms (30 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 74.30000019073486,
            "unit": "median ms",
            "range": "±319.8%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=74.30/189.10/394.10/394.10 ms avg=156.80 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 341.19999980926514,
            "unit": "median ms",
            "range": "±57.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=341.20/360.30/398.80/398.80 ms avg=354.88 ms (5 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/4.20/4.40/4.50 ms avg=4.20 ms (120 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 13.599999904632568,
            "unit": "median ms",
            "range": "±7.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=13.60/15.10/15.90/16.30 ms avg=13.81 ms (37 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 11.400000095367432,
            "unit": "median ms",
            "range": "±231.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=11.40/13.30/14.40/18.00 ms avg=22.17 ms (23 runs sampled)"
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
          "id": "4d2eda14d0e33b230d6ff1ef3b203d40aa8abdcc",
          "message": "chore: Tweak the perf runner slightly (#655)\n\n- No need to run forever if we have enough results\r\n- Increase minRuns\r\n- Remove the 2 slowest results. JIT warmu[",
          "timestamp": "2021-11-02T19:35:19Z",
          "tree_id": "eddae060aa172239ba3b488c095c4b008218debc",
          "url": "https://github.com/rocicorp/replicache/commit/4d2eda14d0e33b230d6ff1ef3b203d40aa8abdcc"
        },
        "date": 1635882453695,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 188.5,
            "unit": "median ms",
            "range": "±41.4%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=188.50/192.10/229.90/229.90 ms avg=241.73 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 284.2999997138977,
            "unit": "median ms",
            "range": "±48.4%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=284.30/322.10/332.70/332.70 ms avg=369.16 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 325.59999990463257,
            "unit": "median ms",
            "range": "±44.4%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=325.60/359.10/370.00/370.00 ms avg=426.21 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 419.19999980926514,
            "unit": "median ms",
            "range": "±47.1%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=419.20/437.80/466.30/466.30 ms avg=538.31 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 81.09999990463257,
            "unit": "median ms",
            "range": "±5.9%",
            "extra": "read tx 1024x1000 50/75/90/95%=81.10/82.90/84.30/84.30 ms avg=101.56 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 388.7000002861023,
            "unit": "median ms",
            "range": "±787.8%",
            "extra": "read tx 1024x5000 50/75/90/95%=388.70/1130.00/1176.50/1176.50 ms avg=709.17 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 80.80000019073486,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "scan 1024x1000 50/75/90/95%=80.80/82.20/84.50/84.50 ms avg=102.63 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 362.80000019073486,
            "unit": "median ms",
            "range": "±759.1%",
            "extra": "scan 1024x5000 50/75/90/95%=362.80/1113.50/1121.90/1121.90 ms avg=682.27 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 230.2999997138977,
            "unit": "median ms",
            "range": "±43.9%",
            "extra": "create index 1024x1000 50/75/90/95%=230.30/270.40/274.20/274.20 ms avg=304.79 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1170.1999998092651,
            "unit": "median ms",
            "range": "±75.9%",
            "extra": "create index 1024x5000 50/75/90/95%=1170.20/1188.40/1246.10/1246.10 ms avg=1505.56 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 70.10000038146973,
            "unit": "median ms",
            "range": "±10.2%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=70.10/72.00/80.30/80.30 ms avg=89.83 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 224.30000019073486,
            "unit": "median ms",
            "range": "±717.0%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=224.30/258.00/941.30/941.30 ms avg=391.39 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 263.5,
            "unit": "median ms",
            "range": "±119.0%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=263.50/272.80/382.50/382.50 ms avg=346.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 120.69999980926514,
            "unit": "median ms",
            "range": "±24.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=120.70/122.30/145.20/145.20 ms avg=147.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 109.40000009536743,
            "unit": "median ms",
            "range": "±25.1%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=109.40/113.80/134.50/134.50 ms avg=141.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 206.19999980926514,
            "unit": "median ms",
            "range": "±30.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.20/218.30/236.80/236.80 ms avg=265.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 268.7000002861023,
            "unit": "median ms",
            "range": "±48.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.70/291.70/317.40/317.40 ms avg=346.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.5,
            "unit": "median ms",
            "range": "±6.0%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.50/5.20/8.70/10.50 ms avg=5.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 27.200000286102295,
            "unit": "median ms",
            "range": "±17.2%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=27.20/28.00/30.90/44.40 ms avg=31.55 ms (16 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.70/7.80/7.90 ms avg=5.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 16.40000009536743,
            "unit": "median ms",
            "range": "±18.0%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=16.40/18.10/22.90/34.40 ms avg=19.86 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 67.10000038146973,
            "unit": "median ms",
            "range": "±23.5%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=67.10/84.70/90.60/90.60 ms avg=89.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 346.40000009536743,
            "unit": "median ms",
            "range": "±158.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=346.40/416.60/505.30/505.30 ms avg=473.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/4.70/6.50/9.70 ms avg=5.42 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.400000095367432,
            "unit": "median ms",
            "range": "±7.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.40/15.70/16.20/21.60 ms avg=16.27 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.00/15.40/17.60/17.60 ms avg=17.17 ms (7 runs sampled)"
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
          "id": "00cbe8399d5bcf3458f528257bc785547ce79315",
          "message": "feat: Add migration code for prolly map to b+tree (#649)\n\nIssue #596",
          "timestamp": "2021-11-02T19:45:05Z",
          "tree_id": "f45c072af5d0b5544ff60bd228b2b0e460fa21bd",
          "url": "https://github.com/rocicorp/replicache/commit/00cbe8399d5bcf3458f528257bc785547ce79315"
        },
        "date": 1635883083598,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 185.7000002861023,
            "unit": "median ms",
            "range": "±42.4%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=185.70/190.80/228.10/228.10 ms avg=242.00 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 275,
            "unit": "median ms",
            "range": "±67.4%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=275.00/298.70/342.40/342.40 ms avg=365.09 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 326.7000002861023,
            "unit": "median ms",
            "range": "±34.1%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=326.70/356.50/360.80/360.80 ms avg=425.51 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 418,
            "unit": "median ms",
            "range": "±48.8%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=418.00/433.30/466.80/466.80 ms avg=539.31 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 76.90000009536743,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "read tx 1024x1000 50/75/90/95%=76.90/79.20/82.60/82.60 ms avg=98.93 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 365.09999990463257,
            "unit": "median ms",
            "range": "±769.9%",
            "extra": "read tx 1024x5000 50/75/90/95%=365.10/416.70/1135.00/1135.00 ms avg=585.87 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 75.59999990463257,
            "unit": "median ms",
            "range": "±6.0%",
            "extra": "scan 1024x1000 50/75/90/95%=75.60/78.30/81.60/81.60 ms avg=97.81 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 361.7000002861023,
            "unit": "median ms",
            "range": "±774.8%",
            "extra": "scan 1024x5000 50/75/90/95%=361.70/1119.10/1136.50/1136.50 ms avg=680.23 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 231.2999997138977,
            "unit": "median ms",
            "range": "±27.3%",
            "extra": "create index 1024x1000 50/75/90/95%=231.30/252.20/258.60/258.60 ms avg=301.31 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1162.3999996185303,
            "unit": "median ms",
            "range": "±2646.3%",
            "extra": "create index 1024x5000 50/75/90/95%=1162.40/1164.80/3808.70/3808.70 ms avg=1854.07 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 70.09999990463257,
            "unit": "median ms",
            "range": "±5.9%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=70.10/73.40/76.00/76.00 ms avg=88.34 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 220.19999980926514,
            "unit": "median ms",
            "range": "±725.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=220.20/233.40/945.60/945.60 ms avg=384.20 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 277.1000003814697,
            "unit": "median ms",
            "range": "±73.8%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=277.10/278.50/350.90/350.90 ms avg=355.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.90000009536743,
            "unit": "median ms",
            "range": "±31.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.90/126.40/142.30/142.30 ms avg=146.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 111,
            "unit": "median ms",
            "range": "±11.1%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=111.00/113.30/122.10/122.10 ms avg=140.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 198.90000009536743,
            "unit": "median ms",
            "range": "±42.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=198.90/224.90/241.00/241.00 ms avg=263.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 258.69999980926514,
            "unit": "median ms",
            "range": "±54.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.70/296.30/312.80/312.80 ms avg=346.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.599999904632568,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.60/5.60/8.40/10.70 ms avg=5.43 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25.800000190734863,
            "unit": "median ms",
            "range": "±17.6%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.80/26.30/29.40/43.40 ms avg=29.87 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.4000000953674316,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.40/4.90/6.90/8.90 ms avg=4.42 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 16,
            "unit": "median ms",
            "range": "±18.4%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=16.00/17.70/22.60/34.40 ms avg=19.62 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 66.80000019073486,
            "unit": "median ms",
            "range": "±23.8%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=66.80/83.40/90.60/90.60 ms avg=88.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 339.7000002861023,
            "unit": "median ms",
            "range": "±180.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=339.70/398.60/520.00/520.00 ms avg=468.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±4.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/4.70/6.50/9.40 ms avg=5.33 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.5,
            "unit": "median ms",
            "range": "±7.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.50/15.70/16.00/21.50 ms avg=15.96 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.700000286102295,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.70/14.00/17.10/17.10 ms avg=16.09 ms (7 runs sampled)"
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
          "id": "6bb1852755cdd8b4242a42dcb7520d90229bda94",
          "message": "Update HACKING.md\n\nAdd link to perf-v2",
          "timestamp": "2021-11-02T13:52:38-07:00",
          "tree_id": "15d512164aebd1442417f7daabf341ce8f9709d8",
          "url": "https://github.com/rocicorp/replicache/commit/6bb1852755cdd8b4242a42dcb7520d90229bda94"
        },
        "date": 1635886682702,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 186.90000009536743,
            "unit": "median ms",
            "range": "±46.9%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=186.90/201.40/233.80/233.80 ms avg=244.20 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 268.19999980926514,
            "unit": "median ms",
            "range": "±31.0%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=268.20/277.30/299.20/299.20 ms avg=349.73 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 328.90000009536743,
            "unit": "median ms",
            "range": "±95.8%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=328.90/351.70/424.70/424.70 ms avg=430.54 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 408.5,
            "unit": "median ms",
            "range": "±45.0%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=408.50/442.60/453.50/453.50 ms avg=532.23 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 79.5,
            "unit": "median ms",
            "range": "±7.4%",
            "extra": "read tx 1024x1000 50/75/90/95%=79.50/80.60/81.30/81.30 ms avg=98.19 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 364.7999997138977,
            "unit": "median ms",
            "range": "±789.2%",
            "extra": "read tx 1024x5000 50/75/90/95%=364.80/1111.30/1154.00/1154.00 ms avg=687.09 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 76.19999980926514,
            "unit": "median ms",
            "range": "±6.4%",
            "extra": "scan 1024x1000 50/75/90/95%=76.20/78.60/82.60/82.60 ms avg=97.96 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 360.69999980926514,
            "unit": "median ms",
            "range": "±755.1%",
            "extra": "scan 1024x5000 50/75/90/95%=360.70/394.40/1115.80/1115.80 ms avg=570.89 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 227,
            "unit": "median ms",
            "range": "±25.3%",
            "extra": "create index 1024x1000 50/75/90/95%=227.00/250.50/252.30/252.30 ms avg=294.11 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1144.4000000953674,
            "unit": "median ms",
            "range": "±937.7%",
            "extra": "create index 1024x5000 50/75/90/95%=1144.40/1982.70/2082.10/2082.10 ms avg=1717.99 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 72.39999961853027,
            "unit": "median ms",
            "range": "±5.0%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=72.40/74.80/75.60/75.60 ms avg=90.14 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 217.59999990463257,
            "unit": "median ms",
            "range": "±722.1%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=217.60/235.60/939.70/939.70 ms avg=383.50 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 264.90000009536743,
            "unit": "median ms",
            "range": "±86.2%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=264.90/273.10/351.10/351.10 ms avg=344.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111,
            "unit": "median ms",
            "range": "±32.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.00/124.10/143.40/143.40 ms avg=146.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 112,
            "unit": "median ms",
            "range": "±12.3%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=112.00/116.20/124.30/124.30 ms avg=143.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 210.59999990463257,
            "unit": "median ms",
            "range": "±32.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.60/227.20/242.80/242.80 ms avg=270.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265.19999980926514,
            "unit": "median ms",
            "range": "±55.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.20/301.50/320.80/320.80 ms avg=351.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.10/5.40/8.50/9.80 ms avg=5.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25.800000190734863,
            "unit": "median ms",
            "range": "±16.8%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.80/26.70/29.30/42.60 ms avg=29.92 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 15.5,
            "unit": "median ms",
            "range": "±9.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=15.50/16.90/17.80/24.50 ms avg=17.54 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 17.799999713897705,
            "unit": "median ms",
            "range": "±29.1%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=17.80/20.10/23.10/46.90 ms avg=22.04 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 89.30000019073486,
            "unit": "median ms",
            "range": "±138.0%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=89.30/155.70/227.30/227.30 ms avg=129.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 346.40000009536743,
            "unit": "median ms",
            "range": "±198.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=346.40/399.00/544.60/544.60 ms avg=472.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.400000095367432,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/4.60/6.20/9.90 ms avg=5.29 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.299999713897705,
            "unit": "median ms",
            "range": "±5.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.30/14.90/15.90/20.10 ms avg=15.44 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 11.700000286102295,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=11.70/14.20/17.00/17.00 ms avg=15.73 ms (7 runs sampled)"
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
          "id": "3c7164cb71593e341274623f981b699a9755be15",
          "message": "refactor: Use less allocations in B+Tree mutations (#658)",
          "timestamp": "2021-11-03T14:42:49-07:00",
          "tree_id": "f59eebe0c9dd45fe139812ef00a489560ec53bea",
          "url": "https://github.com/rocicorp/replicache/commit/3c7164cb71593e341274623f981b699a9755be15"
        },
        "date": 1635976399856,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 187.80000019073486,
            "unit": "median ms",
            "range": "±39.4%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=187.80/193.60/227.20/227.20 ms avg=241.64 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 277,
            "unit": "median ms",
            "range": "±81.9%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=277.00/306.50/358.90/358.90 ms avg=360.61 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 317,
            "unit": "median ms",
            "range": "±55.5%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=317.00/354.20/372.50/372.50 ms avg=420.39 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 423,
            "unit": "median ms",
            "range": "±851.2%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=423.00/478.90/1274.20/1274.20 ms avg=662.54 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 77.69999980926514,
            "unit": "median ms",
            "range": "±10.3%",
            "extra": "read tx 1024x1000 50/75/90/95%=77.70/80.40/88.00/88.00 ms avg=101.37 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 373.5,
            "unit": "median ms",
            "range": "±779.4%",
            "extra": "read tx 1024x5000 50/75/90/95%=373.50/1094.70/1152.90/1152.90 ms avg=685.79 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 78.09999990463257,
            "unit": "median ms",
            "range": "±4.9%",
            "extra": "scan 1024x1000 50/75/90/95%=78.10/82.50/83.00/83.00 ms avg=99.49 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 356,
            "unit": "median ms",
            "range": "±787.7%",
            "extra": "scan 1024x5000 50/75/90/95%=356.00/1086.90/1143.70/1143.70 ms avg=673.04 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 228.40000009536743,
            "unit": "median ms",
            "range": "±32.2%",
            "extra": "create index 1024x1000 50/75/90/95%=228.40/253.50/260.60/260.60 ms avg=294.17 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1126.4000000953674,
            "unit": "median ms",
            "range": "±961.2%",
            "extra": "create index 1024x5000 50/75/90/95%=1126.40/2018.10/2087.60/2087.60 ms avg=1703.93 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 70.7999997138977,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=70.80/73.50/76.30/76.30 ms avg=88.49 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 226.30000019073486,
            "unit": "median ms",
            "range": "±720.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=226.30/233.50/946.70/946.70 ms avg=386.34 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 261,
            "unit": "median ms",
            "range": "±88.6%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=261.00/268.60/349.60/349.60 ms avg=345.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.80000019073486,
            "unit": "median ms",
            "range": "±25.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.80/119.80/136.40/136.40 ms avg=142.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 103.2999997138977,
            "unit": "median ms",
            "range": "±21.9%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=103.30/109.00/125.20/125.20 ms avg=136.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 196.90000009536743,
            "unit": "median ms",
            "range": "±42.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.90/223.30/239.50/239.50 ms avg=264.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 262.40000009536743,
            "unit": "median ms",
            "range": "±57.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.40/284.50/319.40/319.40 ms avg=346.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.5,
            "unit": "median ms",
            "range": "±6.3%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.50/5.60/8.00/10.80 ms avg=5.63 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25,
            "unit": "median ms",
            "range": "±19.1%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.00/25.40/30.20/44.10 ms avg=28.91 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±5.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.30/6.10/7.90/9.30 ms avg=5.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 16,
            "unit": "median ms",
            "range": "±19.0%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=16.00/17.50/23.90/35.00 ms avg=19.64 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 70,
            "unit": "median ms",
            "range": "±24.5%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=70.00/81.70/94.50/94.50 ms avg=89.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 330.09999990463257,
            "unit": "median ms",
            "range": "±227.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=330.10/402.20/557.30/557.30 ms avg=467.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.599999904632568,
            "unit": "median ms",
            "range": "±5.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/4.70/6.90/9.70 ms avg=5.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.400000095367432,
            "unit": "median ms",
            "range": "±7.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.40/15.10/16.30/22.00 ms avg=15.90 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.199999809265137,
            "unit": "median ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.20/13.40/14.00/14.00 ms avg=15.40 ms (7 runs sampled)"
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
          "id": "452b046673d38e12b8141aa16cf3f191f5359561",
          "message": "refactor: Make scan lazy (#659)\n\nWe had async iterators all the way up to ScanIterator which accumulated\r\nall the items in memory.\r\n\r\nNow we have the async iterator all the way...",
          "timestamp": "2021-11-03T22:27:23Z",
          "tree_id": "82326f3fca89663ae886583e1b3841fa84b71e01",
          "url": "https://github.com/rocicorp/replicache/commit/452b046673d38e12b8141aa16cf3f191f5359561"
        },
        "date": 1635979083854,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 188,
            "unit": "median ms",
            "range": "±49.9%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=188.00/196.60/237.90/237.90 ms avg=244.66 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 273.90000009536743,
            "unit": "median ms",
            "range": "±71.8%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=273.90/299.80/345.70/345.70 ms avg=359.47 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 317,
            "unit": "median ms",
            "range": "±44.2%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=317.00/360.00/361.20/361.20 ms avg=417.34 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 417.80000019073486,
            "unit": "median ms",
            "range": "±47.5%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=417.80/442.30/465.30/465.30 ms avg=541.34 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 79,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "read tx 1024x1000 50/75/90/95%=79.00/83.30/85.10/85.10 ms avg=102.10 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 371.19999980926514,
            "unit": "median ms",
            "range": "±762.3%",
            "extra": "read tx 1024x5000 50/75/90/95%=371.20/1109.40/1133.50/1133.50 ms avg=685.99 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 77.5,
            "unit": "median ms",
            "range": "±10.7%",
            "extra": "scan 1024x1000 50/75/90/95%=77.50/85.90/88.20/88.20 ms avg=101.17 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 360.90000009536743,
            "unit": "median ms",
            "range": "±807.1%",
            "extra": "scan 1024x5000 50/75/90/95%=360.90/1117.20/1168.00/1168.00 ms avg=686.26 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 232,
            "unit": "median ms",
            "range": "±24.7%",
            "extra": "create index 1024x1000 50/75/90/95%=232.00/254.50/256.70/256.70 ms avg=299.63 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1160.5,
            "unit": "median ms",
            "range": "±2629.2%",
            "extra": "create index 1024x5000 50/75/90/95%=1160.50/2021.50/3789.70/3789.70 ms avg=1976.57 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 69,
            "unit": "median ms",
            "range": "±13.6%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=69.00/72.50/82.60/82.60 ms avg=90.03 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 224,
            "unit": "median ms",
            "range": "±699.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=224.00/240.70/923.40/923.40 ms avg=385.03 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 281.40000009536743,
            "unit": "median ms",
            "range": "±83.2%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=281.40/289.80/364.60/364.60 ms avg=356.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.89999961853027,
            "unit": "median ms",
            "range": "±33.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/119.10/146.10/146.10 ms avg=144.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 103.5,
            "unit": "median ms",
            "range": "±23.2%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=103.50/108.30/126.70/126.70 ms avg=136.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 203.59999990463257,
            "unit": "median ms",
            "range": "±37.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.60/224.90/240.70/240.70 ms avg=269.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 284,
            "unit": "median ms",
            "range": "±262.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=284.00/325.00/546.20/546.20 ms avg=396.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 5.099999904632568,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=5.10/5.90/7.70/11.20 ms avg=5.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25.40000009536743,
            "unit": "median ms",
            "range": "±20.8%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.40/25.90/28.60/46.20 ms avg=29.86 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 17.300000190734863,
            "unit": "median ms",
            "range": "±6.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=17.30/19.00/22.30/23.80 ms avg=19.62 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 20.199999809265137,
            "unit": "median ms",
            "range": "±15.8%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=20.20/21.20/29.70/36.00 ms avg=23.03 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 68.09999990463257,
            "unit": "median ms",
            "range": "±147.0%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=68.10/187.40/215.10/215.10 ms avg=123.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 331.69999980926514,
            "unit": "median ms",
            "range": "±250.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=331.70/413.00/582.40/582.40 ms avg=472.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.700000286102295,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/4.90/7.10/9.50 ms avg=5.63 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.900000095367432,
            "unit": "median ms",
            "range": "±7.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.90/15.70/16.90/22.60 ms avg=16.31 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.700000286102295,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.70/13.30/17.90/17.90 ms avg=16.30 ms (7 runs sampled)"
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
          "id": "c8bb1ce087bce66ad714ec3d61c04c2dbad3229f",
          "message": "Update HACKING.md",
          "timestamp": "2021-11-03T15:33:13-07:00",
          "tree_id": "1faf3983dd555b280d20743d03076a73bd26d19a",
          "url": "https://github.com/rocicorp/replicache/commit/c8bb1ce087bce66ad714ec3d61c04c2dbad3229f"
        },
        "date": 1635979403525,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 184.40000009536743,
            "unit": "median ms",
            "range": "±51.3%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=184.40/197.00/235.70/235.70 ms avg=243.57 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 269.59999990463257,
            "unit": "median ms",
            "range": "±50.0%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=269.60/295.20/319.60/319.60 ms avg=352.76 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 322.90000009536743,
            "unit": "median ms",
            "range": "±36.2%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=322.90/352.80/359.10/359.10 ms avg=418.63 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 409.5,
            "unit": "median ms",
            "range": "±56.2%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=409.50/442.20/465.70/465.70 ms avg=534.80 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 76.5,
            "unit": "median ms",
            "range": "±4.3%",
            "extra": "read tx 1024x1000 50/75/90/95%=76.50/79.40/80.80/80.80 ms avg=98.84 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 361.80000019073486,
            "unit": "median ms",
            "range": "±781.2%",
            "extra": "read tx 1024x5000 50/75/90/95%=361.80/1103.70/1143.00/1143.00 ms avg=679.40 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 77.2000002861023,
            "unit": "median ms",
            "range": "±11.4%",
            "extra": "scan 1024x1000 50/75/90/95%=77.20/87.90/88.60/88.60 ms avg=100.91 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 360,
            "unit": "median ms",
            "range": "±784.3%",
            "extra": "scan 1024x5000 50/75/90/95%=360.00/1095.70/1144.30/1144.30 ms avg=678.00 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 224.7999997138977,
            "unit": "median ms",
            "range": "±38.4%",
            "extra": "create index 1024x1000 50/75/90/95%=224.80/259.40/263.20/263.20 ms avg=294.71 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1150,
            "unit": "median ms",
            "range": "±3081.3%",
            "extra": "create index 1024x5000 50/75/90/95%=1150.00/2017.30/4231.30/4231.30 ms avg=2030.07 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 69.90000009536743,
            "unit": "median ms",
            "range": "±9.8%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=69.90/78.30/79.70/79.70 ms avg=90.59 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 222.19999980926514,
            "unit": "median ms",
            "range": "±708.8%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=222.20/239.40/931.00/931.00 ms avg=384.06 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 255.10000038146973,
            "unit": "median ms",
            "range": "±87.4%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=255.10/257.90/342.50/342.50 ms avg=325.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109.90000009536743,
            "unit": "median ms",
            "range": "±41.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.90/117.50/151.70/151.70 ms avg=145.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 105.39999961853027,
            "unit": "median ms",
            "range": "±18.4%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=105.40/108.40/123.80/123.80 ms avg=137.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 200.2999997138977,
            "unit": "median ms",
            "range": "±40.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.30/226.70/240.50/240.50 ms avg=263.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 268.2000002861023,
            "unit": "median ms",
            "range": "±50.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.20/282.70/318.40/318.40 ms avg=348.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.5,
            "unit": "median ms",
            "range": "±7.0%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.50/5.60/7.60/11.50 ms avg=5.62 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 26,
            "unit": "median ms",
            "range": "±17.6%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=26.00/27.10/30.80/43.60 ms avg=30.55 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.9000000953674316,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.60/7.60/10.00 ms avg=5.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 18.799999713897705,
            "unit": "median ms",
            "range": "±16.4%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=18.80/19.50/27.50/35.20 ms avg=21.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 70.30000019073486,
            "unit": "median ms",
            "range": "±26.1%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=70.30/83.20/96.40/96.40 ms avg=91.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 329.1000003814697,
            "unit": "median ms",
            "range": "±524.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=329.10/352.00/853.20/853.20 ms avg=500.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.50/6.90/9.50 ms avg=5.74 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 15,
            "unit": "median ms",
            "range": "±7.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=15.00/15.60/16.50/22.30 ms avg=16.27 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.300000190734863,
            "unit": "median ms",
            "range": "±6.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.30/13.30/18.90/18.90 ms avg=16.29 ms (7 runs sampled)"
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
          "id": "00cb79df15ff51dddaa870756e3beff91c478944",
          "message": "refactor: Only convert scan item once (at most) (#660)\n\nWe used to generate a ScanItem from an Entry and then extract the info\r\nwe needed from the ScanItem. Now we just extract the info we need from\r\nthe Entry, which in non index scans requires no work.",
          "timestamp": "2021-11-03T22:38:09Z",
          "tree_id": "b201400029010d44ffc37f5062907300c4416617",
          "url": "https://github.com/rocicorp/replicache/commit/00cb79df15ff51dddaa870756e3beff91c478944"
        },
        "date": 1635980355723,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 190.60000038146973,
            "unit": "median ms",
            "range": "±39.3%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=190.60/195.30/229.90/229.90 ms avg=243.07 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 266,
            "unit": "median ms",
            "range": "±32.9%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=266.00/279.40/298.90/298.90 ms avg=344.61 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 329.69999980926514,
            "unit": "median ms",
            "range": "±30.5%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=329.70/355.00/360.20/360.20 ms avg=420.21 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 423.5,
            "unit": "median ms",
            "range": "±42.7%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=423.50/448.90/466.20/466.20 ms avg=543.34 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 77.7999997138977,
            "unit": "median ms",
            "range": "±7.4%",
            "extra": "read tx 1024x1000 50/75/90/95%=77.80/79.60/85.20/85.20 ms avg=100.27 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 370.69999980926514,
            "unit": "median ms",
            "range": "±747.0%",
            "extra": "read tx 1024x5000 50/75/90/95%=370.70/1109.60/1117.70/1117.70 ms avg=685.26 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 76.2999997138977,
            "unit": "median ms",
            "range": "±15.3%",
            "extra": "scan 1024x1000 50/75/90/95%=76.30/87.80/91.60/91.60 ms avg=101.61 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 364.30000019073486,
            "unit": "median ms",
            "range": "±766.5%",
            "extra": "scan 1024x5000 50/75/90/95%=364.30/1124.60/1130.80/1130.80 ms avg=681.91 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 228.40000009536743,
            "unit": "median ms",
            "range": "±54.0%",
            "extra": "create index 1024x1000 50/75/90/95%=228.40/267.50/282.40/282.40 ms avg=304.19 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1152.6999998092651,
            "unit": "median ms",
            "range": "±1744.8%",
            "extra": "create index 1024x5000 50/75/90/95%=1152.70/1993.30/2897.50/2897.50 ms avg=1835.47 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 71.90000009536743,
            "unit": "median ms",
            "range": "±7.1%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=71.90/73.20/79.00/79.00 ms avg=90.96 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 230.59999990463257,
            "unit": "median ms",
            "range": "±765.8%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=230.60/240.50/996.40/996.40 ms avg=399.33 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 262.69999980926514,
            "unit": "median ms",
            "range": "±61.6%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=262.70/282.60/324.30/324.30 ms avg=345.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.7999997138977,
            "unit": "median ms",
            "range": "±34.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.80/118.80/148.40/148.40 ms avg=146.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 106.09999990463257,
            "unit": "median ms",
            "range": "±21.0%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=106.10/108.20/127.10/127.10 ms avg=139.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 203.19999980926514,
            "unit": "median ms",
            "range": "±37.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.20/223.00/240.70/240.70 ms avg=267.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 261.19999980926514,
            "unit": "median ms",
            "range": "±54.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.20/285.40/315.50/315.50 ms avg=344.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.699999809265137,
            "unit": "median ms",
            "range": "±6.5%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.70/5.60/8.50/11.20 ms avg=5.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 24.699999809265137,
            "unit": "median ms",
            "range": "±18.9%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=24.70/25.90/30.90/43.60 ms avg=28.96 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.9000000953674316,
            "unit": "median ms",
            "range": "±7.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.50/7.50/11.00 ms avg=5.00 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 18.59999990463257,
            "unit": "median ms",
            "range": "±16.1%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=18.60/19.30/27.90/34.70 ms avg=21.48 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 68.2999997138977,
            "unit": "median ms",
            "range": "±27.2%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=68.30/80.70/95.50/95.50 ms avg=89.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 344.19999980926514,
            "unit": "median ms",
            "range": "±233.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=344.20/421.20/577.70/577.70 ms avg=483.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.799999713897705,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.30/6.40/9.30 ms avg=5.67 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.5,
            "unit": "median ms",
            "range": "±6.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.50/15.10/15.80/21.20 ms avg=15.96 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.099999904632568,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.10/13.60/15.60/15.60 ms avg=15.80 ms (7 runs sampled)"
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
          "id": "2a0c7cc7cf8d5d835fb34b87715ec1368e5360b2",
          "message": "Stop alerting when old perf dashboard regresses.\n\nIt's pretty flakey and not useful info anymore.",
          "timestamp": "2021-11-03T14:07:14-10:00",
          "tree_id": "165480bf96e7a45ec10f303a1cee339fa4924e9e",
          "url": "https://github.com/rocicorp/replicache/commit/2a0c7cc7cf8d5d835fb34b87715ec1368e5360b2"
        },
        "date": 1635985073385,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 183.40000009536743,
            "unit": "median ms",
            "range": "±48.1%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=183.40/200.00/231.50/231.50 ms avg=241.66 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (dirty, indexes: 0)",
            "value": 263.09999990463257,
            "unit": "median ms",
            "range": "±34.8%",
            "extra": "populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=263.10/285.70/297.90/297.90 ms avg=344.11 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 315.2999997138977,
            "unit": "median ms",
            "range": "±45.4%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=315.30/360.30/360.70/360.70 ms avg=414.77 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 409.7999997138977,
            "unit": "median ms",
            "range": "±45.4%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=409.80/443.30/455.20/455.20 ms avg=529.86 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x1000",
            "value": 74.7000002861023,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "read tx 1024x1000 50/75/90/95%=74.70/75.80/80.00/80.00 ms avg=96.86 ms (7 runs sampled)"
          },
          {
            "name": "read tx 1024x5000",
            "value": 362.19999980926514,
            "unit": "median ms",
            "range": "±753.8%",
            "extra": "read tx 1024x5000 50/75/90/95%=362.20/1114.10/1116.00/1116.00 ms avg=678.97 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 76.5,
            "unit": "median ms",
            "range": "±15.0%",
            "extra": "scan 1024x1000 50/75/90/95%=76.50/83.00/91.50/91.50 ms avg=99.93 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x5000",
            "value": 354.69999980926514,
            "unit": "median ms",
            "range": "±776.0%",
            "extra": "scan 1024x5000 50/75/90/95%=354.70/1087.20/1130.70/1130.70 ms avg=669.34 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x1000",
            "value": 223.7000002861023,
            "unit": "median ms",
            "range": "±37.6%",
            "extra": "create index 1024x1000 50/75/90/95%=223.70/247.00/261.30/261.30 ms avg=294.24 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 1132,
            "unit": "median ms",
            "range": "±923.2%",
            "extra": "create index 1024x5000 50/75/90/95%=1132.00/1926.90/2055.20/2055.20 ms avg=1690.93 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 71.69999980926514,
            "unit": "median ms",
            "range": "±8.4%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=71.70/74.10/80.10/80.10 ms avg=90.64 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 219.7000002861023,
            "unit": "median ms",
            "range": "±697.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=219.70/229.10/917.10/917.10 ms avg=378.63 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 267.2999997138977,
            "unit": "median ms",
            "range": "±110.5%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=267.30/280.80/377.80/377.80 ms avg=354.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.69999980926514,
            "unit": "median ms",
            "range": "±35.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.70/119.00/147.40/147.40 ms avg=145.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (dirty, indexes: 0)",
            "value": 105.2999997138977,
            "unit": "median ms",
            "range": "±20.0%",
            "extra": "[MemStore] populate 1024x1000 (dirty, indexes: 0) 50/75/90/95%=105.30/109.10/125.30/125.30 ms avg=138.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 205.80000019073486,
            "unit": "median ms",
            "range": "±40.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=205.80/229.50/246.00/246.00 ms avg=271.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 263.30000019073486,
            "unit": "median ms",
            "range": "±56.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.30/287.80/320.10/320.10 ms avg=349.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x1000",
            "value": 4.599999904632568,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] read tx 1024x1000 50/75/90/95%=4.60/5.50/8.10/10.30 ms avg=5.53 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] read tx 1024x5000",
            "value": 25.5,
            "unit": "median ms",
            "range": "±19.1%",
            "extra": "[MemStore] read tx 1024x5000 50/75/90/95%=25.50/26.10/30.80/44.60 ms avg=29.86 ms (17 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.9000000953674316,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.40/6.80/9.60 ms avg=4.83 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x5000",
            "value": 19.40000009536743,
            "unit": "median ms",
            "range": "±15.7%",
            "extra": "[MemStore] scan 1024x5000 50/75/90/95%=19.40/19.70/28.30/35.10 ms avg=22.04 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x1000",
            "value": 66.40000009536743,
            "unit": "median ms",
            "range": "±30.3%",
            "extra": "[MemStore] create index 1024x1000 50/75/90/95%=66.40/84.60/96.70/96.70 ms avg=91.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 352.30000019073486,
            "unit": "median ms",
            "range": "±521.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=352.30/639.20/873.30/873.30 ms avg=572.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/6.20/8.00/10.70 ms avg=6.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.599999904632568,
            "unit": "median ms",
            "range": "±7.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.60/15.30/16.00/21.90 ms avg=16.12 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.099999904632568,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.10/13.40/15.30/15.30 ms avg=15.70 ms (7 runs sampled)"
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
          "id": "f6d029c9306ac37511ae29c2ae9e6c9dead35628",
          "message": "Spruce up the benchmarks we run by default.\n\nThis trims it down to just the MemStore versions of:\n- the write/sub/read family\n- the populate family\n- scan\n- createIndex\n\nWe remove all the IDB tests (this is not how we plan to use IDB,\nso it's irrelevant and confusing), and the read tests (does not represent\nreal-world usage).",
          "timestamp": "2021-11-03T16:56:18-10:00",
          "tree_id": "d1d7a0a3f84a31f143d484f8a0889bf15972af0f",
          "url": "https://github.com/rocicorp/replicache/commit/f6d029c9306ac37511ae29c2ae9e6c9dead35628"
        },
        "date": 1635994675814,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.799999713897705,
            "unit": "median ms",
            "range": "±5.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.80/7.30/10.60 ms avg=5.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 14.099999904632568,
            "unit": "median ms",
            "range": "±6.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=14.10/14.90/15.60/20.60 ms avg=15.94 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.5,
            "unit": "median ms",
            "range": "±4.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.50/13.90/17.10/17.10 ms avg=16.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.5,
            "unit": "median ms",
            "range": "±44.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/112.60/154.50/154.50 ms avg=144.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 199.40000009536743,
            "unit": "median ms",
            "range": "±38.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.40/220.80/237.50/237.50 ms avg=257.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 256.7000002861023,
            "unit": "median ms",
            "range": "±57.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=256.70/280.70/314.50/314.50 ms avg=340.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.799999713897705,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/5.30/7.50/9.20 ms avg=4.85 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 324.69999980926514,
            "unit": "median ms",
            "range": "±82.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=324.70/335.00/407.60/407.60 ms avg=428.16 ms (7 runs sampled)"
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
          "id": "e7e998da4ad9de6ab442d36476079ae429ec7a94",
          "message": "Update HACKING.md",
          "timestamp": "2021-11-03T16:59:07-10:00",
          "tree_id": "b043e32e4743b6aef564334343a9c822cb75c5cf",
          "url": "https://github.com/rocicorp/replicache/commit/e7e998da4ad9de6ab442d36476079ae429ec7a94"
        },
        "date": 1635994855739,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.900000095367432,
            "unit": "median ms",
            "range": "±5.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.70/7.70/10.70 ms avg=5.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 13.900000095367432,
            "unit": "median ms",
            "range": "±6.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=13.90/14.40/15.00/20.70 ms avg=15.59 ms (18 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 12.200000286102295,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=12.20/13.20/15.30/15.30 ms avg=15.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.89999961853027,
            "unit": "median ms",
            "range": "±464.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/125.90/577.30/577.30 ms avg=209.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 201.2999997138977,
            "unit": "median ms",
            "range": "±41.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.30/222.40/242.90/242.90 ms avg=260.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 258,
            "unit": "median ms",
            "range": "±57.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.00/287.80/315.60/315.60 ms avg=344.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.8000001907348633,
            "unit": "median ms",
            "range": "±5.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/5.10/7.40/8.90 ms avg=4.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 338.90000009536743,
            "unit": "median ms",
            "range": "±79.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=338.90/344.10/418.00/418.00 ms avg=444.14 ms (7 runs sampled)"
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
          "id": "2d2340227184c058bcb49ed1070bf129eb7a0385",
          "message": "fix: Correct how benchmarkWriteSubRead sets up its subscriptions and picks keys to invalidate (#657)\n\nbenchmarkWriteSubRead uses keys like:\r\nkey0, key1, key2, key3, key4, key5, key6, key7, key8, key9, key10, key11, key12, etc\r\n\r\nthe logic it uses for setting up its subscription ranges assumed the keys were sorted as above, but they are actually sorted lexicographically like:\r\nkey0, key1, key10, key11, key12, key2, key3, key4, key5, key6, key7, key8, key9, \r\n\r\n**Existing**\r\nBased on the above assumption about key ordering it used the following logic for subscriptions and invalidations\r\n\r\n_Subscriptions_\r\nscan start `k${i * keysPerSub }` limit keysWatchedPerSub, for 0 <= i < numSubsTotal \r\n\r\n_Invalidations_\r\n`k${i * keysPerSub}` for 0 <= i < numDirtySubs\r\n\r\n**New**\r\nThis change updates the logic for setting up subscriptions and picking keys to invalidate to use a sorted array of keys.\r\n\r\nThe new logic is:\r\n\r\n_Subscriptions_\r\nscan start sortedKeys[i * keysPerSub ] limit keysWatchedPerSub, for 0 <= i < numSubsTotal \r\n\r\n_Invalidations_\r\nsortedKeys[i * keysPerSub] for 0 <= i < numDirtySubs\r\n\r\n\r\nThese changes make the test performance more consistent as the data size increase.  In debugging i discovered the tests runtime mainly varies based on the sort of the keys invalidated.  The higher the invalidated keys sort order, the higher the latency.   With the old logic, the invalidated keys sort order varied a good deal based on the size of the test.   With the new code they are consistently low in the sort order (though they do increase some as numKeysPerSub increases).  \r\n\r\nWe should update these tests to invalidate a random numDirtySubs subs (rather than the first numDirtySubs in sort order) and fix scans performance.  \r\n\r\n### Perf On my M1 Max\r\n\r\n**Existing**\r\n[MemStore] writeSubRead 2MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.80/6.00/6.00 ms avg=6.34 ms (7 runs sampled)\r\n[MemStore] writeSubRead 3MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.20/6.40/7.70/7.70 ms avg=7.94 ms (7 runs sampled)\r\n[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.20/6.30/8.00/8.00 ms avg=8.13 ms (7 runs sampled)\r\n[MemStore] writeSubRead 5MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.90/6.60/8.10/8.10 ms avg=7.90 ms (7 runs sampled)\r\n[MemStore] writeSubRead 6MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.50/6.60/9.10/9.10 ms avg=8.56 ms (7 runs sampled)\r\n[MemStore] writeSubRead 7MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/5.60/7.20/7.20 ms avg=6.94 ms (7 runs sampled)\r\n[MemStore] writeSubRead 8MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/5.70/7.20/7.20 ms avg=7.04 ms (7 runs sampled)\r\n[MemStore] writeSubRead 9MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.50/7.20/7.20 ms avg=6.77 ms (7 runs sampled)\r\n[MemStore] writeSubRead 10MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/5.80/7.10/7.10 ms avg=7.19 ms (7 runs sampled)\r\n[MemStore] writeSubRead 11MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.30/6.70/8.70/8.70 ms avg=8.29 ms (7 runs sampled)\r\n[MemStore] writeSubRead 12MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=7.10/7.40/9.50/9.50 ms avg=9.23 ms (7 runs sampled)\r\n[MemStore] writeSubRead 13MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/4.70/5.50/5.50 ms avg=5.49 ms (7 runs sampled)\r\n[MemStore] writeSubRead 14MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.50/6.50/6.50 ms avg=6.47 ms (7 runs sampled)\r\n[MemStore] writeSubRead 15MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.80/6.40/6.40 ms avg=6.54 ms (7 runs sampled)\r\n[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.90/6.50/6.50 ms avg=6.61 ms (7 runs sampled)\r\n[MemStore] writeSubRead 17MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.90/6.30/7.80/7.80 ms avg=7.50 ms (7 runs sampled)\r\n[MemStore] writeSubRead 18MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.90/6.40/7.20/7.20 ms avg=7.33 ms (7 runs sampled)\r\n[MemStore] writeSubRead 19MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.00/6.80/8.00/8.00 ms avg=7.97 ms (7 runs sampled)\r\n[MemStore] writeSubRead 20MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.10/8.40/8.40/8.40 ms avg=8.13 ms (7 runs sampled)\r\n\r\n\r\n**New**\r\n[MemStore] writeSubRead 2MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.80/2.10/2.10 ms avg=1.97 ms (7 runs sampled)\r\n[MemStore] writeSubRead 3MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.80/2.10/2.10 ms avg=1.89 ms (7 runs sampled)\r\n[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/1.50/2.10/2.10 ms avg=1.76 ms (7 runs sampled)\r\n[MemStore] writeSubRead 5MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.70/2.00/2.00 ms avg=1.90 ms (7 runs sampled)\r\n[MemStore] writeSubRead 6MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.60/3.70/3.70 ms avg=2.14 ms (7 runs sampled)\r\n[MemStore] writeSubRead 7MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.50/2.10/2.10 ms avg=1.81 ms (7 runs sampled)\r\n[MemStore] writeSubRead 8MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.60/2.10/2.10 ms avg=1.86 ms (7 runs sampled)\r\n[MemStore] writeSubRead 9MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.50/2.00/2.00 ms avg=1.87 ms (7 runs sampled)\r\n[MemStore] writeSubRead 10MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.70/1.80/2.00/2.00 ms avg=1.96 ms (7 runs sampled)\r\n[MemStore] writeSubRead 11MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.50/2.20/2.20 ms avg=1.90 ms (7 runs sampled)\r\n[MemStore] writeSubRead 12MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.50/2.10/2.10 ms avg=1.81 ms (7 runs sampled)\r\n[MemStore] writeSubRead 13MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.70/2.20/2.20 ms avg=1.94 ms (7 runs sampled)\r\n[MemStore] writeSubRead 14MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.60/2.00/2.00 ms avg=1.86 ms (7 runs sampled)\r\n[MemStore] writeSubRead 15MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.70/2.10/2.10 ms avg=1.86 ms (7 runs sampled)\r\n[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.60/2.00/2.00 ms avg=1.86 ms (7 runs sampled)\r\n[MemStore] writeSubRead 17MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.50/2.20/2.20 ms avg=1.90 ms (7 runs sampled)\r\n[MemStore] writeSubRead 18MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.70/2.20/2.20 ms avg=1.96 ms (7 runs sampled)\r\n[MemStore] writeSubRead 19MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.80/2.10/2.10 ms avg=2.04 ms (7 runs sampled)\r\n[MemStore] writeSubRead 20MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/2.70/4.00/4.00 ms avg=2.39 ms (7 runs sampled)",
          "timestamp": "2021-11-04T10:39:51-07:00",
          "tree_id": "ffd273b1442335eb75a7c4575a5864fa5e80b57a",
          "url": "https://github.com/rocicorp/replicache/commit/2d2340227184c058bcb49ed1070bf129eb7a0385"
        },
        "date": 1636047693336,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8000001907348633,
            "unit": "median ms",
            "range": "±4.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.20/4.30/7.70 ms avg=3.47 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/4.20/6.10/6.10 ms avg=4.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5999999046325684,
            "unit": "median ms",
            "range": "±5.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/5.30/9.20/9.20 ms avg=5.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 121.59999990463257,
            "unit": "median ms",
            "range": "±41.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=121.60/133.30/163.00/163.00 ms avg=157.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 213.59999990463257,
            "unit": "median ms",
            "range": "±44.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=213.60/242.10/257.70/257.70 ms avg=274.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 275.40000009536743,
            "unit": "median ms",
            "range": "±88.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=275.40/285.90/364.10/364.10 ms avg=360.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.200000286102295,
            "unit": "median ms",
            "range": "±5.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.30/9.20/9.30 ms avg=5.08 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 323.19999980926514,
            "unit": "median ms",
            "range": "±91.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=323.20/336.50/415.10/415.10 ms avg=428.66 ms (7 runs sampled)"
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
          "id": "883c864e984e81e2e4996a9c9aca335867f6e562",
          "message": "fix!: Remove CreateIndexDefinition.keyPrefix (#667)\n\nIt was deprecated 4 months ago\r\n\r\nBREAKING CHANGE",
          "timestamp": "2021-11-04T14:54:04-07:00",
          "tree_id": "217b0ef216ffd9c32c745a48a4d34d98eb833163",
          "url": "https://github.com/rocicorp/replicache/commit/883c864e984e81e2e4996a9c9aca335867f6e562"
        },
        "date": 1636062938337,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.20/6.70 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/3.90/6.20/6.20 ms avg=4.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/4.10/5.90/5.90 ms avg=4.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 114.80000019073486,
            "unit": "median ms",
            "range": "±42.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.80/124.90/157.20/157.20 ms avg=151.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204.69999980926514,
            "unit": "median ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.70/230.50/248.40/248.40 ms avg=264.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 269.19999980926514,
            "unit": "median ms",
            "range": "±63.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=269.20/274.80/332.90/332.90 ms avg=346.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±6.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.40/8.20/10.00 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 325.7000002861023,
            "unit": "median ms",
            "range": "±72.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=325.70/342.30/398.20/398.20 ms avg=422.54 ms (7 runs sampled)"
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
          "id": "bb53e8fe2ff858a9bd1a12361608c85d0d7715c5",
          "message": "feat: add p95 graphs to perf-v2 benchmarks (#665)\n\nWe want to track median and p95",
          "timestamp": "2021-11-04T15:54:35-07:00",
          "tree_id": "1044b131ebe32f944b9f86352c4b19afefa43101",
          "url": "https://github.com/rocicorp/replicache/commit/bb53e8fe2ff858a9bd1a12361608c85d0d7715c5"
        },
        "date": 1636066651049,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.80/6.60 ms avg=3.16 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.599999904632568,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.80/6.60 ms avg=3.16 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5,
            "unit": "median ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/6.00/11.60/11.60 ms avg=5.73 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 11.599999904632568,
            "unit": "p95 ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/6.00/11.60/11.60 ms avg=5.73 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.200000286102295,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.20/3.80/6.40/6.40 ms avg=4.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.400000095367432,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.20/3.80/6.40/6.40 ms avg=4.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 116.7000002861023,
            "unit": "median ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=116.70/128.40/172.10/172.10 ms avg=153.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 172.09999990463257,
            "unit": "p95 ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=116.70/128.40/172.10/172.10 ms avg=153.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 206.59999990463257,
            "unit": "median ms",
            "range": "±40.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.60/209.60/247.30/247.30 ms avg=262.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 247.30000019073486,
            "unit": "p95 ms",
            "range": "±40.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.60/209.60/247.30/247.30 ms avg=262.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 260.90000009536743,
            "unit": "median ms",
            "range": "±63.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.90/296.70/324.10/324.10 ms avg=345.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 324.09999990463257,
            "unit": "p95 ms",
            "range": "±63.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.90/296.70/324.10/324.10 ms avg=345.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.9%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.40/7.00/9.90 ms avg=4.92 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.900000095367432,
            "unit": "p95 ms",
            "range": "±5.9%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.40/7.00/9.90 ms avg=4.92 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 312,
            "unit": "median ms",
            "range": "±86.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=312.00/322.20/398.90/398.90 ms avg=412.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 398.90000009536743,
            "unit": "p95 ms",
            "range": "±86.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=312.00/322.20/398.90/398.90 ms avg=412.61 ms (7 runs sampled)"
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
          "id": "742b085c980ced27e4085d18581f915079f9d915",
          "message": "Update CONTRIBUTING.md",
          "timestamp": "2021-11-08T06:48:07-10:00",
          "tree_id": "35a6e942315fd093b8f741085a68e320de3a579f",
          "url": "https://github.com/rocicorp/replicache/commit/742b085c980ced27e4085d18581f915079f9d915"
        },
        "date": 1636390276395,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.10/6.60 ms avg=3.33 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.599999904632568,
            "unit": "p95 ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.10/6.60 ms avg=3.33 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.700000286102295,
            "unit": "median ms",
            "range": "±7.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.70/6.50/11.60/11.60 ms avg=5.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 11.599999904632568,
            "unit": "p95 ms",
            "range": "±7.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.70/6.50/11.60/11.60 ms avg=5.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/3.80/6.40/6.40 ms avg=4.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.400000095367432,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/3.80/6.40/6.40 ms avg=4.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 119.5,
            "unit": "median ms",
            "range": "±54.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=119.50/122.30/174.10/174.10 ms avg=152.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 174.09999990463257,
            "unit": "p95 ms",
            "range": "±54.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=119.50/122.30/174.10/174.10 ms avg=152.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204,
            "unit": "median ms",
            "range": "±45.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.00/236.00/249.10/249.10 ms avg=268.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 249.09999990463257,
            "unit": "p95 ms",
            "range": "±45.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.00/236.00/249.10/249.10 ms avg=268.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 277.7000002861023,
            "unit": "median ms",
            "range": "±59.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=277.70/278.30/336.80/336.80 ms avg=352.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 336.7999997138977,
            "unit": "p95 ms",
            "range": "±59.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=277.70/278.30/336.80/336.80 ms avg=352.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.8000001907348633,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/5.10/8.90/9.30 ms avg=4.85 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/5.10/8.90/9.30 ms avg=4.85 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 321.90000009536743,
            "unit": "median ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.90/338.10/403.20/403.20 ms avg=425.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 403.19999980926514,
            "unit": "p95 ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.90/338.10/403.20/403.20 ms avg=425.34 ms (7 runs sampled)"
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
          "id": "173ecfdf8889eb2906d9f7e87d4440a94539b97b",
          "message": "Remove style guidance around crashes\n\nI don't think it applies as readily in JS as in Rust.",
          "timestamp": "2021-11-08T06:49:20-10:00",
          "tree_id": "556e98e4dbc1377a38754bc7db152e21a935b87e",
          "url": "https://github.com/rocicorp/replicache/commit/173ecfdf8889eb2906d9f7e87d4440a94539b97b"
        },
        "date": 1636390363851,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.40/6.10 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.100000381469727,
            "unit": "p95 ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.40/6.10 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.4000000953674316,
            "unit": "median ms",
            "range": "±10.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.30/13.50/13.50 ms avg=5.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 13.5,
            "unit": "p95 ms",
            "range": "±10.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.30/13.50/13.50 ms avg=5.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.4000000953674316,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/3.50/6.40/6.40 ms avg=4.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.399999618530273,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/3.50/6.40/6.40 ms avg=4.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.90000009536743,
            "unit": "median ms",
            "range": "±86.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/147.80/199.70/199.70 ms avg=155.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 199.69999980926514,
            "unit": "p95 ms",
            "range": "±86.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/147.80/199.70/199.70 ms avg=155.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 208.40000009536743,
            "unit": "median ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.40/218.20/263.80/263.80 ms avg=268.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 263.80000019073486,
            "unit": "p95 ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.40/218.20/263.80/263.80 ms avg=268.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 276.69999980926514,
            "unit": "median ms",
            "range": "±59.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=276.70/292.20/336.50/336.50 ms avg=353.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 336.5,
            "unit": "p95 ms",
            "range": "±59.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=276.70/292.20/336.50/336.50 ms avg=353.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.20/8.50/9.30 ms avg=5.00 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.20/8.50/9.30 ms avg=5.00 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317.30000019073486,
            "unit": "median ms",
            "range": "±69.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.30/341.70/386.80/386.80 ms avg=419.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 386.80000019073486,
            "unit": "p95 ms",
            "range": "±69.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.30/341.70/386.80/386.80 ms avg=419.74 ms (7 runs sampled)"
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
            "email": "aaron@aaronboodman.com",
            "name": "Aaron Boodman",
            "username": "aboodman"
          },
          "distinct": true,
          "id": "9825000c007c048d6598e47cf504586e77210865",
          "message": "fix!: Remove register\n\nregister was deprecate 7 months ago.\n\nBREAKING CHANGE",
          "timestamp": "2021-11-08T08:31:00-10:00",
          "tree_id": "520c872bc520d007056ebe4f879979c7c6296e3a",
          "url": "https://github.com/rocicorp/replicache/commit/9825000c007c048d6598e47cf504586e77210865"
        },
        "date": 1636396441708,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.00/7.00 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.00/7.00 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.4000000953674316,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.80/6.20/6.20 ms avg=4.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.199999809265137,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.80/6.20/6.20 ms avg=4.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5,
            "unit": "median ms",
            "range": "±6.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/3.60/9.50/9.50 ms avg=4.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±6.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/3.60/9.50/9.50 ms avg=4.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 114.59999990463257,
            "unit": "median ms",
            "range": "±85.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.60/127.10/199.80/199.80 ms avg=157.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 199.7999997138977,
            "unit": "p95 ms",
            "range": "±85.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.60/127.10/199.80/199.80 ms avg=157.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 208.5,
            "unit": "median ms",
            "range": "±41.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.50/233.10/250.00/250.00 ms avg=266.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 250,
            "unit": "p95 ms",
            "range": "±41.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.50/233.10/250.00/250.00 ms avg=266.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265.69999980926514,
            "unit": "median ms",
            "range": "±60.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.70/295.50/326.40/326.40 ms avg=348.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 326.40000009536743,
            "unit": "p95 ms",
            "range": "±60.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.70/295.50/326.40/326.40 ms avg=348.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.20/8.00/9.30 ms avg=4.90 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.299999713897705,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.20/8.00/9.30 ms avg=4.90 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 318.5,
            "unit": "median ms",
            "range": "±84.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.50/332.80/403.40/403.40 ms avg=421.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 403.40000009536743,
            "unit": "p95 ms",
            "range": "±84.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.50/332.80/403.40/403.40 ms avg=421.63 ms (7 runs sampled)"
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
          "id": "e0ab261120a896d87ec26fce5a9fdfb80b9a814f",
          "message": "perf: Optimize subscriptions for scans with a limit (#669)\n\n### Problem \r\n\r\nRight now we do not use `limit` when determining if a `scan` is affected by a key.(https://github.com/rocicorp/replicache/blob/2d2340227184c058bcb49ed1070bf129eb7a0385/src/subscriptions.ts#L39). \r\n\r\nWe only use the `startKey` and `prefix`. This means that if we have something like:\r\n\r\n```js\r\nrep.subscripe(tx => {\r\n  for await (const entry of tx.scan({startKey: 'a', limit: 5}) {\r\n     console.log(e);\r\n  }\r\n}, {onData() {});\r\n```\r\n\r\nwe cannot tell whether a change to key `'x'` should affect the subscription function.\r\n\r\n### Solution\r\n\r\nInside `SubscriptionTransactionWrapper`'s `scan` method.\r\n- We currently only store a `ScanOptions` for each scan, update to store a `ScanSubrscriptionInfo`, consisting of `ScanOptions` and the new field `inclusiveLimitKey`. `inclusiveLimitKey` will be populated based on a callback driven by the scan implementation in `btree/node.ts` (this callback has to be threaded through a few layers)\r\n- Then in `scanOptionsMatchesKey` we know that a key does not match if there is a limit and the changed key is greater than the inclusiveLimitKey.  This works for both `prefix`, `startKey`, and a combination of `prefix` and `startKey`.  \r\n\r\nNote this optimization is only applied when a subscription reads its scan to its limit (it choses to stop early, or it runs out of entries).   We can optimize some cases where a subscription does not read its scan to its limit, however these optimization are only correct if the subscription body is a pure function on the replicache store state.  Subscription bodies should be pure in this way, but so far replicache behavior is correct even if they are not pure. We chose to not implement these further optimizations, erroring on the side of correctness over performance.  We can of course revisit this if it turns out not reading a scan to its limit is a common use case.  \r\n\r\n\r\n### Perf measurements\r\n\r\nThis greatly improves writeSubRead benchmark performance when random invalidates are used, **reducing the median time by ~70%**.  This benchmark uses 128 scans each using startKey and limit.   \r\n\r\nMade on my M1 Max w 64 GB of memory\r\n\r\nBefore this optimization:\r\n```\r\n[MemStore] writeSubRead randomInvalidates false 100MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/4.00/11.40/11.40 ms avg=4.56 ms (7 runs sampled)\r\n[MemStore] writeSubRead randomInvalidates true 100MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=9.50/12.70/19.70/19.70 ms avg=12.69 ms (7 runs sampled)\r\n```\r\n\r\nWith this optimization:\r\n```\r\nRunning 2 benchmarks on Chromium...\r\n[MemStore] writeSubRead randomInvalidates false 100MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/4.20/10.70/10.70 ms avg=4.49 ms (7 runs sampled)\r\n[MemStore] writeSubRead randomInvalidates true 100MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.00/4.40/11.10/11.10 ms avg=4.99 ms (7 runs sampled)\r\nDone!\r\n```\r\n\r\nCloses #666",
          "timestamp": "2021-11-08T13:32:45-08:00",
          "tree_id": "d354085224da09aa9122a8c26565dd21042cc839",
          "url": "https://github.com/rocicorp/replicache/commit/e0ab261120a896d87ec26fce5a9fdfb80b9a814f"
        },
        "date": 1636407263560,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.10/6.80 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.799999713897705,
            "unit": "p95 ms",
            "range": "±4.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.10/6.80 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.700000286102295,
            "unit": "median ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.70/5.90/6.20/6.20 ms avg=5.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.200000286102295,
            "unit": "p95 ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.70/5.90/6.20/6.20 ms avg=5.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/3.80/6.20/6.20 ms avg=4.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.199999809265137,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/3.80/6.20/6.20 ms avg=4.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 120.09999990463257,
            "unit": "median ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=120.10/123.50/175.50/175.50 ms avg=154.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 175.5,
            "unit": "p95 ms",
            "range": "±55.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=120.10/123.50/175.50/175.50 ms avg=154.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204.5,
            "unit": "median ms",
            "range": "±43.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/236.90/248.40/248.40 ms avg=268.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 248.40000009536743,
            "unit": "p95 ms",
            "range": "±43.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/236.90/248.40/248.40 ms avg=268.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 275.40000009536743,
            "unit": "median ms",
            "range": "±52.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=275.40/281.30/327.70/327.70 ms avg=350.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 327.69999980926514,
            "unit": "p95 ms",
            "range": "±52.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=275.40/281.30/327.70/327.70 ms avg=350.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±5.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.20/7.90/9.20 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.199999809265137,
            "unit": "p95 ms",
            "range": "±5.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.20/7.90/9.20 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 318.30000019073486,
            "unit": "median ms",
            "range": "±71.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.30/354.30/390.00/390.00 ms avg=423.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 390,
            "unit": "p95 ms",
            "range": "±71.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.30/354.30/390.00/390.00 ms avg=423.27 ms (7 runs sampled)"
          }
        ]
      }
    ]
  }
}