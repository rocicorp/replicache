import Replicache from 'replicache';
import {useCallback, useEffect, useState} from 'react';

const rep = new Replicache({
  wasmModule: 'replicache/wasm/release/replicache_client_bg.wasm',
  diffServerURL: 'https://serve.replicache.dev/pull',
  diffServerAuth: '1',
  batchURL: 'https://replicache-sample-todo.now.sh/serve/replicache-batch',
  dataLayerAuth: '2',
});

function useSubscribe(query, def, deps) {
  const [snapshot, setSnapshot] = useState(def);
  const q = useCallback(query, deps);
  useEffect(() => {
    return rep.subscribe(q, {onData: setSnapshot});
  }, [q]);
  return snapshot;
}

export default function TodoList() {
  const todos = useSubscribe(
    async tx => tx.scanAll({prefix: '/todo/'}),
    [],
    [],
  ).sort(([k1, v1], [k2, v2]) => v1.order - v2.order);
  return (
    <table border="1" width="100%">
      {todos.map(([id, todo]) => (
        <tr>
          <td>{todo.complete ? '☑' : '◻️'}</td>
          <td>{todo.text}</td>
        </tr>
      ))}
    </table>
  );
}
