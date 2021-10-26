import {createSHA512} from 'hash-wasm';
import {hashJSON} from '../src/hash-json';
import type {ReadonlyJSONValue} from '../src/json';
import {randomString, makeRandomStrings} from './data';
import type {Benchmark} from './perf';

const encoder = new TextEncoder();

function stringToUint8Array(s: string): Uint8Array {
  return encoder.encode(s);
}

export function benchmarks(): Array<Benchmark> {
  return [
    sha512({wasm: true}),
    sha512({wasm: false}),
    hashJSONBenchmark({useHashJSON: true}),
    hashJSONBenchmark({useHashJSON: false}),
  ];
}

const NUM_STRINGS = 100;
const STRING_LENGTH = 100_000;

function sha512({wasm}: {wasm: boolean}): Benchmark {
  let randomStrings: string[];
  const results = [];
  let calculateHash: (
    sum: Uint8Array | Uint16Array,
  ) => Uint8Array | Promise<ArrayBuffer>;
  const toSum = stringToUint8Array;

  return {
    name: `sha512 ${wasm ? 'wasm' : 'native'}`,
    group: 'hash',
    async setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
      if (wasm) {
        const hasher = await createSHA512();
        calculateHash = sum => hasher.init().update(sum).digest('binary');
      } else {
        calculateHash = sum => crypto.subtle.digest('SHA-512', sum);
      }
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        const sum = toSum(randomStrings[i]);
        const buf = await calculateHash(sum);
        results.push(buf);
      }
    },
  };
}

const testObject1 = [
  true,
  false,
  null,
  0,
  1.23,
  42,
  256,
  -127,
  -1,
  -1e50,
  makeRandomStrings(10, 10000),
  Object.fromEntries(
    Array.from({length: 10}, () => [randomString(10), randomString(10000)]),
  ),
];

const testObject = Array.from({length: 10}, () => testObject1);

function hashJSONBenchmark({useHashJSON}: {useHashJSON: boolean}): Benchmark {
  const results = [];
  let calculateHash: (
    value: ReadonlyJSONValue,
  ) => Uint8Array | Promise<ArrayBuffer>;
  const toSum = stringToUint8Array;

  return {
    name: `sha512 ${useHashJSON ? 'hashJSON' : 'JSON.stringify'}`,
    group: 'hash',
    async setup() {
      const hasher = await createSHA512();
      if (useHashJSON) {
        calculateHash = value => {
          hasher.init();
          hashJSON(value, hasher, toSum);
          return hasher.digest('binary');
        };
      } else {
        calculateHash = value => {
          hasher.init();
          hasher.update(toSum(JSON.stringify(value)));
          return hasher.digest('binary');
        };
      }
    },
    async run() {
      // for (let i = 0; i < 10; i++) {
      const buf = await calculateHash(testObject);
      results.push(buf);
      // }
    },
  };
}
