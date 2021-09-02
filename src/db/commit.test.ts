import {expect} from '@esm-bundle/chai';
import * as flatbuffers from 'flatbuffers';
import {Chunk} from '../dag/mod';
import * as dag from '../dag/mod';
import {MemStore} from '../kv/mod';
import {
  Commit,
  fromChunk,
  IndexChangeMeta,
  LocalMeta,
  newIndexChange as commitNewIndexChange,
  newLocal as commitNewLocal,
  newSnapshot as commitNewSnapshot,
  SnapshotMeta,
} from './commit';
import {IndexDefinition as IndexDefinitionFB} from './generated/commit/index-definition';
import {IndexRecord as IndexRecordFB} from './generated/commit/index-record';
import {Meta as MetaFB} from './generated/commit/meta';
import {MetaTyped as MetaTypedFB} from './generated/commit/meta-typed';
import {Commit as CommitFB} from './generated/commit/commit';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from './test-helpers';
import {LocalMeta as LocalMetaFB} from './generated/commit/local-meta';
import {SnapshotMeta as SnapshotMetaFB} from './generated/commit/snapshot-meta';
import {IndexChangeMeta as IndexChangeMetaFB} from './generated/commit/index-change-meta';
import {initHasher} from '../hash';
import type {JSONValue} from '../json';
import * as utf8 from '../utf8';
import {b} from '../test-util';
setup(async () => {
  await initHasher();
});

test('base snapshot', async () => {
  const store = new dag.Store(new MemStore());
  const chain: Chain = [];
  await addGenesis(chain, store);
  let genesisHash = chain[0].chunk.hash;
  await store.withRead(async dagRead => {
    expect(
      (await Commit.baseSnapshot(genesisHash, dagRead)).chunk.hash,
    ).to.equal(genesisHash);
  });

  await addLocal(chain, store);
  await addIndexChange(chain, store);
  await addLocal(chain, store);
  genesisHash = chain[0].chunk.hash;
  await store.withRead(async dagRead => {
    expect(
      (await Commit.baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead))
        .chunk.hash,
    ).to.equal(genesisHash);
  });

  await addSnapshot(chain, store, undefined);
  const baseHash = await store.withRead(async dagRead => {
    const baseHash = await dagRead.getHead('main');
    expect(
      (await Commit.baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead))
        .chunk.hash,
    ).to.equal(baseHash);
    return baseHash;
  });

  await addLocal(chain, store);
  await addLocal(chain, store);
  await store.withRead(async dagRead => {
    expect(
      (await Commit.baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead))
        .chunk.hash,
    ).to.equal(baseHash);
  });
});

test('local mutations', async () => {
  const store = new dag.Store(new MemStore());
  const chain: Chain = [];
  await addGenesis(chain, store);
  const genesisHash = chain[0].chunk.hash;
  await store.withRead(async dagRead => {
    expect(await Commit.localMutations(genesisHash, dagRead)).to.have.lengthOf(
      0,
    );
  });

  await addLocal(chain, store);
  await addIndexChange(chain, store);
  await addLocal(chain, store);
  await addIndexChange(chain, store);
  const headHash = chain[chain.length - 1].chunk.hash;
  const commits = await store.withRead(dagRead =>
    Commit.localMutations(headHash, dagRead),
  );
  expect(commits).to.have.lengthOf(2);
  expect(commits[0]).to.deep.equal(chain[3]);
  expect(commits[1]).to.deep.equal(chain[1]);
});

test('chain', async () => {
  const store = new dag.Store(new MemStore());
  const chain: Chain = [];
  await addGenesis(chain, store);

  let got = await store.withRead(dagRead =>
    Commit.chain(chain[chain.length - 1].chunk.hash, dagRead),
  );

  expect(got).to.have.lengthOf(1);
  expect(got[0]).to.deep.equal(chain[0]);

  await addSnapshot(chain, store, undefined);
  await addLocal(chain, store);
  await addIndexChange(chain, store);
  const headHash = chain[chain.length - 1].chunk.hash;
  got = await store.withRead(dagRead => Commit.chain(headHash, dagRead));
  expect(got).to.have.lengthOf(3);
  expect(got[0]).to.deep.equal(chain[3]);
  expect(got[1]).to.deep.equal(chain[2]);
  expect(got[2]).to.deep.equal(chain[1]);
});

test('load roundtrip', async () => {
  const t = (chunk: Chunk, expected: Commit | Error) => {
    if (expected instanceof Error) {
      expect(() => fromChunk(chunk)).to.throw(
        expected.constructor,
        expected.message,
      );
    } else {
      const actual = fromChunk(chunk);
      expect(actual).to.deep.equal(expected);
    }
  };

  for (const basisHash of [undefined, '', 'hash']) {
    t(
      await makeCommit(
        b => makeLocalMeta(b, 0, 'mutname', 42, 'original'),
        basisHash,
        'value',
        basisHash === undefined ? ['value'] : ['value', basisHash],
        [],
      ),
      await commitNewLocal(
        basisHash,
        0,
        'mutname',
        42,
        'original',
        'value',
        [],
      ),
    );
  }

  t(
    await makeCommit(
      b => makeLocalMeta(b, 0, undefined, 43, ''),
      '',
      'value-hash',
      ['', ''],
      undefined,
    ),
    new Error('Missing mutator name'),
  );
  t(
    await makeCommit(
      b => makeLocalMeta(b, 0, '', undefined, ''),
      '',
      'value-hash',
      ['', ''],
      undefined,
    ),
    new Error('Missing mutator name'),
  );

  for (const basisHash of [undefined, '', 'hash']) {
    t(
      await makeCommit(
        b => makeLocalMeta(b, 0, 'mutname', 44, undefined),
        basisHash,
        'vh',
        basisHash === undefined ? ['vh'] : ['vh', basisHash],
        undefined,
      ),
      await commitNewLocal(basisHash, 0, 'mutname', 44, undefined, 'vh', []),
    );
  }

  t(
    await makeCommit(
      b => makeLocalMeta(b, 0, 'mutname', 45, ''),
      '',
      undefined,
      ['', ''],
      undefined,
    ),
    new Error('Missing value hash'),
  );

  const cookie = {foo: 'bar'};
  for (const basisHash of [undefined, '', 'hash']) {
    t(
      await makeCommit(
        fb => makeSnapshotMeta(fb, 0, {foo: 'bar'}),
        basisHash,
        'vh',
        ['vh'],
        undefined,
      ),
      await commitNewSnapshot(basisHash, 0, cookie, 'vh', []),
    );
  }
  t(
    await makeCommit(
      b => makeSnapshotMeta(b, 0, undefined),
      '',
      'vh',
      ['vh', ''],
      undefined,
    ),
    new Error('Missing cookie'),
  );

  for (const basisHash of [undefined, '', 'hash']) {
    t(
      await makeCommit(
        b => makeIndexChangeMeta(b, 0),
        basisHash,
        'value',
        basisHash === undefined ? ['value'] : ['value', basisHash],
        [],
      ),
      await commitNewIndexChange(basisHash, 0, 'value', []),
    );
  }
});

test('accessors', async () => {
  const local = fromChunk(
    await makeCommit(
      b => makeLocalMeta(b, 1, 'foo_mutator', 42, 'original_hash'),
      'basis_hash',
      'value_hash',
      ['value_hash', 'basis_hash'],
      undefined,
    ),
  );
  if (local.meta().typed().type === MetaTypedFB.LocalMeta) {
    const lm = local.meta().typed() as LocalMeta;
    expect(lm.mutationID()).to.equal(1);
    expect(lm.mutatorName()).to.equal('foo_mutator');
    expect(lm.mutatorArgsJSON()).to.equal(42);
    expect(lm.originalHash()).to.equal('original_hash');
  } else {
    throw new Error('unexpected type');
  }
  expect(local.meta().basisHash()).to.equal('basis_hash');
  expect(local.valueHash()).to.equal('value_hash');
  expect(local.nextMutationID()).to.equal(2);

  const snapshot = fromChunk(
    await makeCommit(
      fb => makeSnapshotMeta(fb, 2, 'cookie 2'),
      'basis_hash 2',
      'value_hash 2',
      ['value_hash 2', 'basis_hash 2'],
      undefined,
    ),
  );
  if (snapshot.meta().typed().type === MetaTypedFB.SnapshotMeta) {
    const sm = snapshot.meta().typed() as SnapshotMeta;
    expect(sm.lastMutationID()).to.equal(2);
    expect(sm.cookieJSON()).to.deep.equal(b`"cookie 2"`);
    expect(sm.cookieJSONValue()).to.deep.equal('cookie 2');
  } else {
    throw new Error('unexpected type');
  }
  expect(snapshot.meta().basisHash()).to.equal('basis_hash 2');
  expect(snapshot.valueHash()).to.equal('value_hash 2');
  expect(snapshot.nextMutationID()).to.equal(3);

  const indexChange = fromChunk(
    await makeCommit(
      b => makeIndexChangeMeta(b, 3),
      'basis_hash 3',
      'value_hash 3',
      ['value_hash 3', 'basis_hash 3'],
      undefined,
    ),
  );
  if (indexChange.meta().typed().type === MetaTypedFB.IndexChangeMeta) {
    const ic = indexChange.meta().typed() as IndexChangeMeta;
    expect(ic.lastMutationID()).to.equal(3);
  } else {
    throw new Error('unexpected type');
  }
  expect(indexChange.meta().basisHash()).to.equal('basis_hash 3');
  expect(indexChange.valueHash()).to.equal('value_hash 3');
  expect(indexChange.mutationID()).to.equal(3);
});

type MakeIndexDefinition = {
  name: string | undefined;
  keyPrefix: Uint8Array | undefined;
  jsonPointer: string | undefined;
};

type MakeIndex = {
  definition: MakeIndexDefinition | undefined;
  valueHash: string | undefined;
};

async function makeCommit(
  typedMetaBuilder: (
    builder: flatbuffers.Builder,
  ) => [MetaTypedFB, number] | undefined,
  basisHash: string | undefined,
  valueHash: string | undefined,
  refs: string[],
  indexes: MakeIndex[] | undefined,
): Promise<Chunk> {
  const builder = new flatbuffers.Builder();
  const typedMeta = typedMetaBuilder?.(builder);
  const meta = MetaFB.createMeta(
    builder,
    basisHash !== undefined ? builder.createString(basisHash) : 0,
    typedMeta !== undefined ? typedMeta[0] : MetaTypedFB.NONE,
    typedMeta !== undefined ? typedMeta[1] : 0,
  );

  function makeIndex(
    builder: flatbuffers.Builder,
    makeIndex: MakeIndex,
  ): number {
    const definition =
      makeIndex.definition === undefined
        ? 0
        : IndexDefinitionFB.createIndexDefinition(
            builder,
            makeIndex.definition.name === undefined
              ? 0
              : builder.createString(makeIndex.definition.name),
            makeIndex.definition.keyPrefix === undefined
              ? 0
              : IndexDefinitionFB.createKeyPrefixVector(
                  builder,
                  makeIndex.definition.keyPrefix,
                ),
            makeIndex.definition.jsonPointer === undefined
              ? 0
              : builder.createString(makeIndex.definition.jsonPointer),
          );
    return IndexRecordFB.createIndexRecord(
      builder,
      definition,
      valueHash === undefined ? 0 : builder.createString(valueHash),
    );
  }

  const fbIndexes: number[] = [];
  if (indexes !== undefined) {
    for (const mi of indexes) {
      fbIndexes.push(makeIndex(builder, mi));
    }
  }
  const commit = CommitFB.createCommit(
    builder,
    meta,
    valueHash === undefined ? 0 : builder.createString(valueHash),
    CommitFB.createIndexesVector(builder, fbIndexes),
  );
  builder.finish(commit);
  const data = builder.asUint8Array();
  return Chunk.new(data, refs);
}

function makeLocalMeta(
  builder: flatbuffers.Builder,
  mutation_id: number,
  mutatorName: string | undefined,
  mutatorArgsJson: JSONValue | undefined,
  originalHash: string | undefined,
): [MetaTypedFB, number] {
  const localMeta = LocalMetaFB.createLocalMeta(
    builder,
    builder.createLong(mutation_id, 0),
    mutatorName === undefined ? 0 : builder.createString(mutatorName),
    mutatorArgsJson === undefined
      ? 0
      : LocalMetaFB.createMutatorArgsJsonVector(
          builder,
          utf8.encode(JSON.stringify(mutatorArgsJson)),
        ),
    originalHash === undefined ? 0 : builder.createString(originalHash),
  );
  return [MetaTypedFB.LocalMeta, localMeta];
}

function makeSnapshotMeta(
  builder: flatbuffers.Builder,
  lastMutationId: number,
  cookieJSON: JSONValue | undefined,
): [MetaTypedFB, number] {
  const cookieBytes = utf8.encode(JSON.stringify(cookieJSON));
  const snapshotMeta = SnapshotMetaFB.createSnapshotMeta(
    builder,
    builder.createLong(lastMutationId, 0),
    cookieJSON === undefined
      ? 0
      : SnapshotMetaFB.createCookieJsonVector(builder, cookieBytes),
  );
  return [MetaTypedFB.SnapshotMeta, snapshotMeta];
}

function makeIndexChangeMeta(
  builder: flatbuffers.Builder,
  lastMutationId: number,
): [MetaTypedFB, number] {
  const indexChangeMeta = IndexChangeMetaFB.createIndexChangeMeta(
    builder,
    builder.createLong(lastMutationId, 0),
  );
  return [MetaTypedFB.IndexChangeMeta, indexChangeMeta];
}
