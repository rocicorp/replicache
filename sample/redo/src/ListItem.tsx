import React, {useCallback} from 'react';
import type {Todo, MutationFunctions} from './App';
import {Draggable} from 'react-beautiful-dnd';

export function ListItem({
  todo,
  mutations,
  index,
}: {
  todo: Todo;
  mutations: MutationFunctions;
  index: number;
}) {
  const changeCallback = useCallback(() => {
    mutations.updateTodo({id: todo.id, complete: !todo.complete});
  }, [todo, mutations]);
  const deleteCallback = useCallback(() => {
    mutations.deleteTodo(todo);
  }, [todo, mutations]);
  return (
    <Draggable draggableId={String(todo.id)} index={index}>
      {provided => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <label>
            <input
              type="checkbox"
              checked={todo.complete}
              onChange={changeCallback}
            />
            <span>{todo.text}</span>
          </label>
          <button onClick={deleteCallback}>Delete</button>
        </li>
      )}
    </Draggable>
  );
}
