// @ts-check

const RELAXED = { durability: "relaxed" };
const OBJECT_STORE = "chunks";

/**
 * @param {IDBDatabase} idb
 * @return {IDBTransaction}
 */
export function readTransaction(idb) {
  return idb.transaction(OBJECT_STORE, "readonly");
}

/**
 * @param {IDBDatabase} idb
 * @return {IDBTransaction}
 */
export function writeTransaction(idb) {
  // TS does not have type defs for the third options argument yet.
  // @ts-ignore Expected 1-2 arguments, but got 3.ts(2554)
  return idb.transaction(OBJECT_STORE, "readwrite", RELAXED);
}

/**
 * @param {IDBTransaction} tx
 * @return {IDBObjectStore }
 */
export function objectStore(tx) {
  return tx.objectStore(OBJECT_STORE);
}

/**
 * @param {IDBDatabase} idb
 * @return {IDBObjectStore}
 */
export function createObjectStore(idb) {
  return idb.createObjectStore(OBJECT_STORE);
}

/**
 * @param {string} name
 * @return {Promise<IDBDatabase>}
 */
export async function openDatabase(name) {
  const req = indexedDB.open(name);
  req.onupgradeneeded = () => {
    const db = req.result;
    createObjectStore(db);
    db.onversionchange = () => db.close();
  };
  return wrap(req);
}

/**
 * @param {IDBTransaction} tx
 * @param {IDBValidKey | IDBKeyRange} key
 * @return {Promise<any>}
 */
export function dbGet(tx, key) {
  return wrap(objectStore(tx).get(key));
}

/**
 * @param {IDBTransaction} tx
 * @param {string} key
 * @return {Promise<boolean>}
 */
export async function dbHas(tx, key) {
  const c = await wrap(objectStore(tx).count(key));
  return c > 0;
}

/**
 * @param {string} name
 * @return {Promise<IDBDatabase>}
 */
export function dropStore(name) {
  return wrap(indexedDB.deleteDatabase(name));
}

/**
 * @param {IDBTransaction} tx
 * @param {[string, null | Uint8Array][]} entries
 * @return {Promise<WriteState>}
 */
export async function commit(tx, entries) {
  registerTransaction(tx);
  const store = objectStore(tx);
  const ps = entries.map((entry) => {
    const val = entry[1];
    const key = entry[0];
    if (val === null) {
      return wrap(store.delete(key));
    }
    return wrap(store.put(val, key));
  });
  await Promise.all(ps);
  return await transactionState(tx);
}

/**
 * @param {IDBTransaction} tx
 * @return {Promise<WriteState>}
 */
export async function abort(tx) {
  registerTransaction(tx);
  tx.abort();
  return await transactionState(tx);
}

/**
 * @template T
 * @param {IDBRequest<T>} req
 * @return {Promise<T>}
 */
function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** @type {WeakMap<IDBTransaction, Promise<WriteState>>} */
const txStateMap = new WeakMap();

const OPEN = 0;
const COMMITTED = 1;
const ABORTED = 2;

/** @typedef {typeof OPEN | typeof COMMITTED | ABORTED} WriteState */

/**
 * @param {IDBTransaction} tx
 * @return {IDBTransaction}
 */
function registerTransaction(tx) {
  if (txStateMap.has(tx)) {
    throw new Error("invalid state");
  }

  const p = new Promise((resolve, reject) => {
    tx.onabort = () => resolve(ABORTED);
    tx.oncomplete = () => resolve(COMMITTED);
    tx.onerror = () => reject(tx.error);
  });
  txStateMap.set(tx, p);
  return tx;
}

/**
 * @param {IDBTransaction} tx
 * @return {Promise<WriteState>}
 */
export function transactionState(tx) {
  return txStateMap.get(tx) || Promise.resolve(OPEN);
}
