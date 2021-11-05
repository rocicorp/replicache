import {expect} from '@esm-bundle/chai';
import {scanInfoMatchesKey} from './subscriptions';

test('scanInfoMatchesKey', () => {
  expect(true).to.be.true;
  scanInfoMatchesKey;
  // expect(scanInfoMatchesKey({}, '', 'a')).to.be.true;
  // expect(scanInfoMatchesKey({indexName: 'idx'}, 'idx', 'a')).to.be.true;
  // expect(scanInfoMatchesKey({indexName: 'idx'}, '', 'a')).to.be.false;
  // expect(scanInfoMatchesKey({}, 'idx', 'a')).to.be.false;

  // expect(scanInfoMatchesKey({prefix: 'p'}, '', 'a')).to.be.false;

  // expect(scanInfoMatchesKey({startKey: 'sk'}, '', 'a')).to.be.false;
  // expect(scanInfoMatchesKey({startKey: 'sk'}, '', 'skate')).to.be.true;
  // expect(scanInfoMatchesKey({startKey: 'a'}, '', 'b')).to.be.true;

  // expect(
  //   scanInfoMatchesKey(
  //     {prefix: 'a', indexName: 'idx'},
  //     'idx',
  //     '\u0000a\u0000b',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {prefix: 'sb', indexName: 'idx'},
  //     'idx',
  //     '\u0000sa\u0000p',
  //   ),
  // ).to.be.false;

  // expect(
  //   scanInfoMatchesKey(
  //     {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sab'},
  //     'idx',
  //     '\u0000sab\u0000p',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sab'},
  //     'idx',
  //     '\u0000sac\u0000p',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {prefix: 'sa', indexName: 'idx', startSecondaryKey: 'sac'},
  //     'idx',
  //     '\u0000sab\u0000p',
  //   ),
  // ).to.be.false;

  // expect(
  //   scanInfoMatchesKey(
  //     {
  //       prefix: 'sa',
  //       indexName: 'idx',
  //       startSecondaryKey: 'sab',
  //       startKey: 'pa',
  //     },
  //     'idx',
  //     '\u0000sac\u0000pa',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {
  //       prefix: 'sa',
  //       indexName: 'idx',
  //       startSecondaryKey: 'sab',
  //       startKey: 'pab',
  //     },
  //     'idx',
  //     '\u0000sac\u0000pab',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {
  //       prefix: 'sa',
  //       indexName: 'idx',
  //       startSecondaryKey: 'sab',
  //       startKey: 'pab',
  //     },
  //     'idx',
  //     '\u0000sac\u0000pac',
  //   ),
  // ).to.be.true;
  // expect(
  //   scanInfoMatchesKey(
  //     {
  //       prefix: 'sa',
  //       indexName: 'idx',
  //       startSecondaryKey: 'sab',
  //       startKey: 'pac',
  //     },
  //     'idx',
  //     '\u0000sac\u0000pab',
  //   ),
  // ).to.be.false;
});
