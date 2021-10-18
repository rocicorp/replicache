import {expect} from '@esm-bundle/chai';
import {
  getSizeOfValue,
  NODE_HEADER_SIZE,
  sizeOfVarInt,
  zigZagEncode,
} from './get-size-of-value';
import {NodeType} from './node';

test('getSizeOfValue', async () => {
  expect(getSizeOfValue(null)).to.equal(1);
  expect(getSizeOfValue(true)).to.equal(1);
  expect(getSizeOfValue(false)).to.equal(1);

  expect(getSizeOfValue('')).to.equal(2);
  expect(getSizeOfValue('abc')).to.equal(5);

  expect(getSizeOfValue(0)).to.equal(2);
  expect(getSizeOfValue(42)).to.equal(2);
  expect(getSizeOfValue(-42)).to.equal(2);

  expect(getSizeOfValue(2 ** 7 - 1)).to.equal(3);
  expect(getSizeOfValue(-(2 ** 7 - 1))).to.equal(3);
  expect(getSizeOfValue(2 ** 7)).to.equal(3);
  expect(getSizeOfValue(-(2 ** 7))).to.equal(3);

  expect(getSizeOfValue(2 ** 14 - 1)).to.equal(4);
  expect(getSizeOfValue(-(2 ** 14 - 1))).to.equal(4);
  expect(getSizeOfValue(2 ** 14)).to.equal(4);
  expect(getSizeOfValue(-(2 ** 14))).to.equal(4);

  expect(getSizeOfValue(2 ** 21 - 1)).to.equal(5);
  expect(getSizeOfValue(-(2 ** 21 - 1))).to.equal(5);
  expect(getSizeOfValue(2 ** 21)).to.equal(5);
  expect(getSizeOfValue(-(2 ** 21))).to.equal(5);

  expect(getSizeOfValue(2 ** 28 - 1)).to.equal(6);
  expect(getSizeOfValue(-(2 ** 28 - 1))).to.equal(6);
  expect(getSizeOfValue(2 ** 28)).to.equal(6);
  expect(getSizeOfValue(-(2 ** 28))).to.equal(6);

  expect(getSizeOfValue(2 ** 31 - 1)).to.equal(6);
  expect(getSizeOfValue(-(2 ** 31))).to.equal(6);
  expect(getSizeOfValue(2 ** 31)).to.equal(9); // not smi
  expect(getSizeOfValue(-(2 ** 31) - 1)).to.equal(9); // not smi

  expect(getSizeOfValue(0.1)).to.equal(9);

  expect(getSizeOfValue([])).to.equal(3);
  expect(getSizeOfValue([0])).to.equal(3 + 2);
  expect(getSizeOfValue(['abc'])).to.equal(3 + 5);
  expect(getSizeOfValue([0, 1, 2])).to.equal(3 + 3 * 2);
  expect(getSizeOfValue([null, true, false])).to.equal(3 + 3 * 1);

  expect(getSizeOfValue({})).to.equal(3);
  expect(getSizeOfValue({abc: 'def'})).to.equal(3 + 5 + 5);
});

test('zigzag', () => {
  expect(zigZagEncode(0)).to.equal(0);
  expect(zigZagEncode(-1)).to.equal(1);
  expect(zigZagEncode(1)).to.equal(2);
  expect(zigZagEncode(-2)).to.equal(3);
  expect(zigZagEncode(2)).to.equal(4);
});

test('varint size', () => {
  expect(sizeOfVarInt(0)).to.equal(1);
  expect(sizeOfVarInt(1)).to.equal(1);
  expect(sizeOfVarInt(2 ** 7 - 1)).to.equal(1);
  expect(sizeOfVarInt(2 ** 7)).to.equal(2);
  expect(sizeOfVarInt(2 ** 14 - 1)).to.equal(2);
  expect(sizeOfVarInt(2 ** 14)).to.equal(3);
  expect(sizeOfVarInt(2 ** 21 - 1)).to.equal(3);
  expect(sizeOfVarInt(2 ** 21)).to.equal(4);
  expect(sizeOfVarInt(2 ** 28 - 1)).to.equal(4);
  expect(sizeOfVarInt(2 ** 28)).to.equal(5);
});

test('chunk header size', () => {
  // This just ensures that the constant is correct.
  const chunkData = {t: NodeType.Data, e: []};
  const entriesSize = getSizeOfValue(chunkData.e);
  const chunkSize = getSizeOfValue(chunkData);
  expect(chunkSize - entriesSize).to.equal(NODE_HEADER_SIZE);
});
