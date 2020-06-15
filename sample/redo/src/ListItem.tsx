import React, {useCallback, FunctionComponent, ReactElement} from 'react';
import type {Todo, MutationFunctions} from './App';
import {Draggable} from 'react-beautiful-dnd';

type ListProps = {todo: Todo; mutations: MutationFunctions; index: number};

export function ListItem(props: ListProps) {
  const {todo, mutations, index} = props;

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
