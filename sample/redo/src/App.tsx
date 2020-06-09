import React, {useEffect, useState} from 'react';
import './App.css';

import Replicache, {REPMHTTPInvoker, ReadTransaction} from 'replicache';
import {diffServerURL, diffServerAuth, batchURL} from './settings';

const repmInvoke = new REPMHTTPInvoker('http://localhost:7002').invoke;

const rep = new Replicache({
  diffServerURL: diffServerURL,
  dataLayerAuth: '1',
  diffServerAuth: diffServerAuth,
  batchURL: batchURL,
  repmInvoke,
});

registerMutations(rep);

function App() {
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  // const [selectedListId, setSelectedListId] = useState<number>(-1);

  // This is not the right way to do this. I just wanted something to show up on
  // the screen.
  useEffect(() => {
    (async () => {
      const todos = await rep.query(allTodosInTx);
      setAllTodos(todos);
    })();
  }, []);

  return (
    <div className="App">
      <header className="App-header">Hello from Replicache!</header>
      <List allTodos={allTodos} />
    </div>
  );
}

export default App;

function registerMutations(rep: Replicache) {}

const prefix = '/todo/';

async function allTodosInTx(tx: ReadTransaction): Promise<Todo[]> {
  return [...(await tx.scan({prefix, limit: 500}))].map(si => si.value as Todo);
}

// function todosInList(allTodos: Todo[], listId: number): Todo[] {
//   const todos = allTodos.filter(todo => todo.listId === listId);
//   todos.sort((t1, t2) => t1.order - t2.order);
//   return todos;
// }

type Todo = {
  id: number;
  listId: number;
  text: string;
  complete: boolean;
  order: number;
};

function List({allTodos}: {allTodos: Todo[]}) {
  return (
    <ul className="App-list">
      {allTodos.map(todo => (
        <li key={todo.id}>
          <input type="checkbox" checked={todo.complete} /> {todo.text}
        </li>
      ))}
    </ul>
  );
}
