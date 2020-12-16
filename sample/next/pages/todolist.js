import Replicache from 'replicache';
import {useCallback, useEffect, useState} from 'react';

const rep = new Replicache({
  diffServerURL: 'https://serve.replicache.dev/pull',
  diffServerAuth: '1',
  batchURL: 'https://replicache-sample-todo.now.sh/serve/replicache-batch',
  dataLayerAuth: '2',
});

function useSubscribe(query, defaultValue, deps) {
  const [snapshot, setSnapshot] = useState(defaultValue);
  const q = useCallback(query, deps);
  useEffect(() => rep.subscribe(q, {onData: setSnapshot}), [q]);
  return snapshot;
}

export default function TodoList() {
  const todos = useSubscribe(
    async tx => {
      const values = [];
      for await (const v of tx.scan({prefix: '/todo/'})) {
        values.push(v);
      }
      return values.sort((v1, v2) =>
        v1.order === v2.order ? 0 : v1.order < v2.order ? -1 : 1,
      );
    },
    [],
    [],
  );
  return (
    <table>
      <tbody>
        {todos.map(todo => (
          <tr key={todo.id}>
            <td>{todo.complete ? '☑' : '◻️'}</td>
            <td>{todo.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
