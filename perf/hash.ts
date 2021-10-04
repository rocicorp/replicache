import {createSHA512} from 'hash-wasm';
import {hashJSON} from '../src/hash-json';
import type {ReadonlyJSONValue} from '../src/json';
import {randomString, makeRandomStrings} from './data';
import type {Benchmark} from './perf';

const encoder = new TextEncoder();

function stringToUint8Array(s: string): Uint8Array {
  return encoder.encode(s);
}

function stringToUint16Array(s: string): Uint16Array {
  const u = new Uint16Array(s.length);
  for (let i = 0; i < s.length; i++) {
    u[i] = s.charCodeAt(i);
  }
  return u;
}

export function benchmarks(): Array<Benchmark> {
  return [
    // textEncoderUtf8(),
    // textEncoderUtf16(),
    // sha512({wasm: true, utf8: true}),
    // sha512({wasm: true, utf8: false}),
    // sha512({wasm: false, utf8: true}),
    // sha512({wasm: false, utf8: false}),
    hashJSONBenchmark({useHashJSON: true, utf8: false}),
    hashJSONBenchmark({useHashJSON: true, utf8: true}),
    hashJSONBenchmark({useHashJSON: false, utf8: true}),
    hashJSONBenchmark({useHashJSON: false, utf8: false}),
  ];
}

const NUM_STRINGS = 100;
const STRING_LENGTH = 100_000;

function textEncoderUtf8(): Benchmark {
  let randomStrings: string[];
  const results = [];
  return {
    name: 'text encoder utf8',
    group: 'hash',
    setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        results.push(stringToUint8Array(randomStrings[i]));
      }
    },
  };
}

function textEncoderUtf16(): Benchmark {
  let randomStrings: string[];
  const results = [];
  return {
    name: 'text encoder utf16',
    group: 'hash',
    setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        results.push(stringToUint16Array(randomStrings[i]));
      }
    },
  };
}

function sha512({wasm, utf8}: {wasm: boolean; utf8: boolean}): Benchmark {
  let randomStrings: string[];
  const results = [];
  let calculateHash: (
    sum: Uint8Array | Uint16Array,
  ) => Uint8Array | Promise<ArrayBuffer>;
  const toSum = utf8 ? stringToUint8Array : stringToUint16Array;

  return {
    name: `sha512 ${wasm ? 'wasm' : 'native'} from string ${
      utf8 ? 'utf8' : 'utf16'
    }`,
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

function hashJSONBenchmark({
  useHashJSON,
  utf8,
}: {
  useHashJSON: boolean;
  utf8?: boolean;
}): Benchmark {
  const results = [];
  let calculateHash: (
    value: ReadonlyJSONValue,
  ) => Uint8Array | Promise<ArrayBuffer>;
  const toSum = utf8 ? stringToUint8Array : stringToUint16Array;

  return {
    name: `sha512 ${useHashJSON ? 'hashJSON' : 'JSON.stringify'} from string ${
      utf8 ? 'utf8' : 'utf16'
    }`,
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
