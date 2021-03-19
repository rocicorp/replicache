// @ts-check

const RELAXED = {durability: "relaxed"};
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
