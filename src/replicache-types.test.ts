import {Replicache} from './replicache';
import type {WriteTransaction} from './transactions';
import {TEST_LICENSE_KEY} from '@rocicorp/licensing/src/client';
import type {IndexKey} from './db/index.js';

function use(..._args: unknown[]) {
  // do nothing
}

// Only used for type checking
test.skip('mutator optional args [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'test-types',
    mutators: {
      mut: async (tx: WriteTransaction, x: number) => {
        use(tx);
        return x;
      },
      mut2: (tx: WriteTransaction, x: string) => {
        use(tx);
        return x;
      },
      mut3: tx => {
        use(tx);
      },
      mut4: async tx => {
        use(tx);
      },
    },
  });

  const {mut, mut2, mut3, mut4} = rep.mutate;
  const res: number = await mut(42);
  use(res);

  const res2: string = await mut2('s');
  use(res2);

  await mut3();
  //  @ts-expect-error: Expected 0 arguments, but got 1.ts(2554)
  await mut3(42);
  //  @ts-expect-error: Type 'void' is not assignable to type 'number'.ts(2322)
  const res3: number = await mut3();
  use(res3);

  await mut4();
  //  @ts-expect-error: Expected 0 arguments, but got 1.ts(2554)
  await mut4(42);
  //  @ts-expect-error: Type 'void' is not assignable to type 'number'.ts(2322)
  const res4: number = await mut4();
  use(res4);

  // This should be an error!
  // new Replicache({name: 'test-types-2', {
  //   mutators: {
  //     // @ts-expect-error symbol is not a JSONValue
  //     mut5: (tx: WriteTransaction, x: symbol) => {
  //       use(tx, x);
  //       return 42;
  //     },
  //   },
  // });
});

// Only used for type checking
test.skip('Test partial JSONObject [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'test-types',
    mutators: {
      mut: async (tx: WriteTransaction, todo: Partial<Todo>) => {
        use(tx);
        return todo;
      },
    },
  });

  type Todo = {id: number; text: string};

  const {mut} = rep.mutate;
  await mut({});
  await mut({id: 42});
  await mut({text: 'abc'});

  // @ts-expect-error Type '42' has no properties in common with type 'Partial<Todo>'.ts(2559)
  await mut(42);
  // @ts-expect-error Type 'string' is not assignable to type 'number | undefined'.ts(2322)
  await mut({id: 'abc'});
});

// Only used for type checking
test.skip('Test register param [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'test-types',
    mutators: {
      mut: async (tx: WriteTransaction) => {
        use(tx);
      },
      mut2: async (tx: WriteTransaction, x: string) => {
        use(tx, x);
      },
      mut3: async (tx: WriteTransaction, x: string) => {
        use(tx, x);
      },
      mut4: async (tx: WriteTransaction) => {
        use(tx);
      },
    },
  });

  /* eslint-disable prefer-destructuring */
  const mut: () => Promise<void> = rep.mutate.mut;
  use(mut);

  // @ts-expect-error Type 'number' is not assignable to type 'string'.ts(2322)
  const mut2: (x: number) => Promise<void> = rep.mutate.mut2;
  use(mut2);

  // @ts-expect-error Type '(args: string) => Promise<void>' is not assignable to type '() => Promise<void>'.ts(2322)
  const mut3: () => Promise<void> = rep.mutate.mut3;
  use(mut3);

  // This is fine according to the rules of JS/TS
  const mut4: (x: number) => Promise<void> = rep.mutate.mut4;
  use(mut4);
  /* eslint-enable prefer-destructuring */

  new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'test-types',
    mutators: {
      // @ts-expect-error Type '(tx: WriteTransaction, a: string, b: number) =>
      //   Promise<void>' is not assignable to type '(tx: WriteTransaction,
      //   args?: any) => MaybePromise<void | JSONValue>'.ts(2322)
      mut5: async (tx: WriteTransaction, a: string, b: number) => {
        use(tx, a, b);
      },
    },
  });
});

// Only used for type checking
test.skip('Key type for scans [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'test-types',
  });

  await rep.query(async tx => {
    for await (const k of tx.scan({indexName: 'n'}).keys()) {
      // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
      const k2: string = k;
      use(k2);
    }

    for await (const k of tx.scan({indexName: 'n', start: {key: 's'}}).keys()) {
      // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
      const k2: string = k;
      use(k2);
    }

    for await (const k of tx
      .scan({indexName: 'n', start: {key: ['s']}})
      .keys()) {
      // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
      const k2: string = k;
      use(k2);
    }

    for await (const k of tx.scan({start: {key: 'p'}}).keys()) {
      // @ts-expect-error Type 'string' is not assignable to type '[string]'.ts(2322)
      const k2: [string] = k;
      use(k2);
    }

    // @ts-expect-error Type 'number' is not assignable to type 'string | undefined'.ts(2322)
    tx.scan({indexName: 'n', start: {key: ['s', 42]}});

    // @ts-expect-error Type '[string]' is not assignable to type 'string'.ts(2322)
    tx.scan({start: {key: ['s']}});
  });
});

// Only used for type checking
test.skip('mut [type checking only]', async () => {
  type CustomType = {
    n: number;
    s: string;
  };

  interface CustomInterface {
    n: number;
    s: string;
  }

  type ToRecord<T> = {[P in keyof T]: T[P]};

  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'type-checking-only',
    mutators: {
      a: (tx: WriteTransaction) => {
        use(tx);
        return 42;
      },
      b: (tx: WriteTransaction, x: number) => {
        use(tx, x);
        return 'hi';
      },

      // Return void
      c: (tx: WriteTransaction) => {
        use(tx);
      },
      d: (tx: WriteTransaction, x: number) => {
        use(tx, x);
      },

      e: async (tx: WriteTransaction) => {
        use(tx);
        return 42;
      },
      f: async (tx: WriteTransaction, x: number) => {
        use(tx, x);
        return 'hi';
      },

      // Return void
      g: async (tx: WriteTransaction) => {
        use(tx);
      },
      h: async (tx: WriteTransaction, x: number) => {
        use(tx, x);
      },

      // // This should be flagged as an error but I need to use `any` for the
      // // arg since I need covariance and TS uses contravariance here.
      // // @ts-expect-error XXX
      // i: (tx: WriteTransaction, d: Date) =>
      // {use(tx, d);
      // },

      j: async (tx: WriteTransaction, custom: CustomType) => {
        use(tx, custom);
        custom.n as number;
        custom.s as string;
        // @ts-expect-error xxx
        custom.n as boolean;

        await tx.put('c', custom);
      },

      k: async (tx: WriteTransaction, custom: CustomInterface) => {
        use(tx, custom);
        custom.n as number;
        custom.s as string;
        // @ts-expect-error xxx
        custom.n as boolean;

        // @ts-expect-error Index signature is missing in type 'CustomInterface'
        await tx.put('c', custom);
      },

      l: async (tx: WriteTransaction, custom: ToRecord<CustomInterface>) => {
        use(tx, custom);
        custom.n as number;
        custom.s as string;
        // @ts-expect-error xxx
        custom.n as boolean;

        await tx.put('c', custom);
      },
    },
  });

  rep.mutate.a() as Promise<number>;
  rep.mutate.b(4) as Promise<string>;

  rep.mutate.c() as Promise<void>;
  rep.mutate.d(2) as Promise<void>;

  rep.mutate.e() as Promise<number>;
  rep.mutate.f(4) as Promise<string>;

  rep.mutate.g() as Promise<void>;
  rep.mutate.h(2) as Promise<void>;

  // @ts-expect-error Expected 1 arguments, but got 0.ts(2554)
  await rep.mutate.b();
  //@ts-expect-error Argument of type 'null' is not assignable to parameter of type 'number'.ts(2345)
  await rep.mutate.b(null);

  // @ts-expect-error Expected 1 arguments, but got 0.ts(2554)
  await rep.mutate.d();
  //@ts-expect-error Argument of type 'null' is not assignable to parameter of type 'number'.ts(2345)
  await rep.mutate.d(null);

  // @ts-expect-error Expected 1 arguments, but got 0.ts(2554)
  await rep.mutate.f();
  //@ts-expect-error Argument of type 'null' is not assignable to parameter of type 'number'.ts(2345)
  await rep.mutate.f(null);

  // @ts-expect-error Expected 1 arguments, but got 0.ts(2554)
  await rep.mutate.h();
  // @ts-expect-error Argument of type 'null' is not assignable to parameter of type 'number'.ts(2345)
  await rep.mutate.h(null);

  {
    const rep = new Replicache({
      licenseKey: TEST_LICENSE_KEY,
      name: 'type-checking-only',
      mutators: {},
    });
    // @ts-expect-error Property 'abc' does not exist on type 'MakeMutators<{}>'.ts(2339)
    rep.mutate.abc(43);
  }

  {
    const rep = new Replicache({
      licenseKey: TEST_LICENSE_KEY,
      name: 'type-checking-only',
    });
    // @ts-expect-error Property 'abc' does not exist on type 'MakeMutators<{}>'.ts(2339)
    rep.mutate.abc(1, 2, 3);
  }

  {
    const rep = new Replicache({
      licenseKey: TEST_LICENSE_KEY,
      name: 'type-checking-only',
    });
    // @ts-expect-error Property 'abc' does not exist on type 'MakeMutators<{}>'.ts(2339)
    rep.mutate.abc(1, 2, 3);
  }
});

// Only used for type checking
test.skip('scan with index [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'scan-with-index',
  });

  await rep.query(async tx => {
    (await tx.scan({indexName: 'a'}).keys().toArray()) as [
      secondary: string,
      primary: string,
    ][];

    let indexKeys: IndexKey[] = await tx
      .scan({indexName: 'a'})
      .keys()
      .toArray();
    indexKeys = await tx.scan({indexName: 'a', prefix: 'a'}).keys().toArray();
    use(indexKeys);

    // @ts-expect-error Cannot convert Index[] to string[]
    (await tx.scan({indexName: 'a'}).keys().toArray()) as string[];
  });
});

// Only used for type checking
test.skip('scan without index [type checking only]', async () => {
  const rep = new Replicache({
    licenseKey: TEST_LICENSE_KEY,
    name: 'scan-with-index',
  });

  await rep.query(async tx => {
    (await tx.scan().keys().toArray()) as string[];
    (await tx.scan({}).keys().toArray()) as string[];

    let indexKeys: string[] = await tx.scan({}).keys().toArray();
    indexKeys = await tx.scan({prefix: 'a'}).keys().toArray();
    use(indexKeys);

    // @ts-expect-error Cannot convert string[] to IndexKey[]
    (await tx.scan({}).keys().toArray()) as IndexKey[];
  });
});
