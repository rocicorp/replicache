window.BENCHMARK_DATA = {
  "lastUpdate": 1601071640780,
  "repoUrl": "https://github.com/rocicorp/replicache-sdk-js",
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
          "id": "f6cdb06550c6a6af7e45d5171faa4a2e9bb2bb68",
          "message": "Benchmark test Again (#113)\n\n* Add performance CI\r\n\r\nhttps://medium.com/@thomaspoignant/ci-build-performance-testing-with-github-action-e6b227097c83\r\nhttps://github.com/marketplace/actions/continuous-benchmark\r\n\r\nWe have a custom runner that uses Playwright. This used `sample/perf` as a\r\nbase for the new perfomance test. It outputs format that looks similar\r\nenough to BenchmarkJS to allow the Github Action to extract the data.\r\n\r\nThe data is `git push`ed to the `dev-data` branch. We display the data\r\nusing https://raw.githack.com/\r\n\r\nFixes https://github.com/rocicorp/repc/issues/178",
          "timestamp": "2020-09-25T14:16:15-07:00",
          "tree_id": "e3cc0a4e94d542c64f97f5771b3b1d9b80bc0f4e",
          "url": "https://github.com/rocicorp/replicache-sdk-js/commit/f6cdb06550c6a6af7e45d5171faa4a2e9bb2bb68"
        },
        "date": 1601068683104,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean)",
            "value": 1.16,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "populate 1024x1000 (dirty)",
            "value": 892.86,
            "range": "±0.0%",
            "unit": "KB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 13.75,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 13.6,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
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
          "id": "c8204ffbdb62f904bb0721f0cf56a854184d3889",
          "message": "Remove dummy file",
          "timestamp": "2020-09-25T11:17:38-10:00",
          "tree_id": "27bd1bfc0e6d7d8ea8a2676a081bfc63636c9016",
          "url": "https://github.com/rocicorp/replicache-sdk-js/commit/c8204ffbdb62f904bb0721f0cf56a854184d3889"
        },
        "date": 1601068882523,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean)",
            "value": 1.17,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "populate 1024x1000 (dirty)",
            "value": 812.35,
            "range": "±0.0%",
            "unit": "KB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 12.06,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 12.12,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
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
          "id": "147fbe062e89966e7a33bf715e630c8af516a25e",
          "message": "Remove sample/perf (#117)\n\nThe same code is now in perf/",
          "timestamp": "2020-09-25T12:05:31-10:00",
          "tree_id": "bd3d28f52c7cfa743caf66a9636f797f426172ba",
          "url": "https://github.com/rocicorp/replicache-sdk-js/commit/147fbe062e89966e7a33bf715e630c8af516a25e"
        },
        "date": 1601071638810,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "populate 1024x1000 (clean)",
            "value": 1.32,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "populate 1024x1000 (dirty)",
            "value": 1.05,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x1000",
            "value": 14.36,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          },
          {
            "name": "scan 1024x5000",
            "value": 14.24,
            "range": "±0.0%",
            "unit": "MB/s",
            "extra": "0 samples"
          }
        ]
      }
    ]
  }
}
