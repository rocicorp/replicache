window.BENCHMARK_DATA = {
  "lastUpdate": 1639178728724,
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
          "id": "5a402ab0aa6cd85b425ab8a397b21e774278d21b",
          "message": "Revert \"feat: Update WriteSubRead benchmark to invalidate random keys (instead of a fixed set) (#672)\" (#673)\n\nThis reverts commit c072880ee4c77b4eb4f042788e29f3f8bd1d7d8e.",
          "timestamp": "2021-11-08T22:01:35Z",
          "tree_id": "d354085224da09aa9122a8c26565dd21042cc839",
          "url": "https://github.com/rocicorp/replicache/commit/5a402ab0aa6cd85b425ab8a397b21e774278d21b"
        },
        "date": 1636408982797,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/4.20/6.00 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/4.20/6.00 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5999999046325684,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/5.00/6.40/6.40 ms avg=4.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.400000095367432,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/5.00/6.40/6.40 ms avg=4.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.4000000953674316,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.90/5.70/5.70 ms avg=4.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.90/5.70/5.70 ms avg=4.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 116.7999997138977,
            "unit": "median ms",
            "range": "±34.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=116.80/132.60/151.00/151.00 ms avg=150.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 151,
            "unit": "p95 ms",
            "range": "±34.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=116.80/132.60/151.00/151.00 ms avg=150.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 210.59999990463257,
            "unit": "median ms",
            "range": "±41.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.60/233.80/251.70/251.70 ms avg=269.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 251.69999980926514,
            "unit": "p95 ms",
            "range": "±41.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.60/233.80/251.70/251.70 ms avg=269.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 268.40000009536743,
            "unit": "median ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.40/299.10/329.30/329.30 ms avg=349.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 329.2999997138977,
            "unit": "p95 ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.40/299.10/329.30/329.30 ms avg=349.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.80/9.90 ms avg=5.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.900000095367432,
            "unit": "p95 ms",
            "range": "±5.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.80/9.90 ms avg=5.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 318.7999997138977,
            "unit": "median ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.80/333.00/400.10/400.10 ms avg=421.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 400.09999990463257,
            "unit": "p95 ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.80/333.00/400.10/400.10 ms avg=421.74 ms (7 runs sampled)"
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
          "id": "44c4ce5bb42221b90914c7cd56e7dcf24087eb1d",
          "message": "Bump version to 8.0.0.",
          "timestamp": "2021-11-08T13:57:17-10:00",
          "tree_id": "59bd30bbd69685ba21f44477ab1e64cdae88b214",
          "url": "https://github.com/rocicorp/replicache/commit/44c4ce5bb42221b90914c7cd56e7dcf24087eb1d"
        },
        "date": 1636415944313,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.50/6.30 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.300000190734863,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.50/6.30 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.9000000953674316,
            "unit": "median ms",
            "range": "±9.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.90/12.90/13.70/13.70 ms avg=7.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 13.700000286102295,
            "unit": "p95 ms",
            "range": "±9.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.90/12.90/13.70/13.70 ms avg=7.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5,
            "unit": "median ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/3.90/6.00/6.00 ms avg=4.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.50/3.90/6.00/6.00 ms avg=4.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.90000009536743,
            "unit": "median ms",
            "range": "±87.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.90/125.00/201.70/201.70 ms avg=157.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 201.7000002861023,
            "unit": "p95 ms",
            "range": "±87.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.90/125.00/201.70/201.70 ms avg=157.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 207.7999997138977,
            "unit": "median ms",
            "range": "±46.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.80/214.60/254.50/254.50 ms avg=267.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 254.5,
            "unit": "p95 ms",
            "range": "±46.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.80/214.60/254.50/254.50 ms avg=267.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 273.09999990463257,
            "unit": "median ms",
            "range": "±63.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.10/277.30/336.50/336.50 ms avg=350.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 336.5,
            "unit": "p95 ms",
            "range": "±63.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.10/277.30/336.50/336.50 ms avg=350.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.9000000953674316,
            "unit": "median ms",
            "range": "±6.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.20/8.90/9.90 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.900000095367432,
            "unit": "p95 ms",
            "range": "±6.0%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.20/8.90/9.90 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317.59999990463257,
            "unit": "median ms",
            "range": "±82.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.60/330.30/399.80/399.80 ms avg=420.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 399.80000019073486,
            "unit": "p95 ms",
            "range": "±82.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.60/330.30/399.80/399.80 ms avg=420.14 ms (7 runs sampled)"
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
          "id": "212f6ad4a10479ddb866135b61e60c3fea5f5669",
          "message": "refactor: Change commit refs computation (#675)\n\nMain motivation is to be able to compute the refs directly from the\r\nchunk data but this simplifies the code a bit. We used to have an object\r\ntelling us if the Hash in the commit was Weak or Strong. It was only\r\nused internally when computing the actual refs. Now we keep this logic\r\nin one place and we do need to keep this extra type around.",
          "timestamp": "2021-11-09T00:34:23Z",
          "tree_id": "4093c0cb3eb0c2ba6cd32ccf5b0baa69ca6f4232",
          "url": "https://github.com/rocicorp/replicache/commit/212f6ad4a10479ddb866135b61e60c3fea5f5669"
        },
        "date": 1636418238043,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.799999713897705,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.10/4.20/6.80 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.800000190734863,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.10/4.20/6.80 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.5999999046325684,
            "unit": "median ms",
            "range": "±8.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/6.10/12.00/12.00 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12,
            "unit": "p95 ms",
            "range": "±8.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/6.10/12.00/12.00 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/4.30/6.70/6.70 ms avg=4.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.700000286102295,
            "unit": "p95 ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/4.30/6.70/6.70 ms avg=4.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.69999980926514,
            "unit": "median ms",
            "range": "±90.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.70/148.70/201.40/201.40 ms avg=155.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 201.40000009536743,
            "unit": "p95 ms",
            "range": "±90.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.70/148.70/201.40/201.40 ms avg=155.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 207.5,
            "unit": "median ms",
            "range": "±58.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.50/211.40/265.90/265.90 ms avg=271.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 265.90000009536743,
            "unit": "p95 ms",
            "range": "±58.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.50/211.40/265.90/265.90 ms avg=271.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 271.19999980926514,
            "unit": "median ms",
            "range": "±56.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.20/292.70/327.70/327.70 ms avg=356.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 327.69999980926514,
            "unit": "p95 ms",
            "range": "±56.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.20/292.70/327.70/327.70 ms avg=356.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.400000095367432,
            "unit": "median ms",
            "range": "±5.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.40/5.70/9.00/10.20 ms avg=5.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 10.199999809265137,
            "unit": "p95 ms",
            "range": "±5.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.40/5.70/9.00/10.20 ms avg=5.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 319.19999980926514,
            "unit": "median ms",
            "range": "±94.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=319.20/336.90/413.30/413.30 ms avg=424.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 413.30000019073486,
            "unit": "p95 ms",
            "range": "±94.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=319.20/336.90/413.30/413.30 ms avg=424.41 ms (7 runs sampled)"
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
          "id": "cdc83e1f5ebc5a0497277243d8851b981dcaa639",
          "message": "feat: Take 2 - Update WriteSubRead benchmark to invalidate random keys (instead of a fixed set) (#674)\n\nNow using 'lodash-es' (Take 1 c072880 had to be reverted because the 'lodash.range' and 'lodash.samplesize' were cjs modules).",
          "timestamp": "2021-11-08T17:52:42-08:00",
          "tree_id": "10a5f91eaa1eecaad0abe1c1c695c66c2ea56206",
          "url": "https://github.com/rocicorp/replicache/commit/cdc83e1f5ebc5a0497277243d8851b981dcaa639"
        },
        "date": 1636422963595,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.30/6.60 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.599999904632568,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.30/6.60 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±9.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/12.90/14.10/14.10 ms avg=8.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 14.099999904632568,
            "unit": "p95 ms",
            "range": "±9.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/12.90/14.10/14.10 ms avg=8.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.699999809265137,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.70/6.10/7.60/7.60 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.599999904632568,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.70/6.10/7.60/7.60 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.2999997138977,
            "unit": "median ms",
            "range": "±36.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.30/116.10/147.00/147.00 ms avg=144.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 147,
            "unit": "p95 ms",
            "range": "±36.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.30/116.10/147.00/147.00 ms avg=144.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 216.19999980926514,
            "unit": "median ms",
            "range": "±65.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=216.20/218.60/281.40/281.40 ms avg=269.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 281.40000009536743,
            "unit": "p95 ms",
            "range": "±65.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=216.20/218.60/281.40/281.40 ms avg=269.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 269.59999990463257,
            "unit": "median ms",
            "range": "±53.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=269.60/300.40/323.50/323.50 ms avg=349.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 323.5,
            "unit": "p95 ms",
            "range": "±53.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=269.60/300.40/323.50/323.50 ms avg=349.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.50/8.90/9.40 ms avg=5.04 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.400000095367432,
            "unit": "p95 ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.50/8.90/9.40 ms avg=5.04 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317,
            "unit": "median ms",
            "range": "±75.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.00/326.20/392.80/392.80 ms avg=417.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 392.7999997138977,
            "unit": "p95 ms",
            "range": "±75.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.00/326.20/392.80/392.80 ms avg=417.50 ms (7 runs sampled)"
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
          "id": "4813b8209c788bd8f1819bcf0de161a5881fe423",
          "message": "feat: Setup dashboard and alerts for bundle sizes (#677)\n\n### Problem\r\nWe are missing a way to see bundle size changes over time (i.e. across commits).  It would also be nice to get alerts when bundle sizes increase by more than a small percent.\r\n\r\n### Solution\r\n\r\n- Create a small node script that outputs the bundle sizes in the format needed for the github-action-benchmark customSmallerIsBetter tool.  \r\n- Set up yml for github action that will run this script and use github-action-benchmark to graph the sizes on a new dashboard at https://rocicorp.github.io/replicache/bundle-sizes/\r\n- Also configure an alert for when bundle sizes increase by more than **5%.** \r\n\r\nCloses #125",
          "timestamp": "2021-11-08T19:15:39-08:00",
          "tree_id": "468347858d21689b9523cb5b46ad0abf521c79ed",
          "url": "https://github.com/rocicorp/replicache/commit/4813b8209c788bd8f1819bcf0de161a5881fe423"
        },
        "date": 1636427869578,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.00/6.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.700000286102295,
            "unit": "p95 ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.00/6.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.200000286102295,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.40/7.70/7.70 ms avg=5.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.699999809265137,
            "unit": "p95 ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.40/7.70/7.70 ms avg=5.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.80/7.50/7.50 ms avg=7.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.80/7.50/7.50 ms avg=7.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.69999980926514,
            "unit": "median ms",
            "range": "±86.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.70/142.30/199.80/199.80 ms avg=155.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 199.7999997138977,
            "unit": "p95 ms",
            "range": "±86.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.70/142.30/199.80/199.80 ms avg=155.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 209.2999997138977,
            "unit": "median ms",
            "range": "±76.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=209.30/223.40/285.90/285.90 ms avg=271.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 285.90000009536743,
            "unit": "p95 ms",
            "range": "±76.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=209.30/223.40/285.90/285.90 ms avg=271.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 268.40000009536743,
            "unit": "median ms",
            "range": "±70.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.40/323.20/339.30/339.30 ms avg=354.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 339.30000019073486,
            "unit": "p95 ms",
            "range": "±70.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.40/323.20/339.30/339.30 ms avg=354.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.10/8.10/9.30 ms avg=4.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.299999713897705,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.10/8.10/9.30 ms avg=4.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317.80000019073486,
            "unit": "median ms",
            "range": "±76.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.80/327.60/394.60/394.60 ms avg=418.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 394.59999990463257,
            "unit": "p95 ms",
            "range": "±76.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.80/327.60/394.60/394.60 ms avg=418.14 ms (7 runs sampled)"
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
        "date": 1636474435033,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000286102295,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.90/6.80 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.800000190734863,
            "unit": "p95 ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.90/6.80 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/10.60/12.60/12.60 ms avg=7.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.599999904632568,
            "unit": "p95 ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/10.60/12.60/12.60 ms avg=7.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.799999713897705,
            "unit": "median ms",
            "range": "±7.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.80/7.80/12.80/12.80 ms avg=8.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.799999713897705,
            "unit": "p95 ms",
            "range": "±7.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.80/7.80/12.80/12.80 ms avg=8.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.5,
            "unit": "median ms",
            "range": "±37.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.50/117.10/150.60/150.60 ms avg=146.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 150.59999990463257,
            "unit": "p95 ms",
            "range": "±37.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.50/117.10/150.60/150.60 ms avg=146.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 208.59999990463257,
            "unit": "median ms",
            "range": "±72.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.60/229.10/281.30/281.30 ms avg=272.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 281.2999997138977,
            "unit": "p95 ms",
            "range": "±72.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.60/229.10/281.30/281.30 ms avg=272.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 276.90000009536743,
            "unit": "median ms",
            "range": "±43.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=276.90/300.70/320.80/320.80 ms avg=351.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 320.7999997138977,
            "unit": "p95 ms",
            "range": "±43.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=276.90/300.70/320.80/320.80 ms avg=351.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.20/9.50 ms avg=4.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.20/9.50 ms avg=4.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 313.59999990463257,
            "unit": "median ms",
            "range": "±76.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.60/326.80/390.20/390.20 ms avg=413.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 390.2000002861023,
            "unit": "p95 ms",
            "range": "±76.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.60/326.80/390.20/390.20 ms avg=413.94 ms (7 runs sampled)"
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
        "date": 1636476424566,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000286102295,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/2.90/3.80/5.50 ms avg=3.16 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.5,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/2.90/3.80/5.50 ms avg=3.16 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±8.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/13.30/13.80/13.80 ms avg=8.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 13.800000190734863,
            "unit": "p95 ms",
            "range": "±8.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/13.30/13.80/13.80 ms avg=8.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.400000095367432,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.40/7.30/7.30 ms avg=6.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.299999713897705,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.40/7.30/7.30 ms avg=6.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 114,
            "unit": "median ms",
            "range": "±35.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.00/114.40/149.00/149.00 ms avg=146.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 149,
            "unit": "p95 ms",
            "range": "±35.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.00/114.40/149.00/149.00 ms avg=146.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 212.59999990463257,
            "unit": "median ms",
            "range": "±62.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=212.60/227.60/275.10/275.10 ms avg=273.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 275.09999990463257,
            "unit": "p95 ms",
            "range": "±62.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=212.60/227.60/275.10/275.10 ms avg=273.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 271.40000009536743,
            "unit": "median ms",
            "range": "±50.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.40/300.40/321.70/321.70 ms avg=351.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 321.7000002861023,
            "unit": "p95 ms",
            "range": "±50.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.40/300.40/321.70/321.70 ms avg=351.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.30/9.30 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.30/9.30 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 321.5,
            "unit": "median ms",
            "range": "±82.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.50/329.40/403.80/403.80 ms avg=420.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 403.80000019073486,
            "unit": "p95 ms",
            "range": "±82.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.50/329.40/403.80/403.80 ms avg=420.81 ms (7 runs sampled)"
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
          "id": "da05aa3319dedf3ad93862c2349cc097e41d9382",
          "message": "feat: Add Brotli compressed bundle sizes to Bundle Sizes dashboard (#679)\n\n### Problem\r\nBundle Size dashboard https://rocicorp.github.io/replicache/bundle-sizes/ and associated alerts currently only track non-compressed sizes of bundles.  What we really care about is Brotli compressed size.\r\n\r\n### Solution\r\nAdd Brotli compressed sizes of bundles to dashboard and alert.\r\nTo do this needed to move from `self-hosted` runner to `ubuntu-latest` as `brotli` command was not available in the `self-hosted` environment (but is in `ubuntu-latest`).  This is fine as we don't care about cpu/memory isolation for this benchmark as we do for the performance benchmarks, because we are just measuring byte size.",
          "timestamp": "2021-11-09T08:59:18-08:00",
          "tree_id": "e6c7667d804131fff367901c076321d5c4d8751a",
          "url": "https://github.com/rocicorp/replicache/commit/da05aa3319dedf3ad93862c2349cc097e41d9382"
        },
        "date": 1636477256084,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.30/6.60 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.599999904632568,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.30/6.60 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.80/6.70/6.70 ms avg=5.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.80/6.70/6.70 ms avg=5.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.20/8.00/8.00 ms avg=6.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.20/8.00/8.00 ms avg=6.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.30000019073486,
            "unit": "median ms",
            "range": "±50.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.30/128.50/162.70/162.70 ms avg=150.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 162.69999980926514,
            "unit": "p95 ms",
            "range": "±50.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.30/128.50/162.70/162.70 ms avg=150.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 210.09999990463257,
            "unit": "median ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.10/220.70/281.70/281.70 ms avg=272.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 281.69999980926514,
            "unit": "p95 ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.10/220.70/281.70/281.70 ms avg=272.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 271.09999990463257,
            "unit": "median ms",
            "range": "±50.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.10/297.40/322.00/322.00 ms avg=349.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 322,
            "unit": "p95 ms",
            "range": "±50.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=271.10/297.40/322.00/322.00 ms avg=349.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.60/7.80/9.40 ms avg=5.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.400000095367432,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.60/7.80/9.40 ms avg=5.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 316.69999980926514,
            "unit": "median ms",
            "range": "±84.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.70/329.30/401.40/401.40 ms avg=417.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 401.3999996185303,
            "unit": "p95 ms",
            "range": "±84.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.70/329.30/401.40/401.40 ms avg=417.54 ms (7 runs sampled)"
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
        "date": 1636495434420,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.70/6.50 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.70/6.50 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.599999904632568,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/7.50/7.50 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/7.50/7.50 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.60/7.70/7.70 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.699999809265137,
            "unit": "p95 ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.60/7.70/7.70 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.2999997138977,
            "unit": "median ms",
            "range": "±87.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.30/143.20/200.30/200.30 ms avg=155.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 200.2999997138977,
            "unit": "p95 ms",
            "range": "±87.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.30/143.20/200.30/200.30 ms avg=155.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 206.89999961853027,
            "unit": "median ms",
            "range": "±76.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.90/214.50/283.40/283.40 ms avg=266.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 283.40000009536743,
            "unit": "p95 ms",
            "range": "±76.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.90/214.50/283.40/283.40 ms avg=266.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 263.7999997138977,
            "unit": "median ms",
            "range": "±66.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.80/281.00/330.00/330.00 ms avg=346.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 330,
            "unit": "p95 ms",
            "range": "±66.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.80/281.00/330.00/330.00 ms avg=346.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.40/7.70/9.50 ms avg=4.92 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.40/7.70/9.50 ms avg=4.92 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 314.2999997138977,
            "unit": "median ms",
            "range": "±83.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=314.30/331.80/397.40/397.40 ms avg=416.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 397.3999996185303,
            "unit": "p95 ms",
            "range": "±83.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=314.30/331.80/397.40/397.40 ms avg=416.47 ms (7 runs sampled)"
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
        "date": 1636683449332,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/5.30/6.90 ms avg=3.44 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.900000095367432,
            "unit": "p95 ms",
            "range": "±4.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/5.30/6.90 ms avg=3.44 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/12.30/12.90/12.90 ms avg=7.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.900000095367432,
            "unit": "p95 ms",
            "range": "±8.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/12.30/12.90/12.90 ms avg=7.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.200000286102295,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.80/7.10/7.10 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.099999904632568,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.80/7.10/7.10 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.09999990463257,
            "unit": "median ms",
            "range": "±83.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/116.60/194.50/194.50 ms avg=151.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 194.5,
            "unit": "p95 ms",
            "range": "±83.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/116.60/194.50/194.50 ms avg=151.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 211.80000019073486,
            "unit": "median ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.80/222.60/278.40/278.40 ms avg=271.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 278.3999996185303,
            "unit": "p95 ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.80/222.60/278.40/278.40 ms avg=271.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 262.5,
            "unit": "median ms",
            "range": "±63.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.50/316.70/325.50/325.50 ms avg=350.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 325.5,
            "unit": "p95 ms",
            "range": "±63.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.50/316.70/325.50/325.50 ms avg=350.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.50/8.50/9.40 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.400000095367432,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.50/8.50/9.40 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 316,
            "unit": "median ms",
            "range": "±80.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.00/332.70/396.80/396.80 ms avg=419.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 396.7999997138977,
            "unit": "p95 ms",
            "range": "±80.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.00/332.70/396.80/396.80 ms avg=419.53 ms (7 runs sampled)"
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
        "date": 1636756705949,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.10/6.00 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.10/6.00 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.50/7.70/7.70 ms avg=5.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.700000286102295,
            "unit": "p95 ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.50/7.70/7.70 ms avg=5.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.200000286102295,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.00/8.50/8.50 ms avg=7.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.5,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.00/8.50/8.50 ms avg=7.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.09999990463257,
            "unit": "median ms",
            "range": "±89.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.10/145.40/201.50/201.50 ms avg=155.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 201.5,
            "unit": "p95 ms",
            "range": "±89.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.10/145.40/201.50/201.50 ms avg=155.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.30000019073486,
            "unit": "median ms",
            "range": "±78.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/216.60/276.00/276.00 ms avg=262.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 276,
            "unit": "p95 ms",
            "range": "±78.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/216.60/276.00/276.00 ms avg=262.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 260.80000019073486,
            "unit": "median ms",
            "range": "±94.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.80/274.30/354.90/354.90 ms avg=346.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 354.90000009536743,
            "unit": "p95 ms",
            "range": "±94.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.80/274.30/354.90/354.90 ms avg=346.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.60/8.20/9.50 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.60/8.20/9.50 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 315.69999980926514,
            "unit": "median ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=315.70/332.50/397.00/397.00 ms avg=417.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 397,
            "unit": "p95 ms",
            "range": "±81.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=315.70/332.50/397.00/397.00 ms avg=417.39 ms (7 runs sampled)"
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
        "date": 1636757366873,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5999999046325684,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.00/6.70 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.700000286102295,
            "unit": "p95 ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.00/6.70 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.10/6.80/6.80 ms avg=5.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.800000190734863,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.10/6.80/6.80 ms avg=5.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.299999713897705,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.30/7.70/7.70 ms avg=7.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.700000286102295,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.30/7.70/7.70 ms avg=7.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.59999990463257,
            "unit": "median ms",
            "range": "±92.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.60/142.10/205.90/205.90 ms avg=155.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 205.90000009536743,
            "unit": "p95 ms",
            "range": "±92.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.60/142.10/205.90/205.90 ms avg=155.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 209.2999997138977,
            "unit": "median ms",
            "range": "±69.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=209.30/220.30/278.70/278.70 ms avg=271.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 278.69999980926514,
            "unit": "p95 ms",
            "range": "±69.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=209.30/220.30/278.70/278.70 ms avg=271.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 263.90000009536743,
            "unit": "median ms",
            "range": "±70.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.90/327.70/333.90/333.90 ms avg=353.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 333.90000009536743,
            "unit": "p95 ms",
            "range": "±70.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.90/327.70/333.90/333.90 ms avg=353.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.099999904632568,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.80/9.60 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.599999904632568,
            "unit": "p95 ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.80/9.60 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 315.69999980926514,
            "unit": "median ms",
            "range": "±79.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=315.70/324.90/394.80/394.80 ms avg=415.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 394.80000019073486,
            "unit": "p95 ms",
            "range": "±79.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=315.70/324.90/394.80/394.80 ms avg=415.24 ms (7 runs sampled)"
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
        "date": 1637023835824,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.799999713897705,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.10/3.90/6.40 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.400000095367432,
            "unit": "p95 ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.10/3.90/6.40 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.70/7.60/7.60 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.599999904632568,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.70/7.60/7.60 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 6,
            "unit": "median ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.00/6.30/7.80/7.80 ms avg=7.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.00/6.30/7.80/7.80 ms avg=7.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 115.10000038146973,
            "unit": "median ms",
            "range": "±92.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.10/151.80/207.10/207.10 ms avg=158.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 207.10000038146973,
            "unit": "p95 ms",
            "range": "±92.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.10/151.80/207.10/207.10 ms avg=158.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 215,
            "unit": "median ms",
            "range": "±73.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=215.00/222.40/288.40/288.40 ms avg=276.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 288.3999996185303,
            "unit": "p95 ms",
            "range": "±73.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=215.00/222.40/288.40/288.40 ms avg=276.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 273.69999980926514,
            "unit": "median ms",
            "range": "±57.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.70/301.50/331.00/331.00 ms avg=355.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 331,
            "unit": "p95 ms",
            "range": "±57.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.70/301.50/331.00/331.00 ms avg=355.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.299999713897705,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.30/5.00/8.50/9.50 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.30/5.00/8.50/9.50 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317.59999990463257,
            "unit": "median ms",
            "range": "±87.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.60/329.90/405.50/405.50 ms avg=420.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 405.5,
            "unit": "p95 ms",
            "range": "±87.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.60/329.90/405.50/405.50 ms avg=420.83 ms (7 runs sampled)"
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
        "date": 1637080890090,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8000001907348633,
            "unit": "median ms",
            "range": "±4.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.40/5.90/7.70 ms avg=3.56 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.700000762939453,
            "unit": "p95 ms",
            "range": "±4.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.40/5.90/7.70 ms avg=3.56 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.600000381469727,
            "unit": "median ms",
            "range": "±9.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/7.90/15.00/15.00 ms avg=7.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 15,
            "unit": "p95 ms",
            "range": "±9.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/7.90/15.00/15.00 ms avg=7.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 6.300000190734863,
            "unit": "median ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.30/6.90/8.00/8.00 ms avg=7.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.30/6.90/8.00/8.00 ms avg=7.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 115.30000019073486,
            "unit": "median ms",
            "range": "±91.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.30/146.50/206.30/206.30 ms avg=157.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 206.30000019073486,
            "unit": "p95 ms",
            "range": "±91.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.30/146.50/206.30/206.30 ms avg=157.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 214.19999980926514,
            "unit": "median ms",
            "range": "±69.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=214.20/225.40/283.60/283.60 ms avg=276.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 283.5999994277954,
            "unit": "p95 ms",
            "range": "±69.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=214.20/225.40/283.60/283.60 ms avg=276.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 268.19999980926514,
            "unit": "median ms",
            "range": "±72.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.20/326.00/340.80/340.80 ms avg=358.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 340.80000019073486,
            "unit": "p95 ms",
            "range": "±72.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=268.20/326.00/340.80/340.80 ms avg=358.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.90000057220459,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.50/7.50/9.30 ms avg=4.93 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.50/7.50/9.30 ms avg=4.93 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 318.30000019073486,
            "unit": "median ms",
            "range": "±89.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.30/342.70/407.30/407.30 ms avg=424.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 407.30000019073486,
            "unit": "p95 ms",
            "range": "±89.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=318.30/342.70/407.30/407.30 ms avg=424.39 ms (7 runs sampled)"
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
        "date": 1637081853287,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/4.30/6.90 ms avg=3.27 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/4.30/6.90 ms avg=3.27 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.200000762939453,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.70/7.10/7.10 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.100000381469727,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.70/7.10/7.10 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.59999942779541,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/6.30/8.40/8.40 ms avg=7.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.399999618530273,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/6.30/8.40/8.40 ms avg=7.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.89999961853027,
            "unit": "median ms",
            "range": "±38.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/118.70/151.10/151.10 ms avg=147.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 151.10000038146973,
            "unit": "p95 ms",
            "range": "±38.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/118.70/151.10/151.10 ms avg=147.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 210.39999961853027,
            "unit": "median ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.40/222.00/278.60/278.60 ms avg=273.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 278.6000003814697,
            "unit": "p95 ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.40/222.00/278.60/278.60 ms avg=273.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 266.19999980926514,
            "unit": "median ms",
            "range": "±57.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.20/296.80/323.60/323.60 ms avg=349.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 323.6000003814697,
            "unit": "p95 ms",
            "range": "±57.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.20/296.80/323.60/323.60 ms avg=349.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±5.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.50/8.10/9.90 ms avg=5.12 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.90000057220459,
            "unit": "p95 ms",
            "range": "±5.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.50/8.10/9.90 ms avg=5.12 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 316.5,
            "unit": "median ms",
            "range": "±87.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.50/328.60/403.70/403.70 ms avg=420.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 403.70000076293945,
            "unit": "p95 ms",
            "range": "±87.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.50/328.60/403.70/403.70 ms avg=420.24 ms (7 runs sampled)"
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
        "date": 1637083817195,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.10/8.70 ms avg=3.41 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.699999809265137,
            "unit": "p95 ms",
            "range": "±6.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.10/8.70 ms avg=3.41 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/6.10/7.60/7.60 ms avg=6.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.59999942779541,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/6.10/7.60/7.60 ms avg=6.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±15.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.00/20.70/20.70 ms avg=8.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 20.700000762939453,
            "unit": "p95 ms",
            "range": "±15.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.00/20.70/20.70 ms avg=8.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 113.19999980926514,
            "unit": "median ms",
            "range": "±82.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.20/113.50/196.10/196.10 ms avg=152.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 196.10000038146973,
            "unit": "p95 ms",
            "range": "±82.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=113.20/113.50/196.10/196.10 ms avg=152.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 200.5,
            "unit": "median ms",
            "range": "±79.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.50/218.20/280.20/280.20 ms avg=268.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 280.19999980926514,
            "unit": "p95 ms",
            "range": "±79.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.50/218.20/280.20/280.20 ms avg=268.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265,
            "unit": "median ms",
            "range": "±101.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.00/282.20/366.70/366.70 ms avg=355.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 366.69999980926514,
            "unit": "p95 ms",
            "range": "±101.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.00/282.20/366.70/366.70 ms avg=355.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.70/8.40/9.50 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.5,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.70/8.40/9.50 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 329.70000076293945,
            "unit": "median ms",
            "range": "±63.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=329.70/333.90/393.00/393.00 ms avg=427.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 393,
            "unit": "p95 ms",
            "range": "±63.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=329.70/333.90/393.00/393.00 ms avg=427.09 ms (7 runs sampled)"
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
        "date": 1637091447616,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.59999942779541,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.30/6.10 ms avg=3.23 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.100000381469727,
            "unit": "p95 ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.30/6.10 ms avg=3.23 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.699999809265137,
            "unit": "median ms",
            "range": "±8.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/12.40/13.60/13.60 ms avg=8.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 13.600000381469727,
            "unit": "p95 ms",
            "range": "±8.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/12.40/13.60/13.60 ms avg=8.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.5,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.20/7.10/7.10 ms avg=6.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.09999942779541,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.20/7.10/7.10 ms avg=6.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.80000019073486,
            "unit": "median ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.80/112.40/155.50/155.50 ms avg=145.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 155.5,
            "unit": "p95 ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.80/112.40/155.50/155.50 ms avg=145.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 211.30000019073486,
            "unit": "median ms",
            "range": "±60.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.30/228.00/272.00/272.00 ms avg=271.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 272,
            "unit": "p95 ms",
            "range": "±60.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.30/228.00/272.00/272.00 ms avg=271.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 267.9000005722046,
            "unit": "median ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.90/324.10/334.50/334.50 ms avg=353.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 334.5,
            "unit": "p95 ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.90/324.10/334.50/334.50 ms avg=353.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.30/8.40/9.30 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.299999237060547,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.30/8.40/9.30 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 317.69999980926514,
            "unit": "median ms",
            "range": "±80.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.70/330.80/398.40/398.40 ms avg=420.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 398.4000005722046,
            "unit": "p95 ms",
            "range": "±80.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=317.70/330.80/398.40/398.40 ms avg=420.09 ms (7 runs sampled)"
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
        "date": 1637098566906,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.80/6.70 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.80/6.70 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/6.00/7.30/7.30 ms avg=5.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/6.00/7.30/7.30 ms avg=5.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.70/7.20/7.20 ms avg=6.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.199999809265137,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.70/7.20/7.20 ms avg=6.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 114.59999942779541,
            "unit": "median ms",
            "range": "±92.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.60/145.40/206.70/206.70 ms avg=157.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 206.70000076293945,
            "unit": "p95 ms",
            "range": "±92.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=114.60/145.40/206.70/206.70 ms avg=157.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 210.10000038146973,
            "unit": "median ms",
            "range": "±69.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.10/218.90/279.80/279.80 ms avg=268.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 279.80000019073486,
            "unit": "p95 ms",
            "range": "±69.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=210.10/218.90/279.80/279.80 ms avg=268.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 267.1000003814697,
            "unit": "median ms",
            "range": "±55.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.10/292.10/322.20/322.20 ms avg=348.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 322.19999980926514,
            "unit": "p95 ms",
            "range": "±55.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.10/292.10/322.20/322.20 ms avg=348.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.09999942779541,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.40/8.40/9.30 ms avg=4.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.40/8.40/9.30 ms avg=4.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 321.5,
            "unit": "median ms",
            "range": "±80.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.50/329.00/402.00/402.00 ms avg=423.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 402,
            "unit": "p95 ms",
            "range": "±80.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=321.50/329.00/402.00/402.00 ms avg=423.63 ms (7 runs sampled)"
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
        "date": 1637104992797,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.40/5.60 ms avg=3.15 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.600000381469727,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.40/5.60 ms avg=3.15 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.60/7.40/7.40 ms avg=5.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.60/7.40/7.40 ms avg=5.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/6.10/8.30/8.30 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.300000190734863,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/6.10/8.30/8.30 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.19999980926514,
            "unit": "median ms",
            "range": "±91.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.20/139.90/204.10/204.10 ms avg=154.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 204.0999994277954,
            "unit": "p95 ms",
            "range": "±91.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.20/139.90/204.10/204.10 ms avg=154.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 211.19999980926514,
            "unit": "median ms",
            "range": "±62.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.20/217.40/273.20/273.20 ms avg=267.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 273.19999980926514,
            "unit": "p95 ms",
            "range": "±62.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=211.20/217.40/273.20/273.20 ms avg=267.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 273.5,
            "unit": "median ms",
            "range": "±63.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.50/317.70/337.20/337.20 ms avg=356.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 337.20000076293945,
            "unit": "p95 ms",
            "range": "±63.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=273.50/317.70/337.20/337.20 ms avg=356.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.100000381469727,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.50/9.40 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.40000057220459,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.20/8.50/9.40 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 313.1000003814697,
            "unit": "median ms",
            "range": "±78.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.10/330.90/391.40/391.40 ms avg=413.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 391.4000005722046,
            "unit": "p95 ms",
            "range": "±78.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.10/330.90/391.40/391.40 ms avg=413.39 ms (7 runs sampled)"
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
        "date": 1637105421644,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.30/6.70 ms avg=3.31 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.30/6.70 ms avg=3.31 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.80/6.50/6.50 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.80/6.50/6.50 ms avg=5.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.80/8.60/8.60 ms avg=7.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.600000381469727,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.80/8.60/8.60 ms avg=7.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.89999961853027,
            "unit": "median ms",
            "range": "±39.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.90/112.60/148.70/148.70 ms avg=142.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 148.69999980926514,
            "unit": "p95 ms",
            "range": "±39.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.90/112.60/148.70/148.70 ms avg=142.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 207.69999980926514,
            "unit": "median ms",
            "range": "±64.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.70/226.80/272.00/272.00 ms avg=268.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 272,
            "unit": "p95 ms",
            "range": "±64.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=207.70/226.80/272.00/272.00 ms avg=268.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 263.69999980926514,
            "unit": "median ms",
            "range": "±53.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.70/280.40/317.10/317.10 ms avg=337.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 317.0999994277954,
            "unit": "p95 ms",
            "range": "±53.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.70/280.40/317.10/317.10 ms avg=337.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.8999996185302734,
            "unit": "median ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.20/8.00/9.30 ms avg=4.91 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.90/5.20/8.00/9.30 ms avg=4.91 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 306.69999980926514,
            "unit": "median ms",
            "range": "±63.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.70/315.30/370.20/370.20 ms avg=400.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 370.19999980926514,
            "unit": "p95 ms",
            "range": "±63.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.70/315.30/370.20/370.20 ms avg=400.09 ms (7 runs sampled)"
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
        "date": 1637110071200,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±4.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.20/7.00 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±4.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.20/7.00 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.90/6.90/6.90 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.90/6.90/6.90 ms avg=6.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/7.10/9.00/9.00 ms avg=6.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 9,
            "unit": "p95 ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/7.10/9.00/9.00 ms avg=6.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 112.89999961853027,
            "unit": "median ms",
            "range": "±38.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/113.00/151.60/151.60 ms avg=144.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 151.60000038146973,
            "unit": "p95 ms",
            "range": "±38.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=112.90/113.00/151.60/151.60 ms avg=144.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 201.5,
            "unit": "median ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.50/204.60/242.70/242.70 ms avg=257.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 242.69999980926514,
            "unit": "p95 ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.50/204.60/242.70/242.70 ms avg=257.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265.6000003814697,
            "unit": "median ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.60/295.20/309.30/309.30 ms avg=341.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 309.30000019073486,
            "unit": "p95 ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.60/295.20/309.30/309.30 ms avg=341.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±6.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.70/10.50 ms avg=5.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 10.5,
            "unit": "p95 ms",
            "range": "±6.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.70/10.50 ms avg=5.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 313.0999994277954,
            "unit": "median ms",
            "range": "±59.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.10/331.70/372.50/372.50 ms avg=408.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 372.5,
            "unit": "p95 ms",
            "range": "±59.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.10/331.70/372.50/372.50 ms avg=408.71 ms (7 runs sampled)"
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
        "date": 1637174041005,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.59999942779541,
            "unit": "median ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.10/6.40 ms avg=3.26 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.40000057220459,
            "unit": "p95 ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.10/6.40 ms avg=3.26 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.40/8.20/8.20 ms avg=6.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.199999809265137,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.40/8.20/8.20 ms avg=6.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.399999618530273,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.40/9.10/9.10 ms avg=7.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 9.09999942779541,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.40/9.10/9.10 ms avg=7.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109.30000019073486,
            "unit": "median ms",
            "range": "±39.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.30/115.30/149.10/149.10 ms avg=143.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 149.0999994277954,
            "unit": "p95 ms",
            "range": "±39.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.30/115.30/149.10/149.10 ms avg=143.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204.5,
            "unit": "median ms",
            "range": "±73.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/209.20/278.20/278.20 ms avg=265.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 278.19999980926514,
            "unit": "p95 ms",
            "range": "±73.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/209.20/278.20/278.20 ms avg=265.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.6000003814697,
            "unit": "median ms",
            "range": "±57.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.60/271.70/316.80/316.80 ms avg=338.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 316.80000019073486,
            "unit": "p95 ms",
            "range": "±57.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.60/271.70/316.80/316.80 ms avg=338.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±6.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.50/10.50 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 10.5,
            "unit": "p95 ms",
            "range": "±6.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.20/5.40/7.50/10.50 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 311.30000019073486,
            "unit": "median ms",
            "range": "±64.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=311.30/322.60/375.50/375.50 ms avg=409.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 375.5,
            "unit": "p95 ms",
            "range": "±64.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=311.30/322.60/375.50/375.50 ms avg=409.06 ms (7 runs sampled)"
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
        "date": 1637174525981,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000762939453,
            "unit": "median ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.30/6.60 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.59999942779541,
            "unit": "p95 ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.30/6.60 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.80/6.30/6.30 ms avg=5.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.299999237060547,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.80/6.30/6.30 ms avg=5.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.899999618530273,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/6.20/8.50/8.50 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.5,
            "unit": "p95 ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/6.20/8.50/8.50 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.19999980926514,
            "unit": "median ms",
            "range": "±38.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.20/112.60/148.70/148.70 ms avg=142.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 148.69999980926514,
            "unit": "p95 ms",
            "range": "±38.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.20/112.60/148.70/148.70 ms avg=142.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.0999994277954,
            "unit": "median ms",
            "range": "±64.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.10/210.50/266.90/266.90 ms avg=261.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 266.8999996185303,
            "unit": "p95 ms",
            "range": "±64.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.10/210.50/266.90/266.90 ms avg=261.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 254.5,
            "unit": "median ms",
            "range": "±52.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=254.50/291.30/307.00/307.00 ms avg=333.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 307,
            "unit": "p95 ms",
            "range": "±52.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=254.50/291.30/307.00/307.00 ms avg=333.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.30/7.90/9.20 ms avg=4.93 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.199999809265137,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.30/7.90/9.20 ms avg=4.93 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 301.3999996185303,
            "unit": "median ms",
            "range": "±65.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.40/327.40/366.90/366.90 ms avg=400.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 366.8999996185303,
            "unit": "p95 ms",
            "range": "±65.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.40/327.40/366.90/366.90 ms avg=400.47 ms (7 runs sampled)"
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
        "date": 1637180952929,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.20/6.20 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.199999809265137,
            "unit": "p95 ms",
            "range": "±3.5%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.20/6.20 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.200000762939453,
            "unit": "median ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.50/7.60/7.60 ms avg=5.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.600000381469727,
            "unit": "p95 ms",
            "range": "±3.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.50/7.60/7.60 ms avg=5.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.600000381469727,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/6.20/8.60/8.60 ms avg=7.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.600000381469727,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/6.20/8.60/8.60 ms avg=7.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.10000038146973,
            "unit": "median ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/113.30/181.70/181.70 ms avg=147.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 181.69999980926514,
            "unit": "p95 ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/113.30/181.70/181.70 ms avg=147.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.10000038146973,
            "unit": "median ms",
            "range": "±78.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.10/211.20/280.50/280.50 ms avg=265.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 280.5,
            "unit": "p95 ms",
            "range": "±78.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.10/211.20/280.50/280.50 ms avg=265.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265.80000019073486,
            "unit": "median ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.80/313.40/332.40/332.40 ms avg=345.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 332.3999996185303,
            "unit": "p95 ms",
            "range": "±66.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.80/313.40/332.40/332.40 ms avg=345.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.09999942779541,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.00/9.00/9.30 ms avg=4.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.00/9.00/9.30 ms avg=4.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 305,
            "unit": "median ms",
            "range": "±70.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.00/319.10/375.00/375.00 ms avg=401.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 375,
            "unit": "p95 ms",
            "range": "±70.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.00/319.10/375.00/375.00 ms avg=401.44 ms (7 runs sampled)"
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
        "date": 1637190435274,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.40/6.30 ms avg=3.29 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.300000190734863,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/4.40/6.30 ms avg=3.29 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/6.10/6.20/6.20 ms avg=5.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.199999809265137,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/6.10/6.20/6.20 ms avg=5.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.60/7.80/7.80 ms avg=6.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.799999237060547,
            "unit": "p95 ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.60/7.80/7.80 ms avg=6.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 107.80000019073486,
            "unit": "median ms",
            "range": "±38.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.80/112.70/146.30/146.30 ms avg=143.04 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 146.30000019073486,
            "unit": "p95 ms",
            "range": "±38.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.80/112.70/146.30/146.30 ms avg=143.04 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 208,
            "unit": "median ms",
            "range": "±59.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.00/215.40/267.60/267.60 ms avg=260.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 267.6000003814697,
            "unit": "p95 ms",
            "range": "±59.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.00/215.40/267.60/267.60 ms avg=260.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 261.8999996185303,
            "unit": "median ms",
            "range": "±70.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.90/309.20/332.40/332.40 ms avg=344.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 332.3999996185303,
            "unit": "p95 ms",
            "range": "±70.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.90/309.20/332.40/332.40 ms avg=344.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.100000381469727,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.30/7.90/9.40 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.399999618530273,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.30/7.90/9.40 ms avg=5.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 308.3999996185303,
            "unit": "median ms",
            "range": "±62.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.40/313.80/370.50/370.50 ms avg=402.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 370.5,
            "unit": "p95 ms",
            "range": "±62.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.40/313.80/370.50/370.50 ms avg=402.54 ms (7 runs sampled)"
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
        "date": 1637205268402,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000762939453,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.00/7.40 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.40000057220459,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.00/7.40 ms avg=3.35 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/6.60/6.60 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/6.60/6.60 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.80/7.50/7.50 ms avg=6.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.80/7.50/7.50 ms avg=6.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.30000019073486,
            "unit": "median ms",
            "range": "±47.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.30/113.70/155.60/155.60 ms avg=144.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 155.60000038146973,
            "unit": "p95 ms",
            "range": "±47.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.30/113.70/155.60/155.60 ms avg=144.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 191.80000019073486,
            "unit": "median ms",
            "range": "±84.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.80/213.20/276.70/276.70 ms avg=257.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 276.69999980926514,
            "unit": "p95 ms",
            "range": "±84.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.80/213.20/276.70/276.70 ms avg=257.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 266.30000019073486,
            "unit": "median ms",
            "range": "±84.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.30/271.70/350.60/350.60 ms avg=342.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 350.6000003814697,
            "unit": "p95 ms",
            "range": "±84.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.30/271.70/350.60/350.60 ms avg=342.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.10/8.40/9.20 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.199999809265137,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/5.10/8.40/9.20 ms avg=4.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 311.0999994277954,
            "unit": "median ms",
            "range": "±63.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=311.10/329.80/374.90/374.90 ms avg=406.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 374.8999996185303,
            "unit": "p95 ms",
            "range": "±63.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=311.10/329.80/374.90/374.90 ms avg=406.06 ms (7 runs sampled)"
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
        "date": 1637271630148,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.10/5.70 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/4.10/5.70 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.699999809265137,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/5.60/7.50/7.50 ms avg=6.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/5.60/7.50/7.50 ms avg=6.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.200000762939453,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/7.20/8.10/8.10 ms avg=6.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.100000381469727,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/7.20/8.10/8.10 ms avg=6.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.5,
            "unit": "median ms",
            "range": "±39.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.50/112.40/147.70/147.70 ms avg=142.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 147.69999980926514,
            "unit": "p95 ms",
            "range": "±39.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.50/112.40/147.70/147.70 ms avg=142.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.30000019073486,
            "unit": "median ms",
            "range": "±68.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/207.90/266.20/266.20 ms avg=257.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 266.19999980926514,
            "unit": "p95 ms",
            "range": "±68.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/207.90/266.20/266.20 ms avg=257.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 265.30000019073486,
            "unit": "median ms",
            "range": "±70.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.30/269.70/335.30/335.30 ms avg=337.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 335.30000019073486,
            "unit": "p95 ms",
            "range": "±70.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=265.30/269.70/335.30/335.30 ms avg=337.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±5.9%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.30/5.70/7.60/10.20 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 10.199999809265137,
            "unit": "p95 ms",
            "range": "±5.9%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.30/5.70/7.60/10.20 ms avg=4.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 312.1000003814697,
            "unit": "median ms",
            "range": "±60.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=312.10/322.40/372.90/372.90 ms avg=407.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 372.9000005722046,
            "unit": "p95 ms",
            "range": "±60.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=312.10/322.40/372.90/372.90 ms avg=407.67 ms (7 runs sampled)"
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
        "date": 1637272121681,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000762939453,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.60/6.70 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.60/6.70 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.70/6.60/6.60 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.59999942779541,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.70/6.60/6.60 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.30/8.90/8.90 ms avg=7.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.899999618530273,
            "unit": "p95 ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.30/8.90/8.90 ms avg=7.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.10000038146973,
            "unit": "median ms",
            "range": "±89.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/139.20/199.10/199.10 ms avg=151.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 199.10000038146973,
            "unit": "p95 ms",
            "range": "±89.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/139.20/199.10/199.10 ms avg=151.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 199.4000005722046,
            "unit": "median ms",
            "range": "±71.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.40/214.00/270.90/270.90 ms avg=261.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 270.9000005722046,
            "unit": "p95 ms",
            "range": "±71.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.40/214.00/270.90/270.90 ms avg=261.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 258.30000019073486,
            "unit": "median ms",
            "range": "±53.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.30/267.90/312.10/312.10 ms avg=335.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 312.1000003814697,
            "unit": "p95 ms",
            "range": "±53.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.30/267.90/312.10/312.10 ms avg=335.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.100000381469727,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.70/8.40/9.40 ms avg=5.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.399999618530273,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.70/8.40/9.40 ms avg=5.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 306.1000003814697,
            "unit": "median ms",
            "range": "±62.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.10/314.40/368.20/368.20 ms avg=400.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 368.19999980926514,
            "unit": "p95 ms",
            "range": "±62.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.10/314.40/368.20/368.20 ms avg=400.46 ms (7 runs sampled)"
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
        "date": 1637287499306,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.50/5.40 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.40000057220459,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.50/5.40 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±7.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.20/12.10/12.10 ms avg=6.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.100000381469727,
            "unit": "p95 ms",
            "range": "±7.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.20/12.10/12.10 ms avg=6.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.70/8.00/8.00 ms avg=6.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.70/8.00/8.00 ms avg=6.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.60000038146973,
            "unit": "median ms",
            "range": "±86.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/139.60/194.60/194.60 ms avg=151.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 194.60000038146973,
            "unit": "p95 ms",
            "range": "±86.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/139.60/194.60/194.60 ms avg=151.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.30000019073486,
            "unit": "median ms",
            "range": "±72.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/205.60/270.00/270.00 ms avg=258.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 270,
            "unit": "p95 ms",
            "range": "±72.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.30/205.60/270.00/270.00 ms avg=258.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.9000005722046,
            "unit": "median ms",
            "range": "±54.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.90/265.10/313.90/313.90 ms avg=334.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 313.8999996185303,
            "unit": "p95 ms",
            "range": "±54.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.90/265.10/313.90/313.90 ms avg=334.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.09999942779541,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.60/8.50/9.30 ms avg=4.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.60/8.50/9.30 ms avg=4.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.69999980926514,
            "unit": "median ms",
            "range": "±60.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.70/317.40/371.20/371.20 ms avg=403.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 371.19999980926514,
            "unit": "p95 ms",
            "range": "±60.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.70/317.40/371.20/371.20 ms avg=403.66 ms (7 runs sampled)"
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
        "date": 1637304500491,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.60/6.40 ms avg=3.40 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.40000057220459,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.60/6.40 ms avg=3.40 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.20/7.40/7.40 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.20/7.40/7.40 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.40000057220459,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.10/8.20/8.20 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.199999809265137,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.10/8.20/8.20 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.39999961853027,
            "unit": "median ms",
            "range": "±35.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.40/114.20/144.20/144.20 ms avg=141.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 144.19999980926514,
            "unit": "p95 ms",
            "range": "±35.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.40/114.20/144.20/144.20 ms avg=141.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204.10000038146973,
            "unit": "median ms",
            "range": "±66.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.10/208.70/270.50/270.50 ms avg=263.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 270.5,
            "unit": "p95 ms",
            "range": "±66.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.10/208.70/270.50/270.50 ms avg=263.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 264.19999980926514,
            "unit": "median ms",
            "range": "±62.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.20/310.20/326.90/326.90 ms avg=344.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 326.9000005722046,
            "unit": "p95 ms",
            "range": "±62.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.20/310.20/326.90/326.90 ms avg=344.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4.09999942779541,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.80/9.00/10.20 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 10.199999809265137,
            "unit": "p95 ms",
            "range": "±6.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.10/5.80/9.00/10.20 ms avg=4.99 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 302.8999996185303,
            "unit": "median ms",
            "range": "±68.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.90/321.20/371.20/371.20 ms avg=399.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 371.20000076293945,
            "unit": "p95 ms",
            "range": "±68.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.90/321.20/371.20/371.20 ms avg=399.31 ms (7 runs sampled)"
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
        "date": 1637353344380,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.20/8.00 ms avg=3.33 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.00/4.20/8.00 ms avg=3.33 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±8.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.50/12.90/12.90 ms avg=6.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.90000057220459,
            "unit": "p95 ms",
            "range": "±8.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.50/12.90/12.90 ms avg=6.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.40/7.50/7.50 ms avg=6.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.40/7.50/7.50 ms avg=6.84 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.59999942779541,
            "unit": "median ms",
            "range": "±45.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/113.10/154.20/154.20 ms avg=143.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 154.20000076293945,
            "unit": "p95 ms",
            "range": "±45.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/113.10/154.20/154.20 ms avg=143.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.39999961853027,
            "unit": "median ms",
            "range": "±63.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.40/217.00/266.10/266.10 ms avg=263.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 266.1000003814697,
            "unit": "p95 ms",
            "range": "±63.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.40/217.00/266.10/266.10 ms avg=263.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 257.30000019073486,
            "unit": "median ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=257.30/305.90/325.50/325.50 ms avg=342.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 325.5,
            "unit": "p95 ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=257.30/305.90/325.50/325.50 ms avg=342.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 4,
            "unit": "median ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/4.90/7.80/9.20 ms avg=4.91 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.199999809265137,
            "unit": "p95 ms",
            "range": "±5.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=4.00/4.90/7.80/9.20 ms avg=4.91 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 302,
            "unit": "median ms",
            "range": "±61.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.00/312.10/363.10/363.10 ms avg=395.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 363.1000003814697,
            "unit": "p95 ms",
            "range": "±61.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.00/312.10/363.10/363.10 ms avg=395.06 ms (7 runs sampled)"
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
        "date": 1637356495270,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.30/6.60 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.59999942779541,
            "unit": "p95 ms",
            "range": "±3.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.30/6.60 ms avg=3.36 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.30/7.30/7.30 ms avg=5.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.30/7.30/7.30 ms avg=5.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.10/8.30/8.30 ms avg=6.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.300000190734863,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.10/8.30/8.30 ms avg=6.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.5,
            "unit": "median ms",
            "range": "±90.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/142.50/200.70/200.70 ms avg=152.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 200.69999980926514,
            "unit": "p95 ms",
            "range": "±90.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/142.50/200.70/200.70 ms avg=152.63 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 199.20000076293945,
            "unit": "median ms",
            "range": "±77.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.20/208.70/276.90/276.90 ms avg=263.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 276.8999996185303,
            "unit": "p95 ms",
            "range": "±77.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.20/208.70/276.90/276.90 ms avg=263.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 256.0999994277954,
            "unit": "median ms",
            "range": "±69.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=256.10/310.80/325.20/325.20 ms avg=340.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 325.19999980926514,
            "unit": "p95 ms",
            "range": "±69.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=256.10/310.80/325.20/325.20 ms avg=340.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.8000001907348633,
            "unit": "median ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/4.90/8.40/9.30 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.300000190734863,
            "unit": "p95 ms",
            "range": "±5.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.80/4.90/8.40/9.30 ms avg=4.95 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 304.6000003814697,
            "unit": "median ms",
            "range": "±65.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.60/309.50/370.20/370.20 ms avg=397.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 370.19999980926514,
            "unit": "p95 ms",
            "range": "±65.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.60/309.50/370.20/370.20 ms avg=397.67 ms (7 runs sampled)"
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
        "date": 1637383570873,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.50/5.10 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.100000381469727,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.50/5.10 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.20/6.70/6.70 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.20/6.70/6.70 ms avg=5.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.90/8.10/8.10 ms avg=6.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.100000381469727,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.90/8.10/8.10 ms avg=6.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.89999961853027,
            "unit": "median ms",
            "range": "±88.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.90/136.90/199.30/199.30 ms avg=151.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 199.30000019073486,
            "unit": "p95 ms",
            "range": "±88.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.90/136.90/199.30/199.30 ms avg=151.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 191.80000019073486,
            "unit": "median ms",
            "range": "±78.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.80/208.90/270.70/270.70 ms avg=257.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 270.69999980926514,
            "unit": "p95 ms",
            "range": "±78.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.80/208.90/270.70/270.70 ms avg=257.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 246.10000038146973,
            "unit": "median ms",
            "range": "±89.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=246.10/262.30/335.10/335.10 ms avg=330.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 335.1000003814697,
            "unit": "p95 ms",
            "range": "±89.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=246.10/262.30/335.10/335.10 ms avg=330.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.00/7.10/7.90 ms avg=3.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.899999618530273,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.00/7.10/7.90 ms avg=3.97 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 302,
            "unit": "median ms",
            "range": "±64.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.00/324.80/366.70/366.70 ms avg=399.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 366.69999980926514,
            "unit": "p95 ms",
            "range": "±64.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.00/324.80/366.70/366.70 ms avg=399.69 ms (7 runs sampled)"
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
        "date": 1637607219911,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.30/6.50 ms avg=3.42 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±3.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.30/6.50 ms avg=3.42 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.59999942779541,
            "unit": "median ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/5.90/5.90 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.899999618530273,
            "unit": "p95 ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.50/5.90/5.90 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.10/8.80/8.80 ms avg=7.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.800000190734863,
            "unit": "p95 ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/8.10/8.80/8.80 ms avg=7.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.19999980926514,
            "unit": "median ms",
            "range": "±90.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.20/142.90/200.80/200.80 ms avg=153.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 200.79999923706055,
            "unit": "p95 ms",
            "range": "±90.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.20/142.90/200.80/200.80 ms avg=153.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 201.30000019073486,
            "unit": "median ms",
            "range": "±63.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.30/209.40/264.30/264.30 ms avg=261.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 264.30000019073486,
            "unit": "p95 ms",
            "range": "±63.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.30/209.40/264.30/264.30 ms avg=261.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.5,
            "unit": "median ms",
            "range": "±48.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.50/291.70/307.90/307.90 ms avg=337.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 307.8999996185303,
            "unit": "p95 ms",
            "range": "±48.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.50/291.70/307.90/307.90 ms avg=337.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.10/5.90/7.80 ms avg=4.00 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.10/5.90/7.80 ms avg=4.00 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 305.79999923706055,
            "unit": "median ms",
            "range": "±70.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.80/317.70/376.70/376.70 ms avg=403.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 376.70000076293945,
            "unit": "p95 ms",
            "range": "±70.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.80/317.70/376.70/376.70 ms avg=403.17 ms (7 runs sampled)"
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
        "date": 1637609539208,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.70/6.70 ms avg=3.37 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/4.70/6.70 ms avg=3.37 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.00/6.80/6.80 ms avg=6.04 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.800000190734863,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.00/6.80/6.80 ms avg=6.04 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.200000762939453,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.80/7.30/7.30 ms avg=6.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.80/7.30/7.30 ms avg=6.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.60000038146973,
            "unit": "median ms",
            "range": "±86.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.60/139.60/197.10/197.10 ms avg=152.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 197.10000038146973,
            "unit": "p95 ms",
            "range": "±86.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.60/139.60/197.10/197.10 ms avg=152.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 193.30000019073486,
            "unit": "median ms",
            "range": "±83.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=193.30/210.20/277.00/277.00 ms avg=257.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 277,
            "unit": "p95 ms",
            "range": "±83.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=193.30/210.20/277.00/277.00 ms avg=257.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 267.5999994277954,
            "unit": "median ms",
            "range": "±75.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.60/281.40/343.30/343.30 ms avg=343.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 343.30000019073486,
            "unit": "p95 ms",
            "range": "±75.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=267.60/281.40/343.30/343.30 ms avg=343.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.200000762939453,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.80/6.30/8.00 ms avg=4.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.80/6.30/8.00 ms avg=4.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 304.69999980926514,
            "unit": "median ms",
            "range": "±68.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.70/317.10/373.40/373.40 ms avg=402.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 373.3999996185303,
            "unit": "p95 ms",
            "range": "±68.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.70/317.10/373.40/373.40 ms avg=402.44 ms (7 runs sampled)"
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
        "date": 1637615611928,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±4.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.70/7.30 ms avg=3.44 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.299999237060547,
            "unit": "p95 ms",
            "range": "±4.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/4.70/7.30 ms avg=3.44 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.90/6.00/6.00 ms avg=5.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.90/6.00/6.00 ms avg=5.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.50/8.00/8.00 ms avg=6.73 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.8%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.50/8.00/8.00 ms avg=6.73 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.30000019073486,
            "unit": "median ms",
            "range": "±91.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.30/138.90/202.00/202.00 ms avg=152.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 202,
            "unit": "p95 ms",
            "range": "±91.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.30/138.90/202.00/202.00 ms avg=152.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 206,
            "unit": "median ms",
            "range": "±59.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.00/227.20/265.50/265.50 ms avg=265.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 265.5,
            "unit": "p95 ms",
            "range": "±59.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=206.00/227.20/265.50/265.50 ms avg=265.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 262.5,
            "unit": "median ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.50/289.40/306.20/306.20 ms avg=336.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 306.20000076293945,
            "unit": "p95 ms",
            "range": "±43.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.50/289.40/306.20/306.20 ms avg=336.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.10/6.30/7.90 ms avg=3.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.899999618530273,
            "unit": "p95 ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.10/6.30/7.90 ms avg=3.96 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310,
            "unit": "median ms",
            "range": "±70.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.00/328.50/380.40/380.40 ms avg=409.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 380.4000005722046,
            "unit": "p95 ms",
            "range": "±70.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.00/328.50/380.40/380.40 ms avg=409.76 ms (7 runs sampled)"
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
        "date": 1637621897134,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8999996185302734,
            "unit": "median ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/4.00/5.00/5.10 ms avg=3.47 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.100000381469727,
            "unit": "p95 ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/4.00/5.00/5.10 ms avg=3.47 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.80/6.90/6.90 ms avg=5.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.80/6.90/6.90 ms avg=5.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.399999618530273,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.20/7.00/7.00 ms avg=6.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.20/7.00/7.00 ms avg=6.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109.29999923706055,
            "unit": "median ms",
            "range": "±55.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.30/134.70/165.00/165.00 ms avg=147.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 165,
            "unit": "p95 ms",
            "range": "±55.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.30/134.70/165.00/165.00 ms avg=147.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.30000019073486,
            "unit": "median ms",
            "range": "±64.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.30/208.30/267.10/267.10 ms avg=261.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 267.1000003814697,
            "unit": "p95 ms",
            "range": "±64.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.30/208.30/267.10/267.10 ms avg=261.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.6000003814697,
            "unit": "median ms",
            "range": "±52.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.60/266.40/312.00/312.00 ms avg=335.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 312,
            "unit": "p95 ms",
            "range": "±52.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.60/266.40/312.00/312.00 ms avg=335.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±5.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.10/7.80/8.80 ms avg=4.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8.800000190734863,
            "unit": "p95 ms",
            "range": "±5.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.10/7.80/8.80 ms avg=4.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 301.70000076293945,
            "unit": "median ms",
            "range": "±66.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.70/320.50/368.10/368.10 ms avg=399.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 368.1000003814697,
            "unit": "p95 ms",
            "range": "±66.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.70/320.50/368.10/368.10 ms avg=399.54 ms (7 runs sampled)"
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
        "date": 1637714601363,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/4.40/6.30 ms avg=3.32 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.299999237060547,
            "unit": "p95 ms",
            "range": "±3.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/4.40/6.30 ms avg=3.32 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.60/6.70/6.70 ms avg=5.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.60/6.70/6.70 ms avg=5.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.60/7.20/7.20 ms avg=6.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.199999809265137,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.60/7.20/7.20 ms avg=6.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 107.10000038146973,
            "unit": "median ms",
            "range": "±38.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.10/113.80/145.80/145.80 ms avg=141.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 145.80000019073486,
            "unit": "p95 ms",
            "range": "±38.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.10/113.80/145.80/145.80 ms avg=141.30 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 204.5,
            "unit": "median ms",
            "range": "±62.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/214.90/267.20/267.20 ms avg=263.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 267.20000076293945,
            "unit": "p95 ms",
            "range": "±62.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=204.50/214.90/267.20/267.20 ms avg=263.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 264.5,
            "unit": "median ms",
            "range": "±69.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.50/303.40/334.30/334.30 ms avg=344.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 334.30000019073486,
            "unit": "p95 ms",
            "range": "±69.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.50/303.40/334.30/334.30 ms avg=344.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.10/6.70/7.80 ms avg=3.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.10/6.70/7.80 ms avg=3.94 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 304.69999980926514,
            "unit": "median ms",
            "range": "±62.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.70/317.90/366.90/366.90 ms avg=398.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 366.8999996185303,
            "unit": "p95 ms",
            "range": "±62.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.70/317.90/366.90/366.90 ms avg=398.94 ms (7 runs sampled)"
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
        "date": 1638219725129,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8000001907348633,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.30/4.80/5.40 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.399999618530273,
            "unit": "p95 ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.30/4.80/5.40 ms avg=3.34 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.40/6.90/6.90 ms avg=5.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.40/6.90/6.90 ms avg=5.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.600000381469727,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/7.90/8.00/8.00 ms avg=7.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.60/7.90/8.00/8.00 ms avg=7.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109.5,
            "unit": "median ms",
            "range": "±39.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.50/115.20/149.00/149.00 ms avg=143.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 149,
            "unit": "p95 ms",
            "range": "±39.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.50/115.20/149.00/149.00 ms avg=143.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 208.9000005722046,
            "unit": "median ms",
            "range": "±59.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.90/215.10/268.30/268.30 ms avg=261.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 268.30000019073486,
            "unit": "p95 ms",
            "range": "±59.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=208.90/215.10/268.30/268.30 ms avg=261.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 260.5,
            "unit": "median ms",
            "range": "±77.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.50/306.90/337.90/337.90 ms avg=348.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 337.8999996185303,
            "unit": "p95 ms",
            "range": "±77.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=260.50/306.90/337.90/337.90 ms avg=348.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.299999237060547,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.50/6.60/8.00 ms avg=4.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.50/6.60/8.00 ms avg=4.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 308.30000019073486,
            "unit": "median ms",
            "range": "±60.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.30/318.70/369.10/369.10 ms avg=403.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 369.1000003814697,
            "unit": "p95 ms",
            "range": "±60.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.30/318.70/369.10/369.10 ms avg=403.06 ms (7 runs sampled)"
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
        "date": 1638222790807,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8999996185302734,
            "unit": "median ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.50/4.50/6.50 ms avg=3.48 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±3.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.50/4.50/6.50 ms avg=3.48 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.60/6.90/6.90 ms avg=5.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.60/6.90/6.90 ms avg=5.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.60/7.30/7.30 ms avg=6.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.299999237060547,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.60/7.30/7.30 ms avg=6.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110,
            "unit": "median ms",
            "range": "±43.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.00/115.00/153.50/153.50 ms avg=143.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 153.5,
            "unit": "p95 ms",
            "range": "±43.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.00/115.00/153.50/153.50 ms avg=143.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 205.70000076293945,
            "unit": "median ms",
            "range": "±65.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=205.70/221.10/270.80/270.80 ms avg=265.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 270.80000019073486,
            "unit": "p95 ms",
            "range": "±65.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=205.70/221.10/270.80/270.80 ms avg=265.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 255.39999961853027,
            "unit": "median ms",
            "range": "±49.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/290.80/304.90/304.90 ms avg=336.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 304.8999996185303,
            "unit": "p95 ms",
            "range": "±49.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/290.80/304.90/304.90 ms avg=336.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.50/6.50/8.00 ms avg=4.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.50/6.50/8.00 ms avg=4.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 309.4000005722046,
            "unit": "median ms",
            "range": "±64.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=309.40/328.50/373.80/373.80 ms avg=409.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 373.80000019073486,
            "unit": "p95 ms",
            "range": "±64.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=309.40/328.50/373.80/373.80 ms avg=409.39 ms (7 runs sampled)"
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
        "date": 1638223672318,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.70/7.10 ms avg=3.47 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.100000381469727,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.70/7.10 ms avg=3.47 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.10/6.70/6.70 ms avg=6.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.700000762939453,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/6.10/6.70/6.70 ms avg=6.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/6.60/7.70/7.70 ms avg=6.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.699999809265137,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/6.60/7.70/7.70 ms avg=6.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.5,
            "unit": "median ms",
            "range": "±85.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/144.50/195.50/195.50 ms avg=152.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 195.5,
            "unit": "p95 ms",
            "range": "±85.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/144.50/195.50/195.50 ms avg=152.79 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 201.80000019073486,
            "unit": "median ms",
            "range": "±98.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.80/217.90/299.90/299.90 ms avg=267.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 299.8999996185303,
            "unit": "p95 ms",
            "range": "±98.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.80/217.90/299.90/299.90 ms avg=267.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 258,
            "unit": "median ms",
            "range": "±52.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.00/292.80/310.00/310.00 ms avg=340.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 310,
            "unit": "p95 ms",
            "range": "±52.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=258.00/292.80/310.00/310.00 ms avg=340.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.200000762939453,
            "unit": "median ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.60/6.30/8.50 ms avg=4.08 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8.5,
            "unit": "p95 ms",
            "range": "±5.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.60/6.30/8.50 ms avg=4.08 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 306.69999980926514,
            "unit": "median ms",
            "range": "±65.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.70/323.30/372.20/372.20 ms avg=404.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 372.19999980926514,
            "unit": "p95 ms",
            "range": "±65.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.70/323.30/372.20/372.20 ms avg=404.59 ms (7 runs sampled)"
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
        "date": 1638224573836,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.50/5.40 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.399999618530273,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/4.50/5.40 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.40/6.80/6.80 ms avg=5.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.800000190734863,
            "unit": "p95 ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/5.40/6.80/6.80 ms avg=5.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.800000190734863,
            "unit": "median ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.80/7.50/9.80/9.80 ms avg=7.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 9.800000190734863,
            "unit": "p95 ms",
            "range": "±4.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.80/7.50/9.80/9.80 ms avg=7.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.90000057220459,
            "unit": "median ms",
            "range": "±75.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.90/114.90/184.10/184.10 ms avg=147.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 184.10000038146973,
            "unit": "p95 ms",
            "range": "±75.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.90/114.90/184.10/184.10 ms avg=147.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 198,
            "unit": "median ms",
            "range": "±77.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=198.00/210.80/275.90/275.90 ms avg=260.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 275.8999996185303,
            "unit": "p95 ms",
            "range": "±77.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=198.00/210.80/275.90/275.90 ms avg=260.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 266.29999923706055,
            "unit": "median ms",
            "range": "±49.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.30/273.50/315.70/315.70 ms avg=341.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 315.69999980926514,
            "unit": "p95 ms",
            "range": "±49.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.30/273.50/315.70/315.70 ms avg=341.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±6.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.40/7.10/9.20 ms avg=4.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 9.200000762939453,
            "unit": "p95 ms",
            "range": "±6.1%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.40/7.10/9.20 ms avg=4.06 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310,
            "unit": "median ms",
            "range": "±65.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.00/324.50/375.10/375.10 ms avg=407.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 375.1000003814697,
            "unit": "p95 ms",
            "range": "±65.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.00/324.50/375.10/375.10 ms avg=407.00 ms (7 runs sampled)"
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
        "date": 1638226315421,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.30/6.70 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±4.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/4.30/6.70 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.600000381469727,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/6.10/7.00/7.00 ms avg=6.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.60/6.10/7.00/7.00 ms avg=6.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.60/7.50/7.50 ms avg=6.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/6.60/7.50/7.50 ms avg=6.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.5,
            "unit": "median ms",
            "range": "±87.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/139.90/197.60/197.60 ms avg=152.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 197.5999994277954,
            "unit": "p95 ms",
            "range": "±87.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.50/139.90/197.60/197.60 ms avg=152.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 203.60000038146973,
            "unit": "median ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.60/215.20/275.20/275.20 ms avg=264.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 275.19999980926514,
            "unit": "p95 ms",
            "range": "±71.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.60/215.20/275.20/275.20 ms avg=264.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.3999996185303,
            "unit": "median ms",
            "range": "±65.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.40/308.00/325.00/325.00 ms avg=345.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 325,
            "unit": "p95 ms",
            "range": "±65.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.40/308.00/325.00/325.00 ms avg=345.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.20/6.00/8.00 ms avg=4.05 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.20/6.00/8.00 ms avg=4.05 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 306.80000019073486,
            "unit": "median ms",
            "range": "±73.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.80/317.50/380.50/380.50 ms avg=405.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 380.5,
            "unit": "p95 ms",
            "range": "±73.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.80/317.50/380.50/380.50 ms avg=405.09 ms (7 runs sampled)"
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
        "date": 1638227787329,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/6.40/7.30 ms avg=3.37 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±4.8%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/6.40/7.30 ms avg=3.37 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.899999618530273,
            "unit": "median ms",
            "range": "±7.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.60/12.20/12.20 ms avg=6.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12.199999809265137,
            "unit": "p95 ms",
            "range": "±7.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.60/12.20/12.20 ms avg=6.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.40000057220459,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/5.90/7.40/7.40 ms avg=6.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/5.90/7.40/7.40 ms avg=6.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.10000038146973,
            "unit": "median ms",
            "range": "±90.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/143.70/201.90/201.90 ms avg=154.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 201.9000005722046,
            "unit": "p95 ms",
            "range": "±90.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/143.70/201.90/201.90 ms avg=154.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 195.5,
            "unit": "median ms",
            "range": "±85.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=195.50/213.40/281.10/281.10 ms avg=262.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 281.0999994277954,
            "unit": "p95 ms",
            "range": "±85.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=195.50/213.40/281.10/281.10 ms avg=262.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 266,
            "unit": "median ms",
            "range": "±79.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.00/280.30/345.10/345.10 ms avg=343.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 345.1000003814697,
            "unit": "p95 ms",
            "range": "±79.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=266.00/280.30/345.10/345.10 ms avg=343.94 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/5.20/6.50/8.00 ms avg=4.03 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±4.8%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/5.20/6.50/8.00 ms avg=4.03 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 309,
            "unit": "median ms",
            "range": "±66.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=309.00/326.70/375.10/375.10 ms avg=407.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 375.0999994277954,
            "unit": "p95 ms",
            "range": "±66.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=309.00/326.70/375.10/375.10 ms avg=407.34 ms (7 runs sampled)"
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
        "date": 1638228788961,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/3.90/5.80 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.40/3.90/5.80 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.8999996185302734,
            "unit": "median ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.90/5.60/6.40/6.40 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.399999618530273,
            "unit": "p95 ms",
            "range": "±2.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.90/5.60/6.40/6.40 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.899999618530273,
            "unit": "median ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.60/6.60/6.60 ms avg=6.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.90/5.60/6.60/6.60 ms avg=6.39 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.30000019073486,
            "unit": "median ms",
            "range": "±84.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.30/114.70/192.50/192.50 ms avg=148.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 192.5,
            "unit": "p95 ms",
            "range": "±84.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.30/114.70/192.50/192.50 ms avg=148.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.4000005722046,
            "unit": "median ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.40/224.10/238.60/238.60 ms avg=253.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 238.60000038146973,
            "unit": "p95 ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.40/224.10/238.60/238.60 ms avg=253.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259,
            "unit": "median ms",
            "range": "±54.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.00/271.50/313.40/313.40 ms avg=334.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 313.3999996185303,
            "unit": "p95 ms",
            "range": "±54.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.00/271.50/313.40/313.40 ms avg=334.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/4.00/6.00/7.50 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/4.00/6.00/7.50 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 303.5,
            "unit": "median ms",
            "range": "±58.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.50/311.30/361.50/361.50 ms avg=398.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 361.5,
            "unit": "p95 ms",
            "range": "±58.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.50/311.30/361.50/361.50 ms avg=398.66 ms (7 runs sampled)"
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
        "date": 1638229636455,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.59999942779541,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.70/5.80 ms avg=3.13 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.70/5.80 ms avg=3.13 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.699999809265137,
            "unit": "median ms",
            "range": "±7.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/6.40/11.80/11.80 ms avg=6.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 11.800000190734863,
            "unit": "p95 ms",
            "range": "±7.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.70/6.40/11.80/11.80 ms avg=6.64 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.5,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.10/7.10/7.10 ms avg=6.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.100000381469727,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.10/7.10/7.10 ms avg=6.89 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108,
            "unit": "median ms",
            "range": "±87.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.00/133.70/195.20/195.20 ms avg=149.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 195.19999980926514,
            "unit": "p95 ms",
            "range": "±87.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.00/133.70/195.20/195.20 ms avg=149.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.70000076293945,
            "unit": "median ms",
            "range": "±62.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.70/209.40/265.20/265.20 ms avg=259.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 265.20000076293945,
            "unit": "p95 ms",
            "range": "±62.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.70/209.40/265.20/265.20 ms avg=259.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 263,
            "unit": "median ms",
            "range": "±62.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.00/296.30/325.40/325.40 ms avg=342.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 325.4000005722046,
            "unit": "p95 ms",
            "range": "±62.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=263.00/296.30/325.40/325.40 ms avg=342.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.90/5.40/7.40 ms avg=3.76 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.90/5.40/7.40 ms avg=3.76 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.0999994277954,
            "unit": "median ms",
            "range": "±49.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.10/318.20/359.80/359.80 ms avg=402.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359.80000019073486,
            "unit": "p95 ms",
            "range": "±49.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.10/318.20/359.80/359.80 ms avg=402.21 ms (7 runs sampled)"
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
        "date": 1638301777661,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.799999237060547,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.20/3.70/5.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.20/3.70/5.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±1.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.40/5.70/5.70 ms avg=5.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.700000762939453,
            "unit": "p95 ms",
            "range": "±1.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.40/5.70/5.70 ms avg=5.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±1.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.90/6.00/6.00 ms avg=6.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±1.2%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.90/6.00/6.00 ms avg=6.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.09999942779541,
            "unit": "median ms",
            "range": "±27.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/127.10/139.00/139.00 ms avg=146.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 139,
            "unit": "p95 ms",
            "range": "±27.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.10/127.10/139.00/139.00 ms avg=146.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 200.19999980926514,
            "unit": "median ms",
            "range": "±38.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.20/226.10/238.50/238.50 ms avg=253.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 238.5,
            "unit": "p95 ms",
            "range": "±38.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.20/226.10/238.50/238.50 ms avg=253.97 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 252.89999961853027,
            "unit": "median ms",
            "range": "±54.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=252.90/266.30/307.80/307.80 ms avg=330.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 307.80000019073486,
            "unit": "p95 ms",
            "range": "±54.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=252.90/266.30/307.80/307.80 ms avg=330.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.30/5.90/7.60 ms avg=3.87 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.600000381469727,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.30/5.90/7.60 ms avg=3.87 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 305.69999980926514,
            "unit": "median ms",
            "range": "±54.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.70/311.20/360.50/360.50 ms avg=399.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 360.5,
            "unit": "p95 ms",
            "range": "±54.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.70/311.20/360.50/360.50 ms avg=399.50 ms (7 runs sampled)"
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
        "date": 1638314726267,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/3.80/5.80 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.10/3.80/5.80 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.299999237060547,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/4.90/6.40/6.40 ms avg=5.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.399999618530273,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/4.90/6.40/6.40 ms avg=5.53 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.50/8.40/8.40 ms avg=6.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.399999618530273,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/6.50/8.40/8.40 ms avg=6.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.5,
            "unit": "median ms",
            "range": "±31.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/113.40/138.40/138.40 ms avg=139.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 138.39999961853027,
            "unit": "p95 ms",
            "range": "±31.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/113.40/138.40/138.40 ms avg=139.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 200.5,
            "unit": "median ms",
            "range": "±63.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.50/211.10/264.30/264.30 ms avg=259.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 264.30000019073486,
            "unit": "p95 ms",
            "range": "±63.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=200.50/211.10/264.30/264.30 ms avg=259.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 253.60000038146973,
            "unit": "median ms",
            "range": "±45.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=253.60/281.10/298.90/298.90 ms avg=333.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 298.9000005722046,
            "unit": "p95 ms",
            "range": "±45.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=253.60/281.10/298.90/298.90 ms avg=333.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/5.60/7.50 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/5.60/7.50 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 303,
            "unit": "median ms",
            "range": "±59.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.00/318.10/362.10/362.10 ms avg=398.50 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 362.0999994277954,
            "unit": "p95 ms",
            "range": "±59.1%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.00/318.10/362.10/362.10 ms avg=398.50 ms (7 runs sampled)"
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
        "date": 1638315036826,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.70 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.70 ms avg=3.22 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.80/6.40/6.40 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.40000057220459,
            "unit": "p95 ms",
            "range": "±2.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.80/6.40/6.40 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.5,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.50/7.50/7.50 ms avg=7.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.50/6.50/7.50/7.50 ms avg=7.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.09999942779541,
            "unit": "median ms",
            "range": "±30.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/129.70/140.40/140.40 ms avg=145.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 140.39999961853027,
            "unit": "p95 ms",
            "range": "±30.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.10/129.70/140.40/140.40 ms avg=145.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 199.80000019073486,
            "unit": "median ms",
            "range": "±36.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.80/227.10/236.10/236.10 ms avg=254.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 236.0999994277954,
            "unit": "p95 ms",
            "range": "±36.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.80/227.10/236.10/236.10 ms avg=254.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.69999980926514,
            "unit": "median ms",
            "range": "±51.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.70/275.90/311.20/311.20 ms avg=334.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 311.20000076293945,
            "unit": "p95 ms",
            "range": "±51.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.70/275.90/311.20/311.20 ms avg=334.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/6.40/7.50 ms avg=3.77 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/6.40/7.50 ms avg=3.77 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 305.1000003814697,
            "unit": "median ms",
            "range": "±53.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.10/321.60/359.00/359.00 ms avg=399.27 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359,
            "unit": "p95 ms",
            "range": "±53.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.10/321.60/359.00/359.00 ms avg=399.27 ms (7 runs sampled)"
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
        "date": 1638318003993,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8999996185302734,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.30/4.90/5.60 ms avg=3.32 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.600000381469727,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.30/4.90/5.60 ms avg=3.32 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.200000762939453,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.20/6.30/6.30 ms avg=5.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.300000190734863,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/5.20/6.30/6.30 ms avg=5.57 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±1.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.90/6.50/6.50 ms avg=6.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±1.5%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.90/6.50/6.50 ms avg=6.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.59999942779541,
            "unit": "median ms",
            "range": "±82.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.60/114.50/189.50/189.50 ms avg=146.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 189.5,
            "unit": "p95 ms",
            "range": "±82.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.60/114.50/189.50/189.50 ms avg=146.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 189.60000038146973,
            "unit": "median ms",
            "range": "±50.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=189.60/201.90/239.70/239.70 ms avg=248.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 239.69999980926514,
            "unit": "p95 ms",
            "range": "±50.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=189.60/201.90/239.70/239.70 ms avg=248.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 253.5,
            "unit": "median ms",
            "range": "±53.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=253.50/270.20/306.80/306.80 ms avg=332.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 306.79999923706055,
            "unit": "p95 ms",
            "range": "±53.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=253.50/270.20/306.80/306.80 ms avg=332.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.09999942779541,
            "unit": "median ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/6.10/7.30 ms avg=3.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/6.10/7.30 ms avg=3.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 304.4000005722046,
            "unit": "median ms",
            "range": "±54.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.40/320.90/359.10/359.10 ms avg=397.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359.0999994277954,
            "unit": "p95 ms",
            "range": "±54.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=304.40/320.90/359.10/359.10 ms avg=397.56 ms (7 runs sampled)"
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
        "date": 1638319418380,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/3.80/5.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.30/3.80/5.70 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.10/6.30/6.30 ms avg=5.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.299999237060547,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.10/6.30/6.30 ms avg=5.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.70/7.30/7.30 ms avg=6.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.70/7.30/7.30 ms avg=6.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.5,
            "unit": "median ms",
            "range": "±78.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/113.90/185.10/185.10 ms avg=145.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 185.0999994277954,
            "unit": "p95 ms",
            "range": "±78.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/113.90/185.10/185.10 ms avg=145.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 196.19999980926514,
            "unit": "median ms",
            "range": "±42.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.20/200.00/238.50/238.50 ms avg=250.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 238.5,
            "unit": "p95 ms",
            "range": "±42.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.20/200.00/238.50/238.50 ms avg=250.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 250.4000005722046,
            "unit": "median ms",
            "range": "±64.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=250.40/296.60/314.90/314.90 ms avg=334.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 314.8999996185303,
            "unit": "p95 ms",
            "range": "±64.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=250.40/296.60/314.90/314.90 ms avg=334.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.70/5.60/7.50 ms avg=3.74 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.70/5.60/7.50 ms avg=3.74 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 301.80000019073486,
            "unit": "median ms",
            "range": "±58.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.80/310.50/360.00/360.00 ms avg=396.20 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 360,
            "unit": "p95 ms",
            "range": "±58.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.80/310.50/360.00/360.00 ms avg=396.20 ms (7 runs sampled)"
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
        "date": 1638472423394,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.8000001907348633,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.40/4.70/5.70 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.80/3.40/4.70/5.70 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.100000381469727,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/5.10/5.70/5.70 ms avg=5.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/5.10/5.70/5.70 ms avg=5.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.80/7.60/7.60 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.59999942779541,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.80/7.60/7.60 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.70000076293945,
            "unit": "median ms",
            "range": "±77.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.70/132.30/183.70/183.70 ms avg=146.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 183.69999980926514,
            "unit": "p95 ms",
            "range": "±77.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.70/132.30/183.70/183.70 ms avg=146.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 199.39999961853027,
            "unit": "median ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.40/208.70/260.30/260.30 ms avg=258.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 260.30000019073486,
            "unit": "p95 ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=199.40/208.70/260.30/260.30 ms avg=258.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 252.5999994277954,
            "unit": "median ms",
            "range": "±65.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=252.60/298.40/318.40/318.40 ms avg=334.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 318.3999996185303,
            "unit": "p95 ms",
            "range": "±65.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=252.60/298.40/318.40/318.40 ms avg=334.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.40/5.50/7.50 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/4.40/5.50/7.50 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.6000003814697,
            "unit": "median ms",
            "range": "±45.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.60/320.00/355.90/355.90 ms avg=399.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 355.9000005722046,
            "unit": "p95 ms",
            "range": "±45.3%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.60/320.00/355.90/355.90 ms avg=399.49 ms (7 runs sampled)"
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
        "date": 1638474134188,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/3.80/5.90 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.899999618530273,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/3.80/5.90 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.00/5.80/5.80 ms avg=5.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.00/5.80/5.80 ms avg=5.70 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.100000381469727,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.60/7.20/7.20 ms avg=6.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.199999809265137,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.60/7.20/7.20 ms avg=6.44 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.59999942779541,
            "unit": "median ms",
            "range": "±74.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/121.10/183.00/183.00 ms avg=149.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 183,
            "unit": "p95 ms",
            "range": "±74.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/121.10/183.00/183.00 ms avg=149.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 196.30000019073486,
            "unit": "median ms",
            "range": "±46.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.30/202.70/242.50/242.50 ms avg=253.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 242.5,
            "unit": "p95 ms",
            "range": "±46.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.30/202.70/242.50/242.50 ms avg=253.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 259.0999994277954,
            "unit": "median ms",
            "range": "±39.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.10/278.90/298.20/298.20 ms avg=333.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 298.19999980926514,
            "unit": "p95 ms",
            "range": "±39.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=259.10/278.90/298.20/298.20 ms avg=333.96 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.00/5.70/7.60 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.600000381469727,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.00/5.70/7.60 ms avg=3.88 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 303,
            "unit": "median ms",
            "range": "±59.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.00/317.20/362.90/362.90 ms avg=399.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 362.8999996185303,
            "unit": "p95 ms",
            "range": "±59.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=303.00/317.20/362.90/362.90 ms avg=399.74 ms (7 runs sampled)"
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
        "date": 1638475329167,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.70/5.70 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.70/5.70 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.09999942779541,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/4.60/6.50/6.50 ms avg=5.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/4.60/6.50/6.50 ms avg=5.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.40/7.40 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.40/7.40 ms avg=6.81 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 108.60000038146973,
            "unit": "median ms",
            "range": "±80.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/117.70/189.50/189.50 ms avg=148.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 189.5,
            "unit": "p95 ms",
            "range": "±80.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=108.60/117.70/189.50/189.50 ms avg=148.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 194.69999980926514,
            "unit": "median ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=194.70/225.90/235.90/235.90 ms avg=251.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 235.89999961853027,
            "unit": "p95 ms",
            "range": "±41.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=194.70/225.90/235.90/235.90 ms avg=251.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 256.69999980926514,
            "unit": "median ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=256.70/270.70/317.60/317.60 ms avg=331.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 317.6000003814697,
            "unit": "p95 ms",
            "range": "±60.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=256.70/270.70/317.60/317.60 ms avg=331.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.200000762939453,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.90/5.70/7.60 ms avg=3.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.600000381469727,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.90/5.70/7.60 ms avg=3.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 307.3999996185303,
            "unit": "median ms",
            "range": "±57.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.40/332.00/365.00/365.00 ms avg=403.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 365,
            "unit": "p95 ms",
            "range": "±57.6%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.40/332.00/365.00/365.00 ms avg=403.37 ms (7 runs sampled)"
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
        "date": 1638491316569,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.5,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/3.70/5.80 ms avg=3.08 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/3.00/3.70/5.80 ms avg=3.08 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±1.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.30/5.70/5.70 ms avg=5.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.699999809265137,
            "unit": "p95 ms",
            "range": "±1.4%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.30/5.70/5.70 ms avg=5.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.60/6.50/6.50 ms avg=6.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.5,
            "unit": "p95 ms",
            "range": "±1.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.60/6.50/6.50 ms avg=6.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 107.5,
            "unit": "median ms",
            "range": "±76.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.50/138.30/184.30/184.30 ms avg=148.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 184.30000019073486,
            "unit": "p95 ms",
            "range": "±76.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.50/138.30/184.30/184.30 ms avg=148.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 195.39999961853027,
            "unit": "median ms",
            "range": "±67.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=195.40/209.90/262.80/262.80 ms avg=259.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 262.79999923706055,
            "unit": "p95 ms",
            "range": "±67.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=195.40/209.90/262.80/262.80 ms avg=259.51 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 255.4000005722046,
            "unit": "median ms",
            "range": "±44.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/283.40/299.40/299.40 ms avg=331.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 299.3999996185303,
            "unit": "p95 ms",
            "range": "±44.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/283.40/299.40/299.40 ms avg=331.90 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.60/5.70/7.50 ms avg=3.82 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.60/5.70/7.50 ms avg=3.82 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 302.3999996185303,
            "unit": "median ms",
            "range": "±56.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.40/314.20/359.10/359.10 ms avg=397.47 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359.1000003814697,
            "unit": "p95 ms",
            "range": "±56.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.40/314.20/359.10/359.10 ms avg=397.47 ms (7 runs sampled)"
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
        "date": 1638491655848,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.80 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.799999237060547,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.80 ms avg=3.24 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.299999237060547,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.60/6.20/6.20 ms avg=5.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.199999809265137,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.60/6.20/6.20 ms avg=5.69 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.90/7.70/7.70 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.699999809265137,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/5.90/7.70/7.70 ms avg=6.71 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.5,
            "unit": "median ms",
            "range": "±83.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.50/125.10/194.80/194.80 ms avg=154.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 194.80000019073486,
            "unit": "p95 ms",
            "range": "±83.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.50/125.10/194.80/194.80 ms avg=154.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 196.30000019073486,
            "unit": "median ms",
            "range": "±58.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.30/210.60/254.60/254.60 ms avg=260.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 254.60000038146973,
            "unit": "p95 ms",
            "range": "±58.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=196.30/210.60/254.60/254.60 ms avg=260.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 261.6000003814697,
            "unit": "median ms",
            "range": "±51.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.60/294.70/312.60/312.60 ms avg=345.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 312.5999994277954,
            "unit": "p95 ms",
            "range": "±51.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.60/294.70/312.60/312.60 ms avg=345.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.299999237060547,
            "unit": "median ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/3.90/6.00/7.90 ms avg=3.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.899999618530273,
            "unit": "p95 ms",
            "range": "±4.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/3.90/6.00/7.90 ms avg=3.98 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 316.1000003814697,
            "unit": "median ms",
            "range": "±60.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.10/327.10/377.00/377.00 ms avg=411.24 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 377,
            "unit": "p95 ms",
            "range": "±60.9%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=316.10/327.10/377.00/377.00 ms avg=411.24 ms (7 runs sampled)"
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
        "date": 1638830433727,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.70 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.700000762939453,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.20/3.60/5.70 ms avg=3.21 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.00/5.90/5.90 ms avg=5.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.899999618530273,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.00/5.90/5.90 ms avg=5.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.00/7.00 ms avg=6.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.00/7.00 ms avg=6.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109,
            "unit": "median ms",
            "range": "±35.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.00/112.20/144.50/144.50 ms avg=143.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 144.5,
            "unit": "p95 ms",
            "range": "±35.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.00/112.20/144.50/144.50 ms avg=143.31 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 202.30000019073486,
            "unit": "median ms",
            "range": "±60.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.30/211.00/263.10/263.10 ms avg=259.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 263.1000003814697,
            "unit": "p95 ms",
            "range": "±60.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=202.30/211.00/263.10/263.10 ms avg=259.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 255.30000019073486,
            "unit": "median ms",
            "range": "±71.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.30/298.70/327.20/327.20 ms avg=339.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 327.19999980926514,
            "unit": "p95 ms",
            "range": "±71.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.30/298.70/327.20/327.20 ms avg=339.34 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/5.60/7.60 ms avg=3.82 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.59999942779541,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/5.60/7.60 ms avg=3.82 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 308.5,
            "unit": "median ms",
            "range": "±50.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.50/323.10/358.50/358.50 ms avg=399.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 358.5,
            "unit": "p95 ms",
            "range": "±50.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=308.50/323.10/358.50/358.50 ms avg=399.17 ms (7 runs sampled)"
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
        "date": 1638905695888,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/3.60/5.80 ms avg=3.17 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.799999237060547,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/3.60/5.80 ms avg=3.17 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/6.00/6.60/6.60 ms avg=5.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/6.00/6.60/6.60 ms avg=5.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.30/7.30 ms avg=6.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.300000190734863,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/5.80/7.30/7.30 ms avg=6.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.19999980926514,
            "unit": "median ms",
            "range": "±40.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.20/111.60/146.80/146.80 ms avg=140.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 146.80000019073486,
            "unit": "p95 ms",
            "range": "±40.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.20/111.60/146.80/146.80 ms avg=140.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 205.5,
            "unit": "median ms",
            "range": "±60.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=205.50/211.30/265.50/265.50 ms avg=260.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 265.5,
            "unit": "p95 ms",
            "range": "±60.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=205.50/211.30/265.50/265.50 ms avg=260.23 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 262.80000019073486,
            "unit": "median ms",
            "range": "±64.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.80/301.70/327.40/327.40 ms avg=344.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 327.3999996185303,
            "unit": "p95 ms",
            "range": "±64.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.80/301.70/327.40/327.40 ms avg=344.09 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.40/5.60/7.60 ms avg=3.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.59999942779541,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.40/5.60/7.60 ms avg=3.89 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.5,
            "unit": "median ms",
            "range": "±57.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.50/317.30/368.20/368.20 ms avg=404.33 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 368.19999980926514,
            "unit": "p95 ms",
            "range": "±57.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.50/317.30/368.20/368.20 ms avg=404.33 ms (7 runs sampled)"
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
        "date": 1638920133981,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/3.60/5.60 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.600000381469727,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.20/3.60/5.60 ms avg=3.25 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.40000057220459,
            "unit": "median ms",
            "range": "±1.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.40/5.60/5.60 ms avg=5.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.600000381469727,
            "unit": "p95 ms",
            "range": "±1.2%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/5.40/5.60/5.60 ms avg=5.46 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.199999809265137,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.70/7.20/7.20 ms avg=6.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.199999809265137,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.20/5.70/7.20/7.20 ms avg=6.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 107.89999961853027,
            "unit": "median ms",
            "range": "±81.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.90/135.80/189.50/189.50 ms avg=148.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 189.5,
            "unit": "p95 ms",
            "range": "±81.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.90/135.80/189.50/189.50 ms avg=148.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 203.5999994277954,
            "unit": "median ms",
            "range": "±58.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.60/209.60/261.90/261.90 ms avg=256.40 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 261.8999996185303,
            "unit": "p95 ms",
            "range": "±58.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=203.60/209.60/261.90/261.90 ms avg=256.40 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 251.70000076293945,
            "unit": "median ms",
            "range": "±70.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=251.70/298.90/322.50/322.50 ms avg=336.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 322.5,
            "unit": "p95 ms",
            "range": "±70.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=251.70/298.90/322.50/322.50 ms avg=336.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.10/5.50/7.80 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.10/5.50/7.80 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 306.5,
            "unit": "median ms",
            "range": "±54.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.50/323.90/360.90/360.90 ms avg=399.37 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 360.9000005722046,
            "unit": "p95 ms",
            "range": "±54.4%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=306.50/323.90/360.90/360.90 ms avg=399.37 ms (7 runs sampled)"
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
        "date": 1638922014591,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.30/3.60/5.90 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.90000057220459,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.30/3.60/5.90 ms avg=3.28 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.399999618530273,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/4.90/6.30/6.30 ms avg=5.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.300000190734863,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.40/4.90/6.30/6.30 ms avg=5.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.09999942779541,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.50/7.00/7.00 ms avg=6.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.10/5.50/7.00/7.00 ms avg=6.59 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 110.40000057220459,
            "unit": "median ms",
            "range": "±71.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.40/124.60/181.60/181.60 ms avg=152.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 181.5999994277954,
            "unit": "p95 ms",
            "range": "±71.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=110.40/124.60/181.60/181.60 ms avg=152.11 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.20000076293945,
            "unit": "median ms",
            "range": "±41.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.20/225.30/239.00/239.00 ms avg=255.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 239,
            "unit": "p95 ms",
            "range": "±41.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.20/225.30/239.00/239.00 ms avg=255.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 254.20000076293945,
            "unit": "median ms",
            "range": "±76.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=254.20/273.50/330.20/330.20 ms avg=335.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 330.19999980926514,
            "unit": "p95 ms",
            "range": "±76.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=254.20/273.50/330.20/330.20 ms avg=335.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.09999942779541,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/5.70/7.50 ms avg=3.83 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.80/5.70/7.50 ms avg=3.83 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 301.6000003814697,
            "unit": "median ms",
            "range": "±62.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.60/313.70/364.10/364.10 ms avg=397.61 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 364.0999994277954,
            "unit": "p95 ms",
            "range": "±62.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=301.60/313.70/364.10/364.10 ms avg=397.61 ms (7 runs sampled)"
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
        "date": 1638923141537,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/3.70/5.80 ms avg=3.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/3.70/5.80 ms avg=3.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.300000190734863,
            "unit": "median ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.70/6.30/6.30 ms avg=5.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.300000190734863,
            "unit": "p95 ms",
            "range": "±2.0%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.30/5.70/6.30/6.30 ms avg=5.66 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/6.30/7.10/7.10 ms avg=6.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.100000381469727,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.00/6.30/7.10/7.10 ms avg=6.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 111.5,
            "unit": "median ms",
            "range": "±28.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.50/129.70/139.60/139.60 ms avg=145.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 139.5999994277954,
            "unit": "p95 ms",
            "range": "±28.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=111.50/129.70/139.60/139.60 ms avg=145.99 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 190,
            "unit": "median ms",
            "range": "±50.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=190.00/225.60/240.70/240.70 ms avg=255.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 240.69999980926514,
            "unit": "p95 ms",
            "range": "±50.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=190.00/225.60/240.70/240.70 ms avg=255.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 264.80000019073486,
            "unit": "median ms",
            "range": "±45.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.80/269.80/310.60/310.60 ms avg=336.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 310.6000003814697,
            "unit": "p95 ms",
            "range": "±45.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=264.80/269.80/310.60/310.60 ms avg=336.54 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.200000762939453,
            "unit": "median ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.70/6.00/7.40 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.40000057220459,
            "unit": "p95 ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.70/6.00/7.40 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 307.69999980926514,
            "unit": "median ms",
            "range": "±51.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.70/317.60/358.70/358.70 ms avg=400.07 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 358.69999980926514,
            "unit": "p95 ms",
            "range": "±51.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.70/317.60/358.70/358.70 ms avg=400.07 ms (7 runs sampled)"
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
        "date": 1639079106683,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.59999942779541,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.80/5.50 ms avg=3.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.5,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/3.00/3.80/5.50 ms avg=3.09 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4,
            "unit": "median ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.00/5.00/5.80/5.80 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.799999237060547,
            "unit": "p95 ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.00/5.00/5.80/5.80 ms avg=5.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.300000190734863,
            "unit": "median ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.20/6.90/6.90 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.899999618530273,
            "unit": "p95 ms",
            "range": "±1.6%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.30/6.20/6.90/6.90 ms avg=6.74 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 109.5,
            "unit": "median ms",
            "range": "±80.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.50/112.20/189.60/189.60 ms avg=148.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 189.5999994277954,
            "unit": "p95 ms",
            "range": "±80.1%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=109.50/112.20/189.60/189.60 ms avg=148.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 201.5,
            "unit": "median ms",
            "range": "±26.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.50/206.40/228.20/228.20 ms avg=250.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 228.19999980926514,
            "unit": "p95 ms",
            "range": "±26.7%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=201.50/206.40/228.20/228.20 ms avg=250.29 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 249.10000038146973,
            "unit": "median ms",
            "range": "±87.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=249.10/262.30/336.50/336.50 ms avg=333.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 336.5,
            "unit": "p95 ms",
            "range": "±87.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=249.10/262.30/336.50/336.50 ms avg=333.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.70/5.60/7.60 ms avg=3.87 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.59999942779541,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.70/5.60/7.60 ms avg=3.87 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.30000019073486,
            "unit": "median ms",
            "range": "±54.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.30/329.60/364.80/364.80 ms avg=404.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 364.79999923706055,
            "unit": "p95 ms",
            "range": "±54.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.30/329.60/364.80/364.80 ms avg=404.19 ms (7 runs sampled)"
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
        "date": 1639166121064,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.90000057220459,
            "unit": "median ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.60/5.40/5.80 ms avg=3.50 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±2.9%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/3.60/5.40/5.80 ms avg=3.50 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.30/6.60/6.60 ms avg=5.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.30/6.60/6.60 ms avg=5.83 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.399999618530273,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.60/7.50/7.50 ms avg=7.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.40/6.60/7.50/7.50 ms avg=7.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 105.90000057220459,
            "unit": "median ms",
            "range": "±79.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.90/119.10/185.10/185.10 ms avg=145.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 185.10000038146973,
            "unit": "p95 ms",
            "range": "±79.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.90/119.10/185.10/185.10 ms avg=145.26 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 193.79999923706055,
            "unit": "median ms",
            "range": "±70.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=193.80/203.60/264.70/264.70 ms avg=257.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 264.69999980926514,
            "unit": "p95 ms",
            "range": "±70.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=193.80/203.60/264.70/264.70 ms avg=257.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 251.30000019073486,
            "unit": "median ms",
            "range": "±74.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=251.30/304.00/326.10/326.10 ms avg=338.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 326.0999994277954,
            "unit": "p95 ms",
            "range": "±74.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=251.30/304.00/326.10/326.10 ms avg=338.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/7.30/7.40 ms avg=3.86 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±4.2%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/7.30/7.40 ms avg=3.86 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 310.80000019073486,
            "unit": "median ms",
            "range": "±48.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.80/315.60/359.50/359.50 ms avg=399.40 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359.5,
            "unit": "p95 ms",
            "range": "±48.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=310.80/315.60/359.50/359.50 ms avg=399.40 ms (7 runs sampled)"
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
        "date": 1639168693703,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6000003814697266,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/4.00/5.90 ms avg=3.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.899999618530273,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.60/2.90/4.00/5.90 ms avg=3.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.00/6.60/6.60 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.59999942779541,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/5.00/6.60/6.60 ms avg=5.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.699999809265137,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.70/6.50/8.00/8.00 ms avg=7.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.70/6.50/8.00/8.00 ms avg=7.10 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 105.90000057220459,
            "unit": "median ms",
            "range": "±32.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.90/113.50/138.30/138.30 ms avg=138.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 138.29999923706055,
            "unit": "p95 ms",
            "range": "±32.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.90/113.50/138.30/138.30 ms avg=138.76 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 189.80000019073486,
            "unit": "median ms",
            "range": "±73.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=189.80/207.10/262.80/262.80 ms avg=252.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 262.79999923706055,
            "unit": "p95 ms",
            "range": "±73.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=189.80/207.10/262.80/262.80 ms avg=252.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 243.69999980926514,
            "unit": "median ms",
            "range": "±84.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=243.70/263.30/328.10/328.10 ms avg=327.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 328.1000003814697,
            "unit": "p95 ms",
            "range": "±84.4%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=243.70/263.30/328.10/328.10 ms avg=327.00 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.70/6.50/7.50 ms avg=3.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.00/3.70/6.50/7.50 ms avg=3.72 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 302.69999980926514,
            "unit": "median ms",
            "range": "±57.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.70/316.10/359.90/359.90 ms avg=396.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 359.9000005722046,
            "unit": "p95 ms",
            "range": "±57.2%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=302.70/316.10/359.90/359.90 ms avg=396.87 ms (7 runs sampled)"
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
        "date": 1639171956911,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/3.80/5.90 ms avg=3.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.90000057220459,
            "unit": "p95 ms",
            "range": "±3.2%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.10/3.80/5.90 ms avg=3.19 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.5,
            "unit": "median ms",
            "range": "±7.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/8.80/12.00/12.00 ms avg=7.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 12,
            "unit": "p95 ms",
            "range": "±7.5%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.50/8.80/12.00/12.00 ms avg=7.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 6.09999942779541,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.10/7.00/8.40/8.40 ms avg=7.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8.399999618530273,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.10/7.00/8.40/8.40 ms avg=7.36 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.5,
            "unit": "median ms",
            "range": "±80.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/130.00/187.40/187.40 ms avg=147.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 187.39999961853027,
            "unit": "p95 ms",
            "range": "±80.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.50/130.00/187.40/187.40 ms avg=147.41 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 190.19999980926514,
            "unit": "median ms",
            "range": "±71.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=190.20/201.90/261.40/261.40 ms avg=253.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 261.3999996185303,
            "unit": "p95 ms",
            "range": "±71.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=190.20/201.90/261.40/261.40 ms avg=253.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 261.5,
            "unit": "median ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.50/266.70/329.70/329.70 ms avg=334.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 329.69999980926514,
            "unit": "p95 ms",
            "range": "±68.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=261.50/266.70/329.70/329.70 ms avg=334.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.200000762939453,
            "unit": "median ms",
            "range": "±5.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.20/7.50/8.80 ms avg=4.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 8.800000190734863,
            "unit": "p95 ms",
            "range": "±5.6%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/4.20/7.50/8.80 ms avg=4.01 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 307.19999980926514,
            "unit": "median ms",
            "range": "±55.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.20/312.80/362.90/362.90 ms avg=400.87 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 362.8999996185303,
            "unit": "p95 ms",
            "range": "±55.7%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=307.20/312.80/362.90/362.90 ms avg=400.87 ms (7 runs sampled)"
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
        "date": 1639172772108,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.700000762939453,
            "unit": "median ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.60/3.80/6.00 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6,
            "unit": "p95 ms",
            "range": "±3.3%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.60/3.80/6.00 ms avg=3.38 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.80/6.70/6.70 ms avg=6.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.699999809265137,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.80/6.70/6.70 ms avg=6.14 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 6.59999942779541,
            "unit": "median ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.60/7.10/7.70/7.70 ms avg=7.40 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 7.699999809265137,
            "unit": "p95 ms",
            "range": "±1.9%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=6.60/7.10/7.70/7.70 ms avg=7.40 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 107,
            "unit": "median ms",
            "range": "±35.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.00/112.60/142.00/142.00 ms avg=141.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 142,
            "unit": "p95 ms",
            "range": "±35.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=107.00/112.60/142.00/142.00 ms avg=141.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 191.60000038146973,
            "unit": "median ms",
            "range": "±76.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.60/210.70/267.80/267.80 ms avg=256.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 267.79999923706055,
            "unit": "p95 ms",
            "range": "±76.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=191.60/210.70/267.80/267.80 ms avg=256.60 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 262.0999994277954,
            "unit": "median ms",
            "range": "±73.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.10/271.60/335.90/335.90 ms avg=339.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 335.8999996185303,
            "unit": "p95 ms",
            "range": "±73.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=262.10/271.60/335.90/335.90 ms avg=339.80 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/6.40/7.60 ms avg=3.81 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.600000381469727,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.20/3.80/6.40/7.60 ms avg=3.81 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 313,
            "unit": "median ms",
            "range": "±54.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.00/323.00/367.50/367.50 ms avg=409.56 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 367.5,
            "unit": "p95 ms",
            "range": "±54.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=313.00/323.00/367.50/367.50 ms avg=409.56 ms (7 runs sampled)"
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
        "date": 1639173991121,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 2.6999998092651367,
            "unit": "median ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.50/3.70/5.80 ms avg=3.30 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.800000190734863,
            "unit": "p95 ms",
            "range": "±3.1%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/3.50/3.70/5.80 ms avg=3.30 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.800000190734863,
            "unit": "median ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.50/6.60/6.60 ms avg=6.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.80/5.50/6.60/6.60 ms avg=6.01 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 5.90000057220459,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.90/6.40/8.00/8.00 ms avg=7.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 8,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=5.90/6.40/8.00/8.00 ms avg=7.43 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 106.60000038146973,
            "unit": "median ms",
            "range": "±48.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.60/140.80/155.40/155.40 ms avg=147.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 155.39999961853027,
            "unit": "p95 ms",
            "range": "±48.8%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.60/140.80/155.40/155.40 ms avg=147.17 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 197.0999994277954,
            "unit": "median ms",
            "range": "±61.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.10/225.80/259.00/259.00 ms avg=257.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 259,
            "unit": "p95 ms",
            "range": "±61.9%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=197.10/225.80/259.00/259.00 ms avg=257.86 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 255.4000005722046,
            "unit": "median ms",
            "range": "±48.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/300.00/303.60/303.60 ms avg=333.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 303.6000003814697,
            "unit": "p95 ms",
            "range": "±48.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=255.40/300.00/303.60/303.60 ms avg=333.91 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.09999942779541,
            "unit": "median ms",
            "range": "±4.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.90/6.50/7.40 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.399999618530273,
            "unit": "p95 ms",
            "range": "±4.3%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/3.90/6.50/7.40 ms avg=3.78 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 305.9000005722046,
            "unit": "median ms",
            "range": "±51.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.90/313.50/357.70/357.70 ms avg=397.04 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 357.69999980926514,
            "unit": "p95 ms",
            "range": "±51.8%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=305.90/313.50/357.70/357.70 ms avg=397.04 ms (7 runs sampled)"
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
        "date": 1639178155887,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 1.6000003814697266,
            "unit": "median ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.00/3.80/4.20 ms avg=2.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 4.199999809265137,
            "unit": "p95 ms",
            "range": "±2.6%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.00/3.80/4.20 ms avg=2.02 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.59999942779541,
            "unit": "median ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/5.00/5.40/5.40 ms avg=4.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.40000057220459,
            "unit": "p95 ms",
            "range": "±1.8%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.60/5.00/5.40/5.40 ms avg=4.67 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.90/6.60/6.60 ms avg=5.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.600000381469727,
            "unit": "p95 ms",
            "range": "±2.4%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.90/6.60/6.60 ms avg=5.21 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 44,
            "unit": "median ms",
            "range": "±55.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=44.00/94.60/99.50/99.50 ms avg=64.02 ms (8 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 99.5,
            "unit": "p95 ms",
            "range": "±55.5%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=44.00/94.60/99.50/99.50 ms avg=64.02 ms (8 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 95.19999980926514,
            "unit": "median ms",
            "range": "±74.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=95.20/113.60/169.20/169.20 ms avg=130.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 169.19999980926514,
            "unit": "p95 ms",
            "range": "±74.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=95.20/113.60/169.20/169.20 ms avg=130.13 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 114.90000057220459,
            "unit": "median ms",
            "range": "±43.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=114.90/126.80/158.20/158.20 ms avg=150.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 158.19999980926514,
            "unit": "p95 ms",
            "range": "±43.3%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=114.90/126.80/158.20/158.20 ms avg=150.77 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/5.10/7.50/7.80 ms avg=4.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±4.5%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.30/5.10/7.50/7.80 ms avg=4.07 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 250.5,
            "unit": "median ms",
            "range": "±37.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=250.50/284.40/287.50/287.50 ms avg=321.93 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 287.5,
            "unit": "p95 ms",
            "range": "±37.0%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=250.50/284.40/287.50/287.50 ms avg=321.93 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 1.6000003814697266,
            "unit": "median ms",
            "range": "±2.5%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.80/2.10/4.10 ms avg=1.89 ms (19 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 4.09999942779541,
            "unit": "p95 ms",
            "range": "±2.5%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.80/2.10/4.10 ms avg=1.89 ms (19 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.3000001907348633,
            "unit": "median ms",
            "range": "±15.9%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/5.30/19.20/19.20 ms avg=6.50 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 19.199999809265137,
            "unit": "p95 ms",
            "range": "±15.9%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.30/5.30/19.20/19.20 ms avg=6.50 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.8000001907348633,
            "unit": "median ms",
            "range": "±2.1%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.80/4.70/5.90/5.90 ms avg=5.10 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.899999618530273,
            "unit": "p95 ms",
            "range": "±2.1%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.80/4.70/5.90/5.90 ms avg=5.10 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 44.69999980926514,
            "unit": "median ms",
            "range": "±73.4%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=44.70/91.70/118.10/118.10 ms avg=66.20 ms (8 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 0) p95",
            "value": 118.09999942779541,
            "unit": "p95 ms",
            "range": "±73.4%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=44.70/91.70/118.10/118.10 ms avg=66.20 ms (8 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 97.10000038146973,
            "unit": "median ms",
            "range": "±58.5%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=97.10/108.00/155.60/155.60 ms avg=128.14 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1) p95",
            "value": 155.5999994277954,
            "unit": "p95 ms",
            "range": "±58.5%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=97.10/108.00/155.60/155.60 ms avg=128.14 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 117,
            "unit": "median ms",
            "range": "±44.2%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=117.00/126.20/161.20/161.20 ms avg=153.41 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2) p95",
            "value": 161.19999980926514,
            "unit": "p95 ms",
            "range": "±44.2%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=117.00/126.20/161.20/161.20 ms avg=153.41 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 3.1000003814697266,
            "unit": "median ms",
            "range": "±4.4%",
            "extra": "scan 1024x1000 50/75/90/95%=3.10/4.30/7.40/7.50 ms avg=3.93 ms (19 runs sampled)"
          },
          {
            "name": "scan 1024x1000 p95",
            "value": 7.5,
            "unit": "p95 ms",
            "range": "±4.4%",
            "extra": "scan 1024x1000 50/75/90/95%=3.10/4.30/7.40/7.50 ms avg=3.93 ms (19 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 243.5999994277954,
            "unit": "median ms",
            "range": "±63.0%",
            "extra": "create index 1024x5000 50/75/90/95%=243.60/279.50/306.60/306.60 ms avg=325.17 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000 p95",
            "value": 306.6000003814697,
            "unit": "p95 ms",
            "range": "±63.0%",
            "extra": "create index 1024x5000 50/75/90/95%=243.60/279.50/306.60/306.60 ms avg=325.17 ms (7 runs sampled)"
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
        "date": 1639178728480,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 1.5999994277954102,
            "unit": "median ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.90/3.90/4.30 ms avg=2.03 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 4.300000190734863,
            "unit": "p95 ms",
            "range": "±2.7%",
            "extra": "[MemStore] writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/1.90/3.90/4.30 ms avg=2.03 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.09999942779541,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/3.70/5.40/5.40 ms avg=4.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.399999618530273,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "[MemStore] writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/3.70/5.40/5.40 ms avg=4.19 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4.199999809265137,
            "unit": "median ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.50/5.90/5.90 ms avg=5.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 5.90000057220459,
            "unit": "p95 ms",
            "range": "±1.7%",
            "extra": "[MemStore] writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.20/4.50/5.90/5.90 ms avg=5.16 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0)",
            "value": 39.90000057220459,
            "unit": "median ms",
            "range": "±55.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=39.90/43.10/94.90/94.90 ms avg=59.06 ms (9 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 0) p95",
            "value": 94.89999961853027,
            "unit": "p95 ms",
            "range": "±55.0%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=39.90/43.10/94.90/94.90 ms avg=59.06 ms (9 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1)",
            "value": 95.70000076293945,
            "unit": "median ms",
            "range": "±74.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=95.70/104.30/170.30/170.30 ms avg=130.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 1) p95",
            "value": 170.30000019073486,
            "unit": "p95 ms",
            "range": "±74.6%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=95.70/104.30/170.30/170.30 ms avg=130.06 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2)",
            "value": 111.59999942779541,
            "unit": "median ms",
            "range": "±48.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=111.60/128.70/159.80/159.80 ms avg=150.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] populate 1024x1000 (clean, indexes: 2) p95",
            "value": 159.79999923706055,
            "unit": "p95 ms",
            "range": "±48.2%",
            "extra": "[MemStore] populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=111.60/128.70/159.80/159.80 ms avg=150.49 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000",
            "value": 3.09999942779541,
            "unit": "median ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.80/7.40/7.80 ms avg=4.05 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] scan 1024x1000 p95",
            "value": 7.800000190734863,
            "unit": "p95 ms",
            "range": "±4.7%",
            "extra": "[MemStore] scan 1024x1000 50/75/90/95%=3.10/4.80/7.40/7.80 ms avg=4.05 ms (19 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000",
            "value": 244.69999980926514,
            "unit": "median ms",
            "range": "±60.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=244.70/283.00/305.20/305.20 ms avg=324.03 ms (7 runs sampled)"
          },
          {
            "name": "[MemStore] create index 1024x5000 p95",
            "value": 305.19999980926514,
            "unit": "p95 ms",
            "range": "±60.5%",
            "extra": "[MemStore] create index 1024x5000 50/75/90/95%=244.70/283.00/305.20/305.20 ms avg=324.03 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub",
            "value": 1.6000003814697266,
            "unit": "median ms",
            "range": "±3.0%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.10/3.30/4.60 ms avg=2.02 ms (19 runs sampled)"
          },
          {
            "name": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 4.600000381469727,
            "unit": "p95 ms",
            "range": "±3.0%",
            "extra": "writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.10/3.30/4.60 ms avg=2.02 ms (19 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 4,
            "unit": "median ms",
            "range": "±13.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.00/5.80/17.40/17.40 ms avg=6.49 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 17.40000057220459,
            "unit": "p95 ms",
            "range": "±13.4%",
            "extra": "writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.00/5.80/17.40/17.40 ms avg=6.49 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub",
            "value": 3.8000001907348633,
            "unit": "median ms",
            "range": "±2.3%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.80/4.50/6.10/6.10 ms avg=4.93 ms (7 runs sampled)"
          },
          {
            "name": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95",
            "value": 6.100000381469727,
            "unit": "p95 ms",
            "range": "±2.3%",
            "extra": "writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.80/4.50/6.10/6.10 ms avg=4.93 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 0)",
            "value": 45.20000076293945,
            "unit": "median ms",
            "range": "±73.3%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=45.20/93.20/118.50/118.50 ms avg=66.55 ms (8 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 0) p95",
            "value": 118.5,
            "unit": "p95 ms",
            "range": "±73.3%",
            "extra": "populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=45.20/93.20/118.50/118.50 ms avg=66.55 ms (8 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1)",
            "value": 93.5,
            "unit": "median ms",
            "range": "±75.1%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=93.50/104.60/168.60/168.60 ms avg=125.90 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 1) p95",
            "value": 168.60000038146973,
            "unit": "p95 ms",
            "range": "±75.1%",
            "extra": "populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=93.50/104.60/168.60/168.60 ms avg=125.90 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2)",
            "value": 124.5,
            "unit": "median ms",
            "range": "±30.6%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=124.50/128.20/155.10/155.10 ms avg=153.57 ms (7 runs sampled)"
          },
          {
            "name": "populate 1024x1000 (clean, indexes: 2) p95",
            "value": 155.0999994277954,
            "unit": "p95 ms",
            "range": "±30.6%",
            "extra": "populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=124.50/128.20/155.10/155.10 ms avg=153.57 ms (7 runs sampled)"
          },
          {
            "name": "scan 1024x1000",
            "value": 3.1999998092651367,
            "unit": "median ms",
            "range": "±9.6%",
            "extra": "scan 1024x1000 50/75/90/95%=3.20/4.00/6.00/12.80 ms avg=4.14 ms (19 runs sampled)"
          },
          {
            "name": "scan 1024x1000 p95",
            "value": 12.800000190734863,
            "unit": "p95 ms",
            "range": "±9.6%",
            "extra": "scan 1024x1000 50/75/90/95%=3.20/4.00/6.00/12.80 ms avg=4.14 ms (19 runs sampled)"
          },
          {
            "name": "create index 1024x5000",
            "value": 243.30000019073486,
            "unit": "median ms",
            "range": "±61.4%",
            "extra": "create index 1024x5000 50/75/90/95%=243.30/273.50/304.70/304.70 ms avg=322.27 ms (7 runs sampled)"
          },
          {
            "name": "create index 1024x5000 p95",
            "value": 304.69999980926514,
            "unit": "p95 ms",
            "range": "±61.4%",
            "extra": "create index 1024x5000 50/75/90/95%=243.30/273.50/304.70/304.70 ms avg=322.27 ms (7 runs sampled)"
          }
        ]
      }
    ]
  }
}