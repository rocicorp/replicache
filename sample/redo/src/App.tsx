import React, {useEffect, useState} from 'react';
import './App.css';

import Replicache, {
  REPMHTTPInvoker,
  ReadTransaction,
  WriteTransaction,
  Mutator,
} from 'replicache';
import {diffServerURL, diffServerAuth, batchURL} from './settings';

const repmInvoke = new REPMHTTPInvoker('http://localhost:7002').invoke;

const rep = new Replicache({
  diffServerURL: diffServerURL,
  dataLayerAuth: '1',
  diffServerAuth: diffServerAuth,
  batchURL: batchURL,
  repmInvoke,
});
rep.syncInterval = 1000;

let createTodo: Mutator<void, Todo>;
let deleteTodo: Mutator<void, Todo>;
let updateTodo: Mutator<void, Partial<Todo> & {id: number}>;

registerMutations(rep);

function App() {
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [listIds, setListIds] = useState<number[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  useEffect(() => {
    return rep.subscribe(allTodosInTx, {onData: setAllTodos});
  }, []);

  useEffect(() => {
    return rep.subscribe(
      async (tx: ReadTransaction) => {
        return [...(await tx.scan({prefix: '/list/', limit: 500}))].map(
          item => (item.value as {id: number}).id,
        );
      },
      {
        onData: setListIds,
      },
    );
  }, []);

  if (
    (selectedListId === null || !listIds.includes(selectedListId)) &&
    listIds.length > 0
  ) {
    setSelectedListId(listIds[0]);
  }

  return (
    <div className="App">
      <header className="App-header">Hello from Replicache!</header>
      <List allTodos={todosInList(allTodos, selectedListId)} />
    </div>
  );
}

export default App;

const prefix = '/todo/';

const addPrefix = (id: number) => `${prefix}${id}`;

async function read(
  tx: ReadTransaction,
  id: number,
): Promise<Todo | undefined> {
  const data = await tx.get(addPrefix(id));
  return data as Todo | undefined;
}

function write(tx: WriteTransaction, todo: Todo): Promise<void> {
  const key = addPrefix(todo.id);
  return tx.put(key, todo);
}

function del(tx: WriteTransaction, id: number): Promise<boolean> {
  return tx.del(addPrefix(id));
}

function registerMutations(rep: Replicache) {
  createTodo = rep.register(
    'createTodo',
    async (tx: WriteTransaction, args: Todo) => {
      await write(tx, args);
    },
  );

  deleteTodo = rep.register(
    'deleteTodo',
    async (tx: WriteTransaction, args: Todo) => {
      const id = args['id'];
      await del(tx, id);
    },
  );

  console.log(createTodo, deleteTodo);

  updateTodo = rep.register(
    'updateTodo',
    async (tx: WriteTransaction, args: Partial<Todo> & {id: number}) => {
      const {id} = args;
      const todo = await read(tx, id);
      if (!todo) {
        console.info(
          'Warning: Possible conflict - Specified Todo $id is not present.' +
            ' Skipping reorder.',
        );
        return;
      }
      todo.text = args['text'] ?? todo.text;
      todo.complete = args['complete'] ?? todo.complete;
      todo.order = args['order'] ?? todo.order;
      await write(tx, todo);
    },
  );
}

async function allTodosInTx(tx: ReadTransaction): Promise<Todo[]> {
  return [...(await tx.scan({prefix, limit: 500}))].map(si => si.value as Todo);
}

function todosInList(allTodos: Todo[], listId: number | null): Todo[] {
  const todos = allTodos.filter(todo => todo.listId === listId);
  todos.sort((t1, t2) => t1.order - t2.order);
  return todos;
}

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
        <ListItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function ListItem({todo}: {todo: Todo}) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.complete}
          onChange={() => {
            updateTodo({id: todo.id, complete: !todo.complete});
          }}
        />{' '}
        {todo.text}
      </label>
    </li>
  );
}
