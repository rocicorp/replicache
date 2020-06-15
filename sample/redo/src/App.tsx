import React, {useEffect, useState, useCallback} from 'react';
import './App.css';

import Replicache, {
  REPMHTTPInvoker,
  ReadTransaction,
  WriteTransaction,
  Mutator,
} from 'replicache';
import {diffServerURL, diffServerAuth, batchURL} from './settings';
import {LoginScreen, logout} from './login';
import type {LoginResult} from './login';
import {List} from './List';
import {newOrderBetween} from './order';

const repmInvoke = new REPMHTTPInvoker('http://localhost:7002').invoke;

export interface MutationFunctions {
  createTodo: Mutator<void, Todo>;
  deleteTodo: Mutator<void, Todo>;
  updateTodo: Mutator<void, Partial<Todo> & {id: number}>;
}

function App() {
  const [loginResult, setLoginResult] = useState<LoginResult>();
  let [rep, setRep] = useState<Replicache>();
  let [mutations, setMutations] = useState<MutationFunctions>();

  const logoutCallback = useCallback(async () => {
    logout();
    await rep?.close();
    setRep(undefined);
    setLoginResult(undefined);
  }, [rep]);

  useEffect(() => {
    if (!loginResult) {
      return;
    }
    const r = new Replicache({
      name: loginResult.userId,
      diffServerURL,
      dataLayerAuth: loginResult.userId,
      diffServerAuth,
      batchURL,
      repmInvoke,
    });
    r.syncInterval = 1000;
    setRep(r);
    setMutations(registerMutations(r));
    return () => {
      r.close();
    };
  }, [loginResult]);

  if (!loginResult) {
    return <LoginScreen onChange={setLoginResult} />;
  }

  if (!rep || !mutations) {
    return null;
  }

  return (
    <LoggedInApp
      email={loginResult.email}
      rep={rep}
      mutations={mutations}
      logout={logoutCallback}
    />
  );
}

type LoggedInAppProps = {
  rep: Replicache;
  mutations: MutationFunctions;
  logout: () => void;
  email: string;
};

function LoggedInApp(props: LoggedInAppProps) {
  const {rep, mutations, logout, email} = props;

  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [listIds, setListIds] = useState<number[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  useEffect(() => {
    return rep.subscribe(allTodosInTx, {onData: setAllTodos});
  }, [rep]);

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
  }, [rep]);

  const createCallback = useCallback(() => {
    if (!selectedListId) {
      return;
    }
    const id = (Math.random() * 2 ** 31) | 0;

    const todos = todosInList(allTodos, selectedListId);
    const order = newOrderBetween(
      todos.length === 0 ? null : todos[todos.length - 1],
      null,
    );

    mutations.createTodo({
      id,
      listId: selectedListId,
      text: prompt('Enter todo text', 'New item') ?? 'New item',
      complete: false,
      order,
    });
  }, [allTodos, mutations, selectedListId]);

  const syncCallback = useCallback(() => {
    rep.sync();
  }, [rep]);

  if (
    (selectedListId === null || !listIds.includes(selectedListId)) &&
    listIds.length > 0
  ) {
    setSelectedListId(listIds[0]);
  }

  return (
    <div className="App">
      <header className="App-header">Hello from Replicache!</header>
      <button onClick={createCallback} disabled={!selectedListId}>
        Create Todo
      </button>
      <button onClick={syncCallback}>Sync</button>
      <button onClick={logout}>Logout</button>
      <div>Logged in as {email}</div>
      <List
        todos={todosInList(allTodos, selectedListId)}
        mutations={mutations}
        rep={rep}
      />
    </div>
  );
}

export default App;

const prefix = '/todo/';

function registerMutations(rep: Replicache) {
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

  const createTodo = rep.register(
    'createTodo',
    async (tx: WriteTransaction, args: Todo) => {
      await write(tx, args);
    },
  );

  const deleteTodo = rep.register(
    'deleteTodo',
    async (tx: WriteTransaction, args: Todo) => {
      const id = args['id'];
      await del(tx, id);
    },
  );

  const updateTodo = rep.register(
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

  return {createTodo, deleteTodo, updateTodo};
}

async function allTodosInTx(tx: ReadTransaction): Promise<Todo[]> {
  return [...(await tx.scan({prefix, limit: 500}))].map(si => si.value as Todo);
}

function todosInList(allTodos: Todo[], listId: number | null): Todo[] {
  const todos = allTodos.filter(todo => todo.listId === listId);
  todos.sort((t1, t2) => t1.order - t2.order);
  return todos;
}

export type Todo = {
  id: number;
  listId: number;
  text: string;
  complete: boolean;
  order: number;
};
