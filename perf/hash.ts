import {createSHA512} from 'hash-wasm';
import type {IHasher} from 'hash-wasm/dist/lib/WASMInterface';
import {makeRandomStrings} from './data';
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
    textEncoderUtf8(),
    textEncoderUtf16(),
    sha512Native(),
    sha512Wasm(),
    sha512NativeFromStringUtf8(),
    sha512NativeFromStringUtf16(),
    sha512NativeFromStringUtf16ReuseBuffer(),
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

function sha512Native(): Benchmark {
  let randomUint8Arrays: Uint8Array[];
  const results = [];
  return {
    name: 'sha512 native',
    group: 'hash',
    setup() {
      const randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
      randomUint8Arrays = randomStrings.map(stringToUint8Array);
    },
    async run() {
      for (let i = 0; i < randomUint8Arrays.length; i++) {
        const buf = await crypto.subtle.digest('SHA-512', randomUint8Arrays[i]);
        results.push(buf);
      }
    },
  };
}

function sha512Wasm(): Benchmark {
  let hasher: IHasher;
  let randomUint8Arrays: Uint8Array[];
  const results = [];
  return {
    name: 'sha512 wasm',
    group: 'hash',
    async setup() {
      const randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
      randomUint8Arrays = randomStrings.map(stringToUint8Array);
      hasher = await createSHA512();
    },
    async run() {
      for (let i = 0; i < randomUint8Arrays.length; i++) {
        const buf = hasher.init().update(randomUint8Arrays[i]).digest();
        results.push(buf);
      }
    },
  };
}

function sha512NativeFromStringUtf8(): Benchmark {
  let randomStrings: string[];
  const results = [];
  return {
    name: 'sha512 native from string utf8',
    group: 'hash',
    setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        const sum = stringToUint8Array(randomStrings[i]);
        const buf = await crypto.subtle.digest('SHA-512', sum);
        results.push(buf);
      }
    },
  };
}

function sha512NativeFromStringUtf16(): Benchmark {
  let randomStrings: string[];
  const results = [];
  return {
    name: 'sha512 native from string utf16',
    group: 'hash',
    setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        const sum = stringToUint16Array(randomStrings[i]);
        const buf = await crypto.subtle.digest('SHA-512', sum);
        results.push(buf);
      }
    },
  };
}

function sha512NativeFromStringUtf16ReuseBuffer(): Benchmark {
  let randomStrings: string[];
  const results = [];
  let buffer: ArrayBuffer;
  return {
    name: 'sha512 native from string utf16 reuse buffer',
    group: 'hash',
    setup() {
      randomStrings = makeRandomStrings(NUM_STRINGS, STRING_LENGTH);
      buffer = new ArrayBuffer(STRING_LENGTH * 2);
    },
    async run() {
      for (let i = 0; i < randomStrings.length; i++) {
        const sum = new Uint16Array(buffer, 0, randomStrings[i].length);
        for (let j = 0; j < randomStrings[i].length; j++) {
          sum[j] = randomStrings[i].charCodeAt(j);
        }
        const buf = await crypto.subtle.digest('SHA-512', sum);
        results.push(buf);
      }
    },
  };
}
