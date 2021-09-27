// @ts-check

/* eslint-env browser */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export {getAllData, toJS};

// In dev tools, copy paste the below code.
//
// Then run `copy(toJS(await getAllDataAsJS('default')))`. This copies the IDB
// database contents to the clipboard.

/**
 * @param {string} name
 * @returns {Promise<Record<string, unknown>>}
 */
function getAllData(name) {
  const conn = indexedDB.open(name);
  return new Promise(resolve => {
    conn.onsuccess = () => {
      const db = conn.result;
      const tx = db.transaction(['chunks']);
      const store = tx.objectStore('chunks');
      const /** @type Record<string, unknown> */ res = {};
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          //             console.log(cursor.key, cursor.value);
          res[/** @type string */ (cursor.key)] = cursor.value;
          cursor.continue();
        } else {
          resolve(res);
        }
      };
    };
  });
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function toJS(v) {
  switch (typeof v) {
    case 'undefined':
      return 'undefined';
    case 'string':
    case 'boolean':
    case 'number':
      return JSON.stringify(v);
    case 'object': {
      if (v === null) {
        return 'null';
      }
      if (v instanceof Array) {
        return '[' + v.map(toJS).join(',') + ']';
      }
      if (v instanceof Date) {
        return 'new Date(' + v.getTime() + ')';
      }
      if (v instanceof Uint8Array) {
        return 'new Uint8Array([' + v.join(', ') + '])';
      }
      let s = '{ ';
      for (const [k, val] of Object.entries(v)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        s += JSON.stringify(k) + ': ' + toJS(val) + ', ';
      }
      return s + ' }';
    }
    case 'function':
    case 'symbol':
      throw new Error(`Cannot convert ${typeof v} to JS`);
    case 'bigint':
      return v + 'n';
  }
}
