import {expect} from '@esm-bundle/chai';
import type {ScanOptions} from './db/mod';
import {scanInfoMatchesKey} from './subscriptions';

test('scanInfoMatchesKey', () => {
  expect(scanInfoMatchesKey({options: {}}, '', 'a')).to.be.true;
  expect(scanInfoMatchesKey({options: {indexName: 'idx'}}, 'idx', 'a')).to.be
    .true;
  expect(scanInfoMatchesKey({options: {indexName: 'idx'}}, '', 'a')).to.be
    .false;
  expect(scanInfoMatchesKey({options: {}}, 'idx', 'a')).to.be.false;

  expect(scanInfoMatchesKey({options: {prefix: 'p'}}, '', 'a')).to.be.false;

  expect(scanInfoMatchesKey({options: {startKey: 'sk'}}, '', 'a')).to.be.false;
  expect(scanInfoMatchesKey({options: {startKey: 'sk'}}, '', 'skate')).to.be
    .true;
  expect(scanInfoMatchesKey({options: {startKey: 'a'}}, '', 'b')).to.be.true;

  expect(
    scanInfoMatchesKey(
      {options: {prefix: 'a', indexName: 'idx'}},
      'idx',
      '\u0000a\u0000b',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {options: {prefix: 'sb', indexName: 'idx'}},
      'idx',
      '\u0000sa\u0000p',
    ),
  ).to.be.false;

  expect(
    scanInfoMatchesKey(
      {options: {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sab'}},
      'idx',
      '\u0000sab\u0000p',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {options: {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sab'}},
      'idx',
      '\u0000sac\u0000p',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {options: {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sac'}},
      'idx',
      '\u0000sab\u0000p',
    ),
  ).to.be.false;

  expect(
    scanInfoMatchesKey(
      {
        options: {
          prefix: 'sa',
          indexName: 'idx',
          startSecondaryKey: 'sab',
          startKey: 'pa',
        },
      },
      'idx',
      '\u0000sac\u0000pa',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {
        options: {
          prefix: 'sa',
          indexName: 'idx',
          startSecondaryKey: 'sab',
          startKey: 'pab',
        },
      },
      'idx',
      '\u0000sac\u0000pab',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {
        options: {
          prefix: 'sa',
          indexName: 'idx',
          startSecondaryKey: 'sab',
          startKey: 'pab',
        },
      },
      'idx',
      '\u0000sac\u0000pac',
    ),
  ).to.be.true;
  expect(
    scanInfoMatchesKey(
      {
        options: {
          prefix: 'sa',
          indexName: 'idx',
          startSecondaryKey: 'sab',
          startKey: 'pac',
        },
      },
      'idx',
      '\u0000sac\u0000pab',
    ),
  ).to.be.false;
});

function testScanLimitOptimizations({
  options,
  lastKeyReadInfo,
  changedKey,
  expected,
}: {
  options: ScanOptions;
  lastKeyReadInfo: {
    key: string;
    isInclusiveLimit?: boolean;
  };
  changedKey: string;
  expected: boolean;
}) {
  const isInclusiveLimitValuesToTest = lastKeyReadInfo.isInclusiveLimit
    ? [lastKeyReadInfo.isInclusiveLimit]
    : [true, false];
  for (const isInclusiveLimit of isInclusiveLimitValuesToTest) {
    const info = {
      options,
      lastKeyReadInfo: {
        key: lastKeyReadInfo.key,
        isInclusiveLimit,
      },
    };
    expect(
      scanInfoMatchesKey(info, '', changedKey),
      `scanInfoMatchesKey(${JSON.stringify(
        info,
      )}, "", "${changedKey}"") should be ${expected}`,
    ).to.equal(expected);
  }
}

test('scanInfoMatchesKey limit optimizations', () => {
  // Start key tests

  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac2',
    expected: true,
  });

  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac4',
    expected: true,
  });

  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac8',
    expected: true,
  });

  // Changed key is after inclusive limit
  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      isInclusiveLimit: true,
    },
    changedKey: 'pac9',
    expected: false,
  });

  // Changed key is before start key
  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac1',
    expected: false,
  });

  // Changed key is equal to exclusive start key
  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
      startExclusive: true,
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac2',
    expected: false,
  });

  // No limit
  testScanLimitOptimizations({
    options: {
      startKey: 'pac2',
    },
    lastKeyReadInfo: {
      key: 'pac8',
    },
    changedKey: 'pac9',
    expected: true,
  });

  // Prefix test

  testScanLimitOptimizations({
    options: {
      prefix: 'pac',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac1',
    expected: true,
  });

  testScanLimitOptimizations({
    options: {
      prefix: 'pac',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac8',
    expected: true,
  });

  // Changed key is after inclusive limit
  testScanLimitOptimizations({
    options: {
      prefix: 'pac',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      isInclusiveLimit: true,
    },
    changedKey: 'pac9',
    expected: false,
  });

  // Changed key doesn't match prefix
  testScanLimitOptimizations({
    options: {
      prefix: 'pac',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac8',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pab',
    expected: false,
  });

  // No limit
  testScanLimitOptimizations({
    options: {
      prefix: 'pac',
    },
    lastKeyReadInfo: {
      key: 'pac8',
    },
    changedKey: 'pac9',
    expected: true,
  });

  // Start and prefix

  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac22',
    expected: true,
  });

  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac24',
    expected: true,
  });

  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac28',
    expected: true,
  });

  // Changed key is after inclusive limit
  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      isInclusiveLimit: true,
    },
    changedKey: 'pac29',
    expected: false,
  });

  // Changed key is before start key
  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac21',
    expected: false,
  });

  // Changed key is equal to exclusive start key
  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
      startExclusive: true,
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pac22',
    expected: false,
  });

  // No limit
  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pac22',
    },
    lastKeyReadInfo: {
      key: 'pac28',
    },
    changedKey: 'pac29',
    expected: true,
  });

  // Changed key is between startKey and lastKey inclusive, but doesnt match prefix
  testScanLimitOptimizations({
    options: {
      prefix: 'pac2',
      startKey: 'pab1',
      limit: 10,
    },
    lastKeyReadInfo: {
      key: 'pac28',
      // expected for both isInclusiveLimit true and false
    },
    changedKey: 'pab2',
    expected: false,
  });
});
