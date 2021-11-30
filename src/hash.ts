import {createSHA512} from 'hash-wasm';
import type {IHasher} from 'hash-wasm/dist/lib/WASMInterface';
import {assert} from './asserts';
import {encode} from './base32-encode';
import type {ReadonlyJSONValue} from './json';
import * as utf8 from './utf8';

export const BYTE_LENGTH = 20;

export const STRING_LENGTH = 32;

// We use an opaque type so that we can make sure that a hash is always a hash.
// TypeScript does not have direct support but we can use a trick described
// here:
//
// https://evertpot.com/opaque-ts-types/
//
// The basic idea is to declare a type that cannot be created. We then use
// functions that cast a string to this type.
//

// By using declare we tell the type system that there is a unique symbol.
// However, there is no such symbol but the type system does not care.
declare const hashTag: unique symbol;

/**
 * Opaque type representing a hash. The only way to create one is using `parse`
 * or `hashOf` (except for static unsafe cast of course).
 */
export type Hash = {[hashTag]: true};

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
const tempHashRe = /^t\/[0-9a-v]{30}$/;

/**
 * Computes a SHA512 hash of the given data.
 *
 * You have to await the result of [[initHasher]] before calling this method.
 */
export function hashOf(value: ReadonlyJSONValue): Hash {
  if (!hasher) {
    throw new Error('hashOf() requires await initHasher');
  }
  const typedArray = stringToUint8Array(JSON.stringify(value));
  const buf = hasher.init().update(typedArray).digest('binary');
  const buf2 = buf.subarray(0, BYTE_LENGTH);
  return encode(buf2) as unknown as Hash;
}

export async function nativeHashOf(value: ReadonlyJSONValue): Promise<Hash> {
  const typedArray = utf8.encode(JSON.stringify(value));
  const buf = await crypto.subtle.digest('SHA-512', typedArray);
  const buf2 = new Uint8Array(buf, 0, BYTE_LENGTH);
  return encode(buf2) as unknown as Hash;
}

export function parse(s: string): Hash {
  assertHash(s);
  return s;
}

export const emptyHash = '00000000000000000000000000000000' as unknown as Hash;

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

// Temp hashes needs to have the same length as non temp hashes. This is
// important because we split B+Tree nodes based on the size and we want the
// size to be the same independent of whether the hash is temp or not.

export const newTempHash = makeNewFakeHashFunction();

/**
 * Creates a new fake hash function.
 * @param prefix The prefix of the hash. If left out the prefix is 't/' which
 * signifies a temp hash.
 */
export function makeNewFakeHashFunction(hashPrefix = 't/'): () => Hash {
  let tempHashCounter = 0;
  return () => {
    // Must not overlap with hashOf results
    return (hashPrefix +
      (tempHashCounter++)
        .toString()
        .padStart(STRING_LENGTH - hashPrefix.length, '0')) as unknown as Hash;
  };
}

export function isHash(v: unknown): v is Hash {
  return typeof v === 'string' && (hashRe.test(v) || tempHashRe.test(v));
}

export function isTempHash(v: unknown): v is Hash {
  return typeof v === 'string' && tempHashRe.test(v);
}

export function assertNotTempHash(hash: Hash): void {
  if (tempHashRe.test(hash as unknown as string)) {
    throw new Error('Unexpected temp hash');
  }
}

export function assertHash(v: unknown): asserts v is Hash {
  if (!isHash(v)) {
    throw new Error(`Invalid hash: '${v}'`);
  }
}

/**
 * Generates a fake hash useful for testing.
 */
export function fakeHash(s: string): Hash {
  const fake = 'fake';
  assert(/[a-v0-9]/.test(s), 'Fake hash must be a valid substring of a hash');
  assert(s.length <= STRING_LENGTH - fake.length, 'Fake hash is too long');
  return (fake +
    s.padStart(STRING_LENGTH - fake.length, '0')) as unknown as Hash;
}
