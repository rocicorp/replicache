export type RandomDataType = 'string' | 'object' | 'arraybuffer' | 'blob';
export type RandomDatum = string | Record<string, string> | ArrayBuffer | Blob;
export type RandomData = RandomDatum[];

export function randomData(
  type: RandomDataType,
  len: number,
  datumSize: number,
): RandomData {
  return Array.from({length: len}).map(() => randomDatum(type, datumSize));
}

function randomDatum(type: RandomDataType, len: number): RandomDatum {
  switch (type) {
    case 'string':
      return randomString(len);
    case 'object':
      return randomObject(len);
    case 'arraybuffer':
      return randomUint8Array(len).buffer;
    case 'blob':
      return randomBlob(len);
    default:
      throw new Error('unsupported');
  }
}

function randomObject(len: number): Record<string, string> {
  const ret: Record<string, string> = {};
  for (let i = 0; i < Math.min(100, len); i++) {
    ret[`k${i}`] = randomString(Math.ceil(len / 100));
  }
  return ret;
}

export function makeRandomStrings(
  numStrings: number,
  strLen: number,
): string[] {
  return Array.from({length: numStrings}, () => randomString(strLen));
}

function randomString(len: number): string {
  const arr = randomUint8Array(len);
  return new TextDecoder('ascii').decode(arr);
}

function randomBlob(len: number): Blob {
  return new Blob([randomUint8Array(len)]);
}

function randomUint8Array(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = Math.floor(Math.random() * 254 + 1);
  }
  return arr;
}
