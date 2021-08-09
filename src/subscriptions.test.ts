import {expect} from '@esm-bundle/chai';

import {decodeIndexKey, scanOptionsMatchesKey} from './subscriptions.js';

test(`decodeIndexKey`, () => {
  expect(decodeIndexKey('\u0000abc\u0000def')).to.deep.equal(['abc', 'def']);
  expect(decodeIndexKey('\u0000abc\u0000')).to.deep.equal(['abc', '']);
  expect(decodeIndexKey('\u0000\u0000def')).to.deep.equal(['', 'def']);

  expect(() => decodeIndexKey('abc')).to.throw('Invalid version');
  expect(() => decodeIndexKey('\u0000abc')).to.throw('Invalid formatting');
  expect(() => decodeIndexKey('\u0000abc\u0000def\u0000ghi')).to.throw(
    'Invalid formatting',
  );
});

test('scanOptionsMatchesKey', () => {
  expect(scanOptionsMatchesKey({}, '', 'a')).to.be.true;
  expect(scanOptionsMatchesKey({indexName: 'idx'}, 'idx', 'a')).to.be.true;
  expect(scanOptionsMatchesKey({indexName: 'idx'}, '', 'a')).to.be.false;
  expect(scanOptionsMatchesKey({}, 'idx', 'a')).to.be.false;

  expect(scanOptionsMatchesKey({prefix: 'p'}, '', 'a')).to.be.false;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  expect(scanOptionsMatchesKey({start_key: 'sk'}, '', 'a')).to.be.false;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  expect(scanOptionsMatchesKey({start_key: 'sk'}, '', 'skate')).to.be.true;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  expect(scanOptionsMatchesKey({start_key: 'a'}, '', 'b')).to.be.true;

  expect(
    scanOptionsMatchesKey(
      {prefix: 'a', indexName: 'idx'},
      'idx',
      '\u0000a\u0000b',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      {prefix: 'sb', indexName: 'idx'},
      'idx',
      '\u0000sa\u0000p',
    ),
  ).to.be.false;

  expect(
    scanOptionsMatchesKey(
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {prefix: 'sa', indexName: 'idx', start_secondary_key: 'sab'},
      'idx',
      '\u0000sab\u0000p',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {prefix: 'sa', indexName: 'idx', start_secondary_key: 'sab'},
      'idx',
      '\u0000sac\u0000p',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {prefix: 'sa', indexName: 'idx', start_secondary_key: 'sac'},
      'idx',
      '\u0000sab\u0000p',
    ),
  ).to.be.false;

  expect(
    scanOptionsMatchesKey(
      /* eslint-disable @typescript-eslint/naming-convention */
      {
        prefix: 'sa',
        indexName: 'idx',

        start_secondary_key: 'sab',
        start_key: 'pa',
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      'idx',
      '\u0000sac\u0000pa',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      /* eslint-disable @typescript-eslint/naming-convention */
      {
        prefix: 'sa',
        indexName: 'idx',
        start_secondary_key: 'sab',
        start_key: 'pab',
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      'idx',
      '\u0000sac\u0000pab',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      /* eslint-disable @typescript-eslint/naming-convention */
      {
        prefix: 'sa',
        indexName: 'idx',
        start_secondary_key: 'sab',
        start_key: 'pab',
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      'idx',
      '\u0000sac\u0000pac',
    ),
  ).to.be.true;
  expect(
    scanOptionsMatchesKey(
      /* eslint-disable @typescript-eslint/naming-convention */
      {
        prefix: 'sa',
        indexName: 'idx',
        start_secondary_key: 'sab',
        start_key: 'pac',
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      'idx',
      '\u0000sac\u0000pab',
    ),
  ).to.be.false;
});
