import React from 'react';
import type {Todo, MutationFunctions} from './App';
import {ListItem} from './ListItem';

export function List({
  todos,
  mutations,
}: {
  todos: Todo[];
  mutations: MutationFunctions;
}) {
  return (
    <ul className="App-list">
      {todos.map(todo => (
        <ListItem key={todo.id} todo={todo} mutations={mutations} />
      ))}
    </ul>
  );
}
