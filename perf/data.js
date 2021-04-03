/**
 * @typedef {"string"|"object"|"arraybuffer"|"blob"} RandomDataType
 */

/**
 * @param {RandomDataType} type
 * @param {number} len
 * @param {number} datumSize
 */
export function randomData(type, len, datumSize) {
  return Array.from({length: len}).map(() => randomDatum(type, datumSize));
}

/**
 * @param {RandomDataType} type
 * @param {number} len
 */
function randomDatum(type, len) {
  if (type == 'string') {
    return randomString(len);
  } else if (type == 'object') {
    return randomObject(len);
  } else if (type == 'arraybuffer') {
    return randomUint8Array(len).buffer;
  } else if (type == 'blob') {
    return randomBlob(len);
  } else {
    throw new Error('unsupported');
  }
}

/**
 * @param {number} len
 * @returns {Record<string, string>}
 */
function randomObject(len) {
  const ret = /** @type Record<string, string> */ ({});
  for (let i = 0; i < Math.min(100, len); i++) {
    ret[`k${i}`] = randomString(Math.ceil(len / 100));
  }
  return ret;
}

/**
 * @param {number} numStrings
 * @param {number} strLen
 */
export function makeRandomStrings(numStrings, strLen) {
  return Array.from({length: numStrings}, () => randomString(strLen));
}

/**
 * @param {number} len
 */
function randomString(len) {
  const arr = randomUint8Array(len);
  return new TextDecoder('ascii').decode(arr);
}

/**
 * @param {number} len
 */
function randomBlob(len) {
  return new Blob([randomUint8Array(len)]);
}

/**
 * @param {number} len
 */
function randomUint8Array(len) {
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = Math.floor(Math.random() * 254 + 1);
  }
  return arr;
}
