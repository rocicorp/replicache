const m1_min_8kb_max_16kb_run1 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.7999999970197678,
    range: '±0.5%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/1.00/1.00/1.30 ms avg=0.86 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 1.2999999970197678,
    range: '±0.5%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/1.00/1.00/1.30 ms avg=0.86 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.9000000059604645,
    range: '±2.4%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.50/3.30 ms avg=1.15 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.2999999970197678,
    range: '±2.4%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.50/3.30 ms avg=1.15 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.300000011920929,
    range: '±2.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/2.10/3.60/3.60 ms avg=2.03 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.5999999940395355,
    range: '±2.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/2.10/3.60/3.60 ms avg=2.03 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5999999940395355,
    range: '±9.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/3.10/11.50/11.50 ms avg=3.46 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 11.5,
    range: '±9.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/3.10/11.50/11.50 ms avg=3.46 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 106.90000000596046,
    range: '±21.1%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.90/108.00/128.00/128.00 ms avg=130.71 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 128,
    range: '±21.1%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.90/108.00/128.00/128.00 ms avg=130.71 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 26.399999991059303,
    range: '±8.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=26.40/28.70/34.30/34.40 ms avg=30.59 ms (17 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 34.3999999910593,
    range: '±8.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=26.40/28.70/34.30/34.40 ms avg=30.59 ms (17 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 37.099999994039536,
    range: '±34.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.10/39.50/44.20/71.10 ms avg=47.06 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 71.1000000089407,
    range: '±34.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.10/39.50/44.20/71.10 ms avg=47.06 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 186.20000000298023,
    range: '±20.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=186.20/203.60/206.20/206.20 ms avg=239.86 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 206.20000000298023,
    range: '±20.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=186.20/203.60/206.20/206.20 ms avg=239.86 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 243.5,
    range: '±32.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=243.50/249.30/276.10/276.10 ms avg=316.93 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 276.09999999403954,
    range: '±32.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=243.50/249.30/276.10/276.10 ms avg=316.93 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 346.29999999701977,
    range: '±42.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=346.30/363.90/389.00/389.00 ms avg=451.93 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 389,
    range: '±42.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=346.30/363.90/389.00/389.00 ms avg=451.93 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.199999988079071,
    range: '±1.7%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.20/1.60/2.60/2.90 ms avg=1.52 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 2.8999999910593033,
    range: '±1.7%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.20/1.60/2.60/2.90 ms avg=1.52 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 11,
    range: '±11.1%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.00/11.30/13.40/22.10 ms avg=12.84 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 22.099999994039536,
    range: '±11.1%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.00/11.30/13.40/22.10 ms avg=12.84 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 46.29999999701977,
    range: '±14.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=46.30/48.00/60.50/60.50 ms avg=57.40 ms (9 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 60.5,
    range: '±14.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=46.30/48.00/60.50/60.50 ms avg=57.40 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 47.3999999910593,
    range: '±45.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=47.40/50.90/93.10/93.10 ms avg=56.37 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 93.09999999403954,
    range: '±45.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=47.40/50.90/93.10/93.10 ms avg=56.37 ms (9 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 14.200000002980232,
    range: '±45.4%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=14.20/30.50/57.70/59.60 ms avg=21.49 ms (19 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 59.6000000089407,
    range: '±45.4%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=14.20/30.50/57.70/59.60 ms avg=21.49 ms (19 runs sampled)',
  },
];

const m1_min_8kb_max_16kb_run2 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.7999999970197678,
    range: '±1.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.70/2.50 ms avg=1.03 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.5,
    range: '±1.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.70/2.50 ms avg=1.03 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.9000000059604645,
    range: '±2.2%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/2.20/3.10 ms avg=1.19 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.0999999940395355,
    range: '±2.2%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/2.20/3.10 ms avg=1.19 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5,
    range: '±0.4%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.70/1.90/1.90 ms avg=1.81 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 1.8999999910593033,
    range: '±0.4%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/1.70/1.90/1.90 ms avg=1.81 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5,
    range: '±10.0%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/3.10/11.50/11.50 ms avg=3.46 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 11.5,
    range: '±10.0%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/3.10/11.50/11.50 ms avg=3.46 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 105.1000000089407,
    range: '±22.9%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.10/112.30/128.00/128.00 ms avg=129.24 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 128,
    range: '±22.9%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.10/112.30/128.00/128.00 ms avg=129.24 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 28,
    range: '±6.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=28.00/30.10/32.60/34.40 ms avg=31.41 ms (16 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 34.400000005960464,
    range: '±6.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=28.00/30.10/32.60/34.40 ms avg=31.41 ms (16 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 37.20000000298023,
    range: '±8.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.20/40.20/45.00/45.70 ms avg=44.39 ms (12 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 45.70000000298023,
    range: '±8.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.20/40.20/45.00/45.70 ms avg=44.39 ms (12 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 204.20000000298023,
    range: '±30.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=204.20/205.90/231.30/231.30 ms avg=247.80 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 231.29999999701977,
    range: '±30.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=204.20/205.90/231.30/231.30 ms avg=247.80 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 240.5,
    range: '±33.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=240.50/250.00/273.80/273.80 ms avg=315.13 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 273.79999999701977,
    range: '±33.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=240.50/250.00/273.80/273.80 ms avg=315.13 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 351.1000000089407,
    range: '±42.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=351.10/363.00/393.70/393.70 ms avg=458.67 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 393.70000000298023,
    range: '±42.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=351.10/363.00/393.70/393.70 ms avg=458.67 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.0999999940395355,
    range: '±1.9%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.10/1.60/2.90/3.00 ms avg=1.54 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 3,
    range: '±1.9%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.10/1.60/2.90/3.00 ms avg=1.54 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 11,
    range: '±11.0%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.00/11.20/13.30/22.00 ms avg=12.83 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 22,
    range: '±11.0%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.00/11.20/13.30/22.00 ms avg=12.83 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 45.099999994039536,
    range: '±16.7%',
    extra:
      'create index 1024x5000 50/75/90/95%=45.10/45.50/61.80/61.80 ms avg=57.22 ms (9 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 61.79999999701977,
    range: '±16.7%',
    extra:
      'create index 1024x5000 50/75/90/95%=45.10/45.50/61.80/61.80 ms avg=57.22 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 57.1000000089407,
    range: '±30.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=57.10/70.30/88.00/88.00 ms avg=64.70 ms (8 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 88,
    range: '±30.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=57.10/70.30/88.00/88.00 ms avg=64.70 ms (8 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 26.600000008940697,
    range: '±36.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=26.60/39.00/53.40/62.70 ms avg=28.02 ms (18 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 62.70000000298023,
    range: '±36.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=26.60/39.00/53.40/62.70 ms avg=28.02 ms (18 runs sampled)',
  },
];

const m1_min_8kb_max_16kb_run3 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.800000011920929,
    range: '±0.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.50/1.50 ms avg=0.96 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 1.5,
    range: '±0.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.50/1.50 ms avg=0.96 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.8999999910593033,
    range: '±2.2%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.00/1.30/3.10 ms avg=1.09 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.1000000089406967,
    range: '±2.2%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.00/1.30/3.10 ms avg=1.09 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2000000029802322,
    range: '±0.6%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/1.70/1.80/1.80 ms avg=1.67 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 1.7999999970197678,
    range: '±0.6%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/1.70/1.80/1.80 ms avg=1.67 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5999999940395355,
    range: '±9.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/3.40/11.50/11.50 ms avg=3.77 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 11.5,
    range: '±9.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/3.40/11.50/11.50 ms avg=3.77 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 104.69999998807907,
    range: '±63.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=104.70/108.60/167.70/167.70 ms avg=136.26 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 167.70000000298023,
    range: '±63.0%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=104.70/108.60/167.70/167.70 ms avg=136.26 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 28,
    range: '±4.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=28.00/29.40/32.30/32.50 ms avg=31.14 ms (17 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 32.5,
    range: '±4.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=28.00/29.40/32.30/32.50 ms avg=31.14 ms (17 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 37.599999994039536,
    range: '±8.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.60/42.20/44.40/45.80 ms avg=44.88 ms (12 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 45.79999999701977,
    range: '±8.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=37.60/42.20/44.40/45.80 ms avg=44.88 ms (12 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 201.1000000089407,
    range: '±23.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=201.10/213.10/224.60/224.60 ms avg=251.27 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 224.6000000089407,
    range: '±23.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=201.10/213.10/224.60/224.60 ms avg=251.27 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 242.09999999403954,
    range: '±45.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=242.10/247.50/287.70/287.70 ms avg=317.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 287.70000000298023,
    range: '±45.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=242.10/247.50/287.70/287.70 ms avg=317.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 347.79999999701977,
    range: '±42.4%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=347.80/366.10/390.20/390.20 ms avg=453.87 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 390.20000000298023,
    range: '±42.4%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=347.80/366.10/390.20/390.20 ms avg=453.87 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.2000000029802322,
    range: '±2.0%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.20/1.60/2.90/3.20 ms avg=1.53 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 3.2000000029802322,
    range: '±2.0%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.20/1.60/2.90/3.20 ms avg=1.53 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 11.200000002980232,
    range: '±11.0%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.20/11.50/13.50/22.20 ms avg=12.98 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 22.200000002980232,
    range: '±11.0%',
    extra:
      'scan 1024x10000 50/75/90/95%=11.20/11.50/13.50/22.20 ms avg=12.98 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 45,
    range: '±16.1%',
    extra:
      'create index 1024x5000 50/75/90/95%=45.00/46.70/61.10/61.10 ms avg=57.01 ms (9 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 61.1000000089407,
    range: '±16.1%',
    extra:
      'create index 1024x5000 50/75/90/95%=45.00/46.70/61.10/61.10 ms avg=57.01 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 48,
    range: '±25.5%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=48.00/67.80/73.50/73.50 ms avg=57.31 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 73.5,
    range: '±25.5%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=48.00/67.80/73.50/73.50 ms avg=57.31 ms (9 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 10.5,
    range: '±50.9%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=10.50/27.60/52.10/61.40 ms avg=19.71 ms (19 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 61.400000005960464,
    range: '±50.9%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=10.50/27.60/52.10/61.40 ms avg=19.71 ms (19 runs sampled)',
  },
];

const m1_min_4kb_max_8kb_run1 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.9000000059604645,
    range: '±1.4%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.20/2.30 ms avg=1.02 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.2999999970197678,
    range: '±1.4%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.20/2.30 ms avg=1.02 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.7999999970197678,
    range: '±1.6%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.40/2.40 ms avg=0.98 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.4000000059604645,
    range: '±1.6%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.40/2.40 ms avg=0.98 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2000000029802322,
    range: '±1.4%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/2.50/2.60/2.60 ms avg=1.79 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.5999999940395355,
    range: '±1.4%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/2.50/2.60/2.60 ms avg=1.79 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.4000000059604645,
    range: '±12.5%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/5.30/13.90/13.90 ms avg=4.00 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 13.900000005960464,
    range: '±12.5%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/5.30/13.90/13.90 ms avg=4.00 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 105.70000000298023,
    range: '±6.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.70/106.80/112.30/112.30 ms avg=126.31 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 112.29999999701977,
    range: '±6.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=105.70/106.80/112.30/112.30 ms avg=126.31 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 30.899999991059303,
    range: '±6.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=30.90/31.50/36.40/37.20 ms avg=35.77 ms (14 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 37.19999998807907,
    range: '±6.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=30.90/31.50/36.40/37.20 ms avg=35.77 ms (14 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 39,
    range: '±11.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=39.00/41.90/46.30/50.80 ms avg=47.26 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 50.79999999701977,
    range: '±11.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=39.00/41.90/46.30/50.80 ms avg=47.26 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 186.6000000089407,
    range: '±24.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=186.60/200.60/209.50/209.50 ms avg=231.59 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 209.5,
    range: '±24.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=186.60/200.60/209.50/209.50 ms avg=231.59 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 236.40000000596046,
    range: '±39.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=236.40/250.90/275.60/275.60 ms avg=309.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 275.59999999403954,
    range: '±39.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=236.40/250.90/275.60/275.60 ms avg=309.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 349.90000000596046,
    range: '±54.9%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=349.90/360.70/404.80/404.80 ms avg=457.51 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 404.79999999701977,
    range: '±54.9%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=349.90/360.70/404.80/404.80 ms avg=457.51 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.3999999910593033,
    range: '±2.3%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.90/2.90/3.70 ms avg=1.74 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 3.7000000029802322,
    range: '±2.3%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.90/2.90/3.70 ms avg=1.74 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 12.299999997019768,
    range: '±10.9%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.30/12.70/15.40/23.20 ms avg=14.35 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 23.200000002980232,
    range: '±10.9%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.30/12.70/15.40/23.20 ms avg=14.35 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 50.70000000298023,
    range: '±16.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.70/55.00/66.90/66.90 ms avg=65.47 ms (8 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 66.90000000596046,
    range: '±16.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.70/55.00/66.90/66.90 ms avg=65.47 ms (8 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 35.70000000298023,
    range: '±58.4%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=35.70/69.60/94.10/94.10 ms avg=58.29 ms (9 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 94.1000000089407,
    range: '±58.4%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=35.70/69.60/94.10/94.10 ms avg=58.29 ms (9 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 18.399999991059303,
    range: '±54.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=18.40/30.70/56.60/72.50 ms avg=24.77 ms (19 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 72.5,
    range: '±54.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=18.40/30.70/56.60/72.50 ms avg=24.77 ms (19 runs sampled)',
  },
];

const m1_min_4kb_max_8kb_run2 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.9000000059604645,
    range: '±1.2%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.60/2.10 ms avg=1.03 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.0999999940395355,
    range: '±1.2%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.60/2.10 ms avg=1.03 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.7999999970197678,
    range: '±1.5%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.40/2.30 ms avg=0.99 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.300000011920929,
    range: '±1.5%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/1.40/2.30 ms avg=0.99 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.4000000059604645,
    range: '±1.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.90/2.70/2.70 ms avg=1.83 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.7000000029802322,
    range: '±1.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/1.90/2.70/2.70 ms avg=1.83 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2999999970197678,
    range: '±12.2%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/2.80/13.50/13.50 ms avg=3.59 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 13.5,
    range: '±12.2%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/2.80/13.50/13.50 ms avg=3.59 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 115.70000000298023,
    range: '±36.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.70/128.50/152.50/152.50 ms avg=137.44 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 152.5,
    range: '±36.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=115.70/128.50/152.50/152.50 ms avg=137.44 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 30.900000005960464,
    range: '±5.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=30.90/32.20/35.00/36.10 ms avg=35.15 ms (15 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 36.099999994039536,
    range: '±5.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=30.90/32.20/35.00/36.10 ms avg=35.15 ms (15 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 38.20000000298023,
    range: '±14.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=38.20/39.80/47.20/52.60 ms avg=47.05 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 52.599999994039536,
    range: '±14.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=38.20/39.80/47.20/52.60 ms avg=47.05 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 187.1000000089407,
    range: '±15.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=187.10/192.10/202.70/202.70 ms avg=234.76 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 202.70000000298023,
    range: '±15.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=187.10/192.10/202.70/202.70 ms avg=234.76 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 234.29999999701977,
    range: '±35.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=234.30/248.20/269.50/269.50 ms avg=306.36 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 269.5,
    range: '±35.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=234.30/248.20/269.50/269.50 ms avg=306.36 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 355.8999999910593,
    range: '±46.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=355.90/359.80/402.40/402.40 ms avg=457.74 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 402.40000000596046,
    range: '±46.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=355.90/359.80/402.40/402.40 ms avg=457.74 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.4000000059604645,
    range: '±2.0%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.80/3.20/3.40 ms avg=1.76 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 3.4000000059604645,
    range: '±2.0%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.80/3.20/3.40 ms avg=1.76 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 12.200000002980232,
    range: '±11.2%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.20/12.50/14.80/23.40 ms avg=14.23 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 23.400000005960464,
    range: '±11.2%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.20/12.50/14.80/23.40 ms avg=14.23 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 50.70000000298023,
    range: '±15.7%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.70/53.20/66.40/66.40 ms avg=65.20 ms (8 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 66.3999999910593,
    range: '±15.7%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.70/53.20/66.40/66.40 ms avg=65.20 ms (8 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 69.09999999403954,
    range: '±44.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=69.10/92.80/113.80/113.80 ms avg=78.09 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 113.79999999701977,
    range: '±44.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=69.10/92.80/113.80/113.80 ms avg=78.09 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 18.80000001192093,
    range: '±37.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=18.80/20.90/37.50/56.50 ms avg=21.87 ms (19 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 56.5,
    range: '±37.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=18.80/20.90/37.50/56.50 ms avg=21.87 ms (19 runs sampled)',
  },
];
const m1_min_4kb_max_8kb_run3 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.8999999910593033,
    range: '±1.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.20/2.50 ms avg=1.06 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.5,
    range: '±1.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.90/1.10/1.20/2.50 ms avg=1.06 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 0.7999999970197678,
    range: '±1.9%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/2.50/2.70 ms avg=1.04 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.7000000029802322,
    range: '±1.9%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=0.80/0.90/2.50/2.70 ms avg=1.04 ms (17 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1,
    range: '±1.5%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.70/2.50/2.50 ms avg=1.60 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.5,
    range: '±1.5%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.70/2.50/2.50 ms avg=1.60 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.4000000059604645,
    range: '±8.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/5.40/10.30/10.30 ms avg=3.56 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 10.299999997019768,
    range: '±8.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/5.40/10.30/10.30 ms avg=3.56 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 106,
    range: '±21.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.00/108.30/111.00/111.00 ms avg=121.61 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 111,
    range: '±21.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=106.00/108.30/111.00/111.00 ms avg=121.61 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 29.900000005960464,
    range: '±14.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=29.90/32.90/39.00/44.10 ms avg=35.14 ms (15 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 44.099999994039536,
    range: '±14.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=29.90/32.90/39.00/44.10 ms avg=35.14 ms (15 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 38.70000000298023,
    range: '±14.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=38.70/39.90/46.90/52.90 ms avg=47.35 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 52.900000005960464,
    range: '±14.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=38.70/39.90/46.90/52.90 ms avg=47.35 ms (11 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 166.5,
    range: '±30.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=166.50/188.90/196.50/196.50 ms avg=217.63 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 196.5,
    range: '±30.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=166.50/188.90/196.50/196.50 ms avg=217.63 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 234.20000000298023,
    range: '±38.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=234.20/249.60/272.70/272.70 ms avg=308.80 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 272.70000000298023,
    range: '±38.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=234.20/249.60/272.70/272.70 ms avg=308.80 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 350,
    range: '±51.4%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=350.00/361.60/401.40/401.40 ms avg=456.91 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 401.40000000596046,
    range: '±51.4%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=350.00/361.60/401.40/401.40 ms avg=456.91 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 1.3999999910593033,
    range: '±2.8%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.70/4.10/4.20 ms avg=1.85 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 4.200000002980232,
    range: '±2.8%',
    extra:
      'scan 1024x1000 50/75/90/95%=1.40/1.70/4.10/4.20 ms avg=1.85 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 12.399999991059303,
    range: '±10.7%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.40/12.60/14.90/23.10 ms avg=14.27 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 23.099999994039536,
    range: '±10.7%',
    extra:
      'scan 1024x10000 50/75/90/95%=12.40/12.60/14.90/23.10 ms avg=14.27 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 50.599999994039536,
    range: '±15.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.60/53.50/66.50/66.50 ms avg=65.07 ms (8 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 66.5,
    range: '±15.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=50.60/53.50/66.50/66.50 ms avg=65.07 ms (8 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 55.79999999701977,
    range: '±40.8%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=55.80/73.10/96.60/96.60 ms avg=63.10 ms (8 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 96.59999999403954,
    range: '±40.8%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=55.80/73.10/96.60/96.60 ms avg=63.10 ms (8 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 19.5,
    range: '±54.3%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=19.50/22.10/52.20/73.80 ms avg=23.85 ms (19 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 73.79999999701977,
    range: '±54.3%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=19.50/22.10/52.20/73.80 ms avg=23.85 ms (19 runs sampled)',
  },
];

const macpro_min_8kb_max_16kb_run1 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.0999999998603016,
    range: '±6.9%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.10/1.70/2.90/8.00 ms avg=1.75 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 8,
    range: '±6.9%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.10/1.70/2.90/8.00 ms avg=1.75 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.6999999999534339,
    range: '±8.3%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.70/2.40/7.50/10.00 ms avg=2.82 ms (16 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 10,
    range: '±8.3%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.70/2.40/7.50/10.00 ms avg=2.82 ms (16 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 3.4000000001396984,
    range: '±5.0%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.30/8.40/8.40 ms avg=4.81 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 8.400000000139698,
    range: '±5.0%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.40/4.30/8.40/8.40 ms avg=4.81 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 3.1000000000931323,
    range: '±17.2%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/6.80/20.30/20.30 ms avg=6.66 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 20.299999999813735,
    range: '±17.2%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/6.80/20.30/20.30 ms avg=6.66 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 64.29999999981374,
    range: '±50.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=64.30/83.80/114.90/114.90 ms avg=87.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 114.89999999990687,
    range: '±50.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=64.30/83.80/114.90/114.90 ms avg=87.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 58.699999999953434,
    range: '±47.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=58.70/78.80/106.50/106.50 ms avg=76.66 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 106.5,
    range: '±47.8%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=58.70/78.80/106.50/106.50 ms avg=76.66 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 74.30000000004657,
    range: '±92.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=74.30/100.90/166.60/166.60 ms avg=106.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 166.60000000009313,
    range: '±92.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=74.30/100.90/166.60/166.60 ms avg=106.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 281.5,
    range: '±84.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=281.50/311.40/365.70/365.70 ms avg=370.09 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 365.69999999995343,
    range: '±84.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=281.50/311.40/365.70/365.70 ms avg=370.09 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 581.5,
    range: '±146.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=581.50/619.00/728.00/728.00 ms avg=774.37 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 728,
    range: '±146.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=581.50/619.00/728.00/728.00 ms avg=774.37 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 852.8000000000466,
    range: '±117.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=852.80/911.10/970.30/970.30 ms avg=1107.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 970.3000000000466,
    range: '±117.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=852.80/911.10/970.30/970.30 ms avg=1107.30 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 2.6000000000931323,
    range: '±16.3%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.60/3.50/10.00/18.90 ms avg=4.42 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 18.899999999906868,
    range: '±16.3%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.60/3.50/10.00/18.90 ms avg=4.42 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 23.600000000093132,
    range: '±20.8%',
    extra:
      'scan 1024x10000 50/75/90/95%=23.60/25.50/28.70/44.40 ms avg=28.06 ms (18 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 44.39999999990687,
    range: '±20.8%',
    extra:
      'scan 1024x10000 50/75/90/95%=23.60/25.50/28.70/44.40 ms avg=28.06 ms (18 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 114.4000000001397,
    range: '±56.0%',
    extra:
      'create index 1024x5000 50/75/90/95%=114.40/156.90/170.40/170.40 ms avg=159.87 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 170.4000000001397,
    range: '±56.0%',
    extra:
      'create index 1024x5000 50/75/90/95%=114.40/156.90/170.40/170.40 ms avg=159.87 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 130.5,
    range: '±34.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=130.50/142.30/165.40/165.40 ms avg=167.41 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 165.4000000001397,
    range: '±34.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=130.50/142.30/165.40/165.40 ms avg=167.41 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 33.200000000186265,
    range: '±36.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=33.20/37.70/40.20/69.90 ms avg=40.03 ms (13 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 69.89999999990687,
    range: '±36.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=33.20/37.70/40.20/69.90 ms avg=40.03 ms (13 runs sampled)',
  },
];

const macpro_min_8kb_max_16kb_run2 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1,
    range: '±2.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.60/2.90/3.70 ms avg=1.45 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.699999999953434,
    range: '±2.7%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.00/1.60/2.90/3.70 ms avg=1.45 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.6999999999534339,
    range: '±12.4%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.70/3.00/6.30/14.10 ms avg=3.09 ms (16 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 14.100000000093132,
    range: '±12.4%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.70/3.00/6.30/14.10 ms avg=3.09 ms (16 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.7000000001862645,
    range: '±4.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/4.20/7.00/7.00 ms avg=4.20 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 7,
    range: '±4.3%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.70/4.20/7.00/7.00 ms avg=4.20 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 3.199999999953434,
    range: '±15.8%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.20/7.10/19.00/19.00 ms avg=6.96 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 19,
    range: '±15.8%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.20/7.10/19.00/19.00 ms avg=6.96 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 68.10000000009313,
    range: '±51.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=68.10/84.10/119.30/119.30 ms avg=88.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 119.30000000004657,
    range: '±51.2%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=68.10/84.10/119.30/119.30 ms avg=88.30 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 63.199999999953434,
    range: '±54.9%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=63.20/77.00/118.10/118.10 ms avg=81.57 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 118.0999999998603,
    range: '±54.9%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=63.20/77.00/118.10/118.10 ms avg=81.57 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 69.19999999995343,
    range: '±75.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=69.20/108.80/144.80/144.80 ms avg=101.43 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 144.80000000004657,
    range: '±75.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=69.20/108.80/144.80/144.80 ms avg=101.43 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 278.80000000004657,
    range: '±77.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=278.80/308.10/356.30/356.30 ms avg=369.60 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 356.30000000004657,
    range: '±77.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=278.80/308.10/356.30/356.30 ms avg=369.60 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 578.1999999999534,
    range: '±120.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=578.20/680.70/698.50/698.50 ms avg=763.50 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 698.5,
    range: '±120.3%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=578.20/680.70/698.50/698.50 ms avg=763.50 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 828.3000000000466,
    range: '±127.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=828.30/876.40/955.80/955.80 ms avg=1063.59 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 955.8000000000466,
    range: '±127.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=828.30/876.40/955.80/955.80 ms avg=1063.59 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 2.699999999953434,
    range: '±7.2%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.70/4.20/6.30/9.90 ms avg=3.77 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 9.899999999906868,
    range: '±7.2%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.70/4.20/6.30/9.90 ms avg=3.77 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 22.5999999998603,
    range: '±25.3%',
    extra:
      'scan 1024x10000 50/75/90/95%=22.60/23.40/34.10/47.90 ms avg=27.04 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 47.9000000001397,
    range: '±25.3%',
    extra:
      'scan 1024x10000 50/75/90/95%=22.60/23.40/34.10/47.90 ms avg=27.04 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 114.19999999995343,
    range: '±72.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=114.20/130.50/187.10/187.10 ms avg=158.07 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 187.10000000009313,
    range: '±72.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=114.20/130.50/187.10/187.10 ms avg=158.07 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 183,
    range: '±56.0%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=183.00/188.90/239.00/239.00 ms avg=220.04 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 239,
    range: '±56.0%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=183.00/188.90/239.00/239.00 ms avg=220.04 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 31.800000000046566,
    range: '±111.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=31.80/37.50/41.00/142.90 ms avg=47.09 ms (11 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 142.89999999990687,
    range: '±111.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=31.80/37.50/41.00/142.90 ms avg=47.09 ms (11 runs sampled)',
  },
];

const macpro_min_8kb_max_16kb_run3 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.1000000000931323,
    range: '±1.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.10/1.30/2.40/2.70 ms avg=1.32 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 2.7000000001862645,
    range: '±1.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.10/1.30/2.40/2.70 ms avg=1.32 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.6000000000931323,
    range: '±4.5%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.10/2.90/6.10 ms avg=2.22 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 6.099999999627471,
    range: '±4.5%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.60/2.10/2.90/6.10 ms avg=2.22 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 4.100000000093132,
    range: '±13.9%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/5.60/18.00/18.00 ms avg=6.43 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 18,
    range: '±13.9%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=4.10/5.60/18.00/18.00 ms avg=6.43 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.8999999999068677,
    range: '±15.7%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/6.70/18.60/18.60 ms avg=6.43 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 18.600000000093132,
    range: '±15.7%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.90/6.70/18.60/18.60 ms avg=6.43 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 67.5,
    range: '±35.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=67.50/80.00/103.20/103.20 ms avg=88.37 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 103.1999999997206,
    range: '±35.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=67.50/80.00/103.20/103.20 ms avg=88.37 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 58,
    range: '±59.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=58.00/61.90/117.70/117.70 ms avg=73.94 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 117.70000000018626,
    range: '±59.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=58.00/61.90/117.70/117.70 ms avg=73.94 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 69.20000000018626,
    range: '±107.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=69.20/116.00/176.90/176.90 ms avg=109.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 176.89999999990687,
    range: '±107.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=69.20/116.00/176.90/176.90 ms avg=109.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 282.79999999981374,
    range: '±81.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=282.80/311.20/364.50/364.50 ms avg=376.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 364.5,
    range: '±81.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=282.80/311.20/364.50/364.50 ms avg=376.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 577.5,
    range: '±110.9%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=577.50/580.80/688.40/688.40 ms avg=745.56 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 688.3999999999069,
    range: '±110.9%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=577.50/580.80/688.40/688.40 ms avg=745.56 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 811.7000000001863,
    range: '±128.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=811.70/855.00/940.30/940.30 ms avg=1058.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 940.3000000002794,
    range: '±128.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=811.70/855.00/940.30/940.30 ms avg=1058.14 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 2.6999999997206032,
    range: '±17.1%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.70/3.80/10.80/19.80 ms avg=4.64 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 19.799999999813735,
    range: '±17.1%',
    extra:
      'scan 1024x1000 50/75/90/95%=2.70/3.80/10.80/19.80 ms avg=4.64 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 22.300000000279397,
    range: '±29.7%',
    extra:
      'scan 1024x10000 50/75/90/95%=22.30/22.70/31.70/52.00 ms avg=26.69 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 52,
    range: '±29.7%',
    extra:
      'scan 1024x10000 50/75/90/95%=22.30/22.70/31.70/52.00 ms avg=26.69 ms (19 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 112.10000000009313,
    range: '±70.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=112.10/141.60/182.30/182.30 ms avg=156.49 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 182.3000000002794,
    range: '±70.2%',
    extra:
      'create index 1024x5000 50/75/90/95%=112.10/141.60/182.30/182.30 ms avg=156.49 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 128.89999999990687,
    range: '±38.8%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=128.90/131.90/167.70/167.70 ms avg=167.06 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 167.6999999997206,
    range: '±38.8%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=128.90/131.90/167.70/167.70 ms avg=167.06 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 34,
    range: '±23.4%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=34.00/37.60/41.60/57.40 ms avg=41.78 ms (12 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 57.39999999990687,
    range: '±23.4%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=34.00/37.60/41.60/57.40 ms avg=41.78 ms (12 runs sampled)',
  },
];

const macpro_min_4kb_max_8kb_run1 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2999999998137355,
    range: '±2.2%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/1.70/3.50/3.50 ms avg=1.64 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.5,
    range: '±2.2%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.30/1.70/3.50/3.50 ms avg=1.64 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5,
    range: '±7.3%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/3.40/4.40/8.80 ms avg=2.61 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 8.799999999813735,
    range: '±7.3%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/3.40/4.40/8.80 ms avg=2.61 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.1000000000931323,
    range: '±2.2%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.10/3.80/4.30/4.30 ms avg=3.00 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 4.300000000279397,
    range: '±2.2%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.10/3.80/4.30/4.30 ms avg=3.00 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.400000000372529,
    range: '±15.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.40/5.60/18.30/18.30 ms avg=5.57 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 18.300000000279397,
    range: '±15.9%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.40/5.60/18.30/18.30 ms avg=5.57 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 74.3000000002794,
    range: '±28.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=74.30/100.70/102.70/102.70 ms avg=91.94 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 102.6999999997206,
    range: '±28.4%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=74.30/100.70/102.70/102.70 ms avg=91.94 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 56.90000000037253,
    range: '±55.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=56.90/81.20/112.50/112.50 ms avg=78.76 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 112.5,
    range: '±55.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=56.90/81.20/112.50/112.50 ms avg=78.76 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 70.3000000002794,
    range: '±97.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=70.30/109.90/167.60/167.60 ms avg=107.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 167.59999999962747,
    range: '±97.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=70.30/109.90/167.60/167.60 ms avg=107.79 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 244.60000000009313,
    range: '±90.1%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=244.60/278.50/334.70/334.70 ms avg=328.86 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 334.70000000018626,
    range: '±90.1%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=244.60/278.50/334.70/334.70 ms avg=328.86 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 543.3999999999069,
    range: '±205.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=543.40/559.50/748.60/748.60 ms avg=727.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 748.6000000000931,
    range: '±205.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=543.40/559.50/748.60/748.60 ms avg=727.14 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 831.4000000003725,
    range: '±252.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=831.40/866.90/1084.00/1084.00 ms avg=1105.83 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 1084,
    range: '±252.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=831.40/866.90/1084.00/1084.00 ms avg=1105.83 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 3.3999999999068677,
    range: '±16.2%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.40/4.40/10.90/19.60 ms avg=5.14 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 19.600000000093132,
    range: '±16.2%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.40/4.40/10.90/19.60 ms avg=5.14 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 25.40000000037253,
    range: '±21.4%',
    extra:
      'scan 1024x10000 50/75/90/95%=25.40/25.80/30.30/46.80 ms avg=29.86 ms (17 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 46.799999999813735,
    range: '±21.4%',
    extra:
      'scan 1024x10000 50/75/90/95%=25.40/25.80/30.30/46.80 ms avg=29.86 ms (17 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 126.10000000009313,
    range: '±70.8%',
    extra:
      'create index 1024x5000 50/75/90/95%=126.10/139.70/196.90/196.90 ms avg=172.43 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 196.89999999990687,
    range: '±70.8%',
    extra:
      'create index 1024x5000 50/75/90/95%=126.10/139.70/196.90/196.90 ms avg=172.43 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 123.90000000037253,
    range: '±13.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=123.90/135.90/137.60/137.60 ms avg=155.09 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 137.60000000009313,
    range: '±13.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=123.90/135.90/137.60/137.60 ms avg=155.09 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 44.1999999997206,
    range: '±17.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=44.20/45.00/61.90/61.90 ms avg=53.51 ms (10 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 61.89999999990687,
    range: '±17.7%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=44.20/45.00/61.90/61.90 ms avg=53.51 ms (10 runs sampled)',
  },
];

const macpro_min_4kb_max_8kb_run2 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2000000001862645,
    range: '±2.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/1.70/3.30/3.80 ms avg=1.68 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 3.8000000002793968,
    range: '±2.6%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/1.70/3.30/3.80 ms avg=1.68 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.5,
    range: '±3.6%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/2.50/3.80/5.10 ms avg=2.16 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 5.100000000093132,
    range: '±3.6%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.50/2.50/3.80/5.10 ms avg=2.16 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.3999999999068677,
    range: '±2.6%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.40/3.80/5.00/5.00 ms avg=3.21 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 5,
    range: '±2.6%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.40/3.80/5.00/5.00 ms avg=3.21 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.5,
    range: '±15.8%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/5.70/18.30/18.30 ms avg=5.76 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 18.299999999813735,
    range: '±15.8%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.50/5.70/18.30/18.30 ms avg=5.76 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 67.90000000037253,
    range: '±59.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=67.90/74.40/127.60/127.60 ms avg=92.11 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 127.60000000009313,
    range: '±59.7%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=67.90/74.40/127.60/127.60 ms avg=92.11 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 49.89999999990687,
    range: '±69.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=49.90/83.60/119.50/119.50 ms avg=78.19 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 119.5,
    range: '±69.6%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=49.90/83.60/119.50/119.50 ms avg=78.19 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 76.60000000009313,
    range: '±83.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=76.60/119.90/160.10/160.10 ms avg=112.74 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 160.10000000009313,
    range: '±83.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=76.60/119.90/160.10/160.10 ms avg=112.74 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 250.29999999981374,
    range: '±102.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=250.30/284.30/352.30/352.30 ms avg=335.39 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 352.29999999981374,
    range: '±102.0%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=250.30/284.30/352.30/352.30 ms avg=335.39 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 553,
    range: '±146.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=553.00/603.30/699.50/699.50 ms avg=731.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 699.5,
    range: '±146.5%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=553.00/603.30/699.50/699.50 ms avg=731.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 821,
    range: '±201.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=821.00/847.90/1022.70/1022.70 ms avg=1078.06 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 1022.7000000001863,
    range: '±201.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=821.00/847.90/1022.70/1022.70 ms avg=1078.06 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 3.2999999998137355,
    range: '±21.6%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.30/4.50/7.60/24.90 ms avg=5.19 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 24.899999999906868,
    range: '±21.6%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.30/4.50/7.60/24.90 ms avg=5.19 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 26.199999999720603,
    range: '±23.9%',
    extra:
      'scan 1024x10000 50/75/90/95%=26.20/26.70/34.40/50.10 ms avg=30.79 ms (17 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 50.10000000009313,
    range: '±23.9%',
    extra:
      'scan 1024x10000 50/75/90/95%=26.20/26.70/34.40/50.10 ms avg=30.79 ms (17 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 124.60000000009313,
    range: '±72.0%',
    extra:
      'create index 1024x5000 50/75/90/95%=124.60/140.20/196.60/196.60 ms avg=172.19 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 196.60000000009313,
    range: '±72.0%',
    extra:
      'create index 1024x5000 50/75/90/95%=124.60/140.20/196.60/196.60 ms avg=172.19 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 135.70000000018626,
    range: '±52.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=135.70/149.10/188.60/188.60 ms avg=175.53 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 188.60000000009313,
    range: '±52.9%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=135.70/149.10/188.60/188.60 ms avg=175.53 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 43.09999999962747,
    range: '±15.3%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=43.10/44.60/58.40/58.40 ms avg=52.13 ms (10 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 58.40000000037253,
    range: '±15.3%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=43.10/44.60/58.40/58.40 ms avg=52.13 ms (10 runs sampled)',
  },
];

const macpro_min_4kb_max_8kb_run3 = [
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.2000000001862645,
    range: '±2.9%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/2.00/2.60/4.10 ms avg=1.67 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 4.100000000093132,
    range: '±2.9%',
    extra:
      'writeSubRead 1MB total, 64 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.20/2.00/2.60/4.10 ms avg=1.67 ms (19 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 1.3999999999068677,
    range: '±10.0%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/2.20/3.60/11.40 ms avg=2.51 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 11.399999999906868,
    range: '±10.0%',
    extra:
      'writeSubRead 4MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=1.40/2.20/3.60/11.40 ms avg=2.51 ms (15 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 2.1000000000931323,
    range: '±8.7%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.10/8.00/10.80/10.80 ms avg=4.67 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 10.799999999813735,
    range: '±8.7%',
    extra:
      'writeSubRead 16MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=2.10/8.00/10.80/10.80 ms avg=4.67 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub',
    unit: 'median ms',
    value: 3.099999999627471,
    range: '±15.5%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/5.30/18.60/18.60 ms avg=5.87 ms (7 runs sampled)',
  },
  {
    name: 'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub p95',
    unit: 'p95 ms',
    value: 18.600000000093132,
    range: '±15.5%',
    extra:
      'writeSubRead 64MB total, 128 subs total, 5 subs dirty, 16kb read per sub 50/75/90/95%=3.10/5.30/18.60/18.60 ms avg=5.87 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 66.79999999981374,
    range: '±58.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=66.80/76.90/125.10/125.10 ms avg=91.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 125.09999999962747,
    range: '±58.3%',
    extra:
      'populate 1024x1000 (clean, indexes: 0) 50/75/90/95%=66.80/76.90/125.10/125.10 ms avg=91.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 56.60000000009313,
    range: '±65.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=56.60/80.30/122.10/122.10 ms avg=82.19 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 122.10000000009313,
    range: '±65.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 1) 50/75/90/95%=56.60/80.30/122.10/122.10 ms avg=82.19 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 71.70000000018626,
    range: '±74.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=71.70/120.10/146.20/146.20 ms avg=108.77 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x1000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 146.1999999997206,
    range: '±74.5%',
    extra:
      'populate 1024x1000 (clean, indexes: 2) 50/75/90/95%=71.70/120.10/146.20/146.20 ms avg=108.77 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0)',
    unit: 'median ms',
    value: 252,
    range: '±95.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=252.00/284.70/347.60/347.60 ms avg=336.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 0) p95',
    unit: 'p95 ms',
    value: 347.60000000009313,
    range: '±95.6%',
    extra:
      'populate 1024x10000 (clean, indexes: 0) 50/75/90/95%=252.00/284.70/347.60/347.60 ms avg=336.49 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1)',
    unit: 'median ms',
    value: 553,
    range: '±122.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=553.00/583.80/675.20/675.20 ms avg=724.39 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 1) p95',
    unit: 'p95 ms',
    value: 675.2000000001863,
    range: '±122.2%',
    extra:
      'populate 1024x10000 (clean, indexes: 1) 50/75/90/95%=553.00/583.80/675.20/675.20 ms avg=724.39 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2)',
    unit: 'median ms',
    value: 852.3999999999069,
    range: '±174.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=852.40/927.00/1027.10/1027.10 ms avg=1113.27 ms (7 runs sampled)',
  },
  {
    name: 'populate 1024x10000 (clean, indexes: 2) p95',
    unit: 'p95 ms',
    value: 1027.1000000000931,
    range: '±174.7%',
    extra:
      'populate 1024x10000 (clean, indexes: 2) 50/75/90/95%=852.40/927.00/1027.10/1027.10 ms avg=1113.27 ms (7 runs sampled)',
  },
  {
    name: 'scan 1024x1000',
    unit: 'median ms',
    value: 3.3000000002793968,
    range: '±12.9%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.30/4.10/8.80/16.20 ms avg=4.84 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x1000 p95',
    unit: 'p95 ms',
    value: 16.199999999720603,
    range: '±12.9%',
    extra:
      'scan 1024x1000 50/75/90/95%=3.30/4.10/8.80/16.20 ms avg=4.84 ms (19 runs sampled)',
  },
  {
    name: 'scan 1024x10000',
    unit: 'median ms',
    value: 25.299999999813735,
    range: '±31.3%',
    extra:
      'scan 1024x10000 50/75/90/95%=25.30/26.10/53.30/56.60 ms avg=32.52 ms (16 runs sampled)',
  },
  {
    name: 'scan 1024x10000 p95',
    unit: 'p95 ms',
    value: 56.59999999962747,
    range: '±31.3%',
    extra:
      'scan 1024x10000 50/75/90/95%=25.30/26.10/53.30/56.60 ms avg=32.52 ms (16 runs sampled)',
  },
  {
    name: 'create index 1024x5000',
    unit: 'median ms',
    value: 124.3000000002794,
    range: '±69.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=124.30/151.00/194.20/194.20 ms avg=174.17 ms (7 runs sampled)',
  },
  {
    name: 'create index 1024x5000 p95',
    unit: 'p95 ms',
    value: 194.20000000018626,
    range: '±69.9%',
    extra:
      'create index 1024x5000 50/75/90/95%=124.30/151.00/194.20/194.20 ms avg=174.17 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 131.09999999962747,
    range: '±44.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=131.10/132.80/175.80/175.80 ms avg=166.86 ms (7 runs sampled)',
  },
  {
    name: 'startup read 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 175.8000000002794,
    range: '±44.7%',
    extra:
      'startup read 1024x100 from 1024x100000 stored 50/75/90/95%=131.10/132.80/175.80/175.80 ms avg=166.86 ms (7 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored',
    unit: 'median ms',
    value: 45.60000000009313,
    range: '±12.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=45.60/46.10/56.70/56.70 ms avg=51.51 ms (10 runs sampled)',
  },
  {
    name: 'startup scan 1024x100 from 1024x100000 stored p95',
    unit: 'p95 ms',
    value: 56.6999999997206,
    range: '±12.1%',
    extra:
      'startup scan 1024x100 from 1024x100000 stored 50/75/90/95%=45.60/46.10/56.70/56.70 ms avg=51.51 ms (10 runs sampled)',
  },
];

export default {
  macpro_min_8kb_max_16kb_run1,
  macpro_min_8kb_max_16kb_run2,
  macpro_min_8kb_max_16kb_run3,
  macpro_min_4kb_max_8kb_run1,
  macpro_min_4kb_max_8kb_run2,
  macpro_min_4kb_max_8kb_run3,

  m1_min_4kb_max_8kb_run1,
  m1_min_4kb_max_8kb_run2,
  m1_min_4kb_max_8kb_run3,
  m1_min_8kb_max_16kb_run1,
  m1_min_8kb_max_16kb_run2,
  m1_min_8kb_max_16kb_run3,
};
