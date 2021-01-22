import React, {useEffect, useState, useCallback, DependencyList} from 'react';
import './App.css';

import Replicache from 'replicache';
import type {ReadTransaction, WriteTransaction, JSONValue} from 'replicache';
import {diffServerURL, diffServerAuth, batchURL} from './settings';
import {LoginScreen, logout} from './login';
import type {LoginResult} from './login';
import {TodoList} from './TodoList';
import {newOrderBetween} from './order';
import {ListList} from './ListList';

type UpdateTodoArg = Partial<Todo> & {id: number};

export interface MutationFunctions {
  createList(args: {id: number}): Promise<void>;
  createTodo(args: Todo): Promise<void>;
  deleteTodo(args: {id: number}): Promise<void>;
  updateTodo(args: UpdateTodoArg): Promise<void>;
}

function App(): JSX.Element | null {
  const [loginResult, setLoginResult] = useState<LoginResult>();
  const [rep, setRep] = useState<Replicache>();
  const [mutations, setMutations] = useState<MutationFunctions>();

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
      // ESBuild does not correctly deal with import.meta.url.
      wasmModule: '/replicache.wasm',
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

function useSubscribe<R extends JSONValue>(
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

function newRandomId() {
  return (Math.random() * 2 ** 31) | 0;
}

function LoggedInApp(props: LoggedInAppProps) {
  const {rep, mutations, logout, email} = props;

  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const allTodos = useSubscribe(rep, allTodosInTx, []);

  const listIds = useSubscribe(rep, allListsInTx, []);

  const todos = todosInList(allTodos, selectedListId);

  const createTodoCallback = useCallback(() => {
    if (!selectedListId) {
      return;
    }
    const id = newRandomId();

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

  const createListCallback = useCallback(async () => {
    const id = newRandomId();
    await mutations.createList({
      id,
    });
    setSelectedListId(id);
  }, [mutations]);

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
        <button onClick={createTodoCallback} disabled={!selectedListId}>
          Create Todo
        </button>
        <button onClick={createListCallback}>New List</button>
        <button onClick={syncCallback}>Sync</button>
        <button onClick={logout} title="Logout">
          Logged in as {email}
        </button>
      </header>
      <main>
        <ListList
          listIds={listIds}
          onClick={setSelectedListId}
          selectedId={selectedListId}
        />
        <TodoList
          todos={todosInList(allTodos, selectedListId)}
          mutations={mutations}
          rep={rep}
          focusedId={focusedId}
        />
      </main>
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
    async (tx: WriteTransaction, args: {id: number}) => {
      const id = args['id'];
      await del(tx, id);
    },
  );

  const updateTodo = rep.register(
    'updateTodo',
    async (tx: WriteTransaction, args: UpdateTodoArg) => {
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

  const createList = rep.register(
    'createList',
    async (tx: WriteTransaction, {id}: {id: number}) => {
      await tx.put(`/list/${id}`, {id});
    },
  );

  return {createList, createTodo, deleteTodo, updateTodo};
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
  todos.sort((t1, t2) =>
    t1.order === t2.order ? 0 : t1.order < t2.order ? -1 : 1,
  );
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
  order: string;
};
