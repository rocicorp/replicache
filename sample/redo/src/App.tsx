import React, {useEffect, useState, useCallback, DependencyList} from 'react';
import './App.css';

import Replicache, {
  REPMHTTPInvoker,
  REPMWasmInvoker,
  ReadTransaction,
  WriteTransaction,
  Mutator,
} from 'replicache';
import wasmPath from 'replicache/out/wasm/debug/replicache_client_bg';
import {diffServerURL, diffServerAuth, batchURL} from './settings';
import {LoginScreen, logout} from './login';
import type {LoginResult} from './login';
import {List} from './List';
import {newOrderBetween} from './order';

const repmInvoker = process.env.REACT_APP_HTTP_INVOKE
  ? new REPMHTTPInvoker('http://localhost:7002')
  : new REPMWasmInvoker(fetch(String(wasmPath)));

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
      repmInvoker,
    });
    r.syncInterval = 60 * 1000;
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

function useSubscribe<R>(
  rep: Replicache,
  query: (tx: ReadTransaction) => Promise<R>,
  def: R,
  deps: DependencyList = [],
) {
  const [snapshot, setSnapshot] = useState<R>(def);
  const q = useCallback(query, deps);
  useEffect(() => {
    return rep.subscribe(q, {onData: setSnapshot});
  }, [rep, q]);
  return snapshot;
}

type LoggedInAppProps = {
  rep: Replicache;
  mutations: MutationFunctions;
  logout: () => void;
  email: string;
};

function LoggedInApp(props: LoggedInAppProps) {
  const {rep, mutations, logout, email} = props;

  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const allTodos = useSubscribe(rep, allTodosInTx, []);

  const listIds = useSubscribe(rep, allListsInTx, []);

  const todos = todosInList(allTodos, selectedListId);

  const createCallback = useCallback(() => {
    if (!selectedListId) {
      return;
    }
    const id = (Math.random() * 2 ** 31) | 0;

    const order = newOrderBetween(
      todos.length === 0 ? null : todos[todos.length - 1],
      null,
    );

    setFocusedId(id);
    mutations.createTodo({
      id,
      listId: selectedListId,
      text: '',
      complete: false,
      order,
    });
  }, [todos, selectedListId, mutations]);

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
      <header className="App-header">Todo</header>
      <header className="App-sub-header">
        <button onClick={createCallback} disabled={!selectedListId}>
          Create Todo
        </button>
        <button onClick={syncCallback}>Sync</button>
        <button onClick={logout} title="Logout">
          Logged in as {email}
        </button>
      </header>
      <List
        todos={todosInList(allTodos, selectedListId)}
        mutations={mutations}
        rep={rep}
        focusedId={focusedId}
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
      todo.text = args.text ?? todo.text;
      todo.complete = args.complete ?? todo.complete;
      todo.order = args.order ?? todo.order;
      await write(tx, todo);
    },
  );

  return {createTodo, deleteTodo, updateTodo};
}

async function allTodosInTx(tx: ReadTransaction): Promise<Todo[]> {
  const todos: Todo[] = [];
  for await (const value of tx.scan({prefix})) {
    todos.push(value as Todo);
  }
  return todos;
}

function todosInList(allTodos: Todo[], listId: number | null): Todo[] {
  const todos = allTodos.filter(todo => todo.listId === listId);
  todos.sort((t1, t2) => t1.order - t2.order);
  return todos;
}

async function allListsInTx(tx: ReadTransaction): Promise<number[]> {
  const listIds: number[] = [];
  for await (const value of tx.scan({prefix: '/list/'})) {
    listIds.push((value as {id: number}).id);
  }
  return listIds;
}

export type Todo = {
  id: number;
  listId: number;
  text: string;
  complete: boolean;
  order: number;
};
