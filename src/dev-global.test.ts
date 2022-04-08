import {expect} from '@esm-bundle/chai';

declare const __DEV__: boolean;

test('__DEV__', () => {
  expect(__DEV__).to.equal(true);
});
