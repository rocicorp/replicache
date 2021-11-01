import {createSHA512} from 'hash-wasm';
import type {IHasher} from 'hash-wasm/dist/lib/WASMInterface';

const BYTE_LENGTH = 20;

const charTable = '0123456789abcdefghijklmnopqrstuv';

let mem = new Uint8Array(1024 * 1024);
const encoder = new TextEncoder();

function ensureCapacity(s: string) {
  // JS strings are UTF16 but we encode to UTF8.
  if (s.length * 2 > mem.length) {
    mem = new Uint8Array(mem.length * 2);
    ensureCapacity(s);
  }
}

const stringToUint8Array: (s: string) => Uint8Array =
  typeof encoder.encodeInto !== 'undefined'
    ? s => {
        ensureCapacity(s);
        const {written} = encoder.encodeInto(s, mem);
        return new Uint8Array(mem.buffer, 0, written);
      }
    : s => encoder.encode(s);

const hashRe = /^[0-9a-v]{32}$/;

/**
 * Computes a SHA512 hash of the given data.
 *
 * You have to await the result of [[initHasher]] before calling this method.
 */
export function hashOf(value: string): string {
  if (!hasher) {
    throw new Error('Hash.of() requires await initHasher');
  }
  const typedArray = stringToUint8Array(value);
  const buf = hasher.init().update(typedArray).digest('binary');
  const buf2 = buf.subarray(0, BYTE_LENGTH);
  return encode(buf2);
}

export function isHash(s: string): boolean {
  return hashRe.test(s);
}

export const emptyHashString = '00000000000000000000000000000000';

function encode(plain: Uint8Array): string {
  let i = 0;
  let shiftIndex = 0;
  let digit = 0;
  let encoded = '';

  // byte by byte isn't as pretty as quintet by quintet but tests a bit
  // faster. will have to revisit.
  while (i < BYTE_LENGTH) {
    const current = plain[i];

    if (shiftIndex > 3) {
      digit = current & (0xff >> shiftIndex);
      shiftIndex = (shiftIndex + 5) % 8;
      digit =
        (digit << shiftIndex) |
        ((i + 1 < BYTE_LENGTH ? plain[i + 1] : 0) >> (8 - shiftIndex));
      i++;
    } else {
      digit = (current >> (8 - (shiftIndex + 5))) & 0x1f;
      shiftIndex = (shiftIndex + 5) % 8;
      if (shiftIndex === 0) {
        i++;
      }
    }

    encoded += charTable[digit];
  }

  // No padding!
  return encoded;
}

let hasherPromise: Promise<IHasher> | undefined;
let hasher: IHasher | undefined;

export async function initHasher(): Promise<unknown> {
  // Creating the Wasm module is async but the actual compuation is sync.
  if (!hasherPromise) {
    hasherPromise = createSHA512();
    hasher = await hasherPromise;
  }
  return hasherPromise;
}
