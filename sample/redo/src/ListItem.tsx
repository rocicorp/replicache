import React, {useCallback} from 'react';
import type {Todo, MutationFunctions} from './App';

export function ListItem({
  todo,
  mutations,
}: {
  todo: Todo;
  mutations: MutationFunctions;
}) {
  const changeCallback = useCallback(() => {
    mutations.updateTodo({id: todo.id, complete: !todo.complete});
  }, [todo, mutations]);
  const deleteCallback = useCallback(() => {
    mutations.deleteTodo(todo);
  }, [todo, mutations]);
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.complete}
          onChange={changeCallback}
        />{' '}
        {todo.text}
      </label>
      <button onClick={deleteCallback}>Delete</button>
    </li>
  );
}
