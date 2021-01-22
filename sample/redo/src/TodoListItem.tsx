import React, {useCallback, ChangeEvent, KeyboardEvent} from 'react';
import type {Todo, MutationFunctions} from './App';
import {Draggable} from 'react-beautiful-dnd';
import DeleteIcon from './icons/delete-24px';
import DragIndicator from './icons/drag-indicator-24px';

type ListProps = {
  todo: Todo;
  mutations: MutationFunctions;
  index: number;
  focusedId: number | null;
};

export function TodoListItem(props: ListProps): JSX.Element {
  const {todo, mutations, index, focusedId} = props;

  const changeCompleteCallback = useCallback(() => {
    mutations.updateTodo({id: todo.id, complete: !todo.complete});
  }, [todo, mutations]);

  const onBlurCallback = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      mutations.updateTodo({id: todo.id, text: e.target.value});
    },
    [todo, mutations],
  );

  const onKeydownCallback = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const {value} = e.target as HTMLInputElement;
      if (e.keyCode === 14) {
        // Enter
        mutations.updateTodo({id: todo.id, text: value});
      }
    },
    [todo, mutations],
  );

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
          <DragIndicator />
          <label>
            <input
              type="checkbox"
              checked={todo.complete}
              onChange={changeCompleteCallback}
            />
            <input
              type="text"
              defaultValue={todo.text}
              onBlur={onBlurCallback}
              onKeyDown={onKeydownCallback}
              autoFocus={todo.id === focusedId}
            />
          </label>
          <button onClick={deleteCallback} title="Delete">
            <DeleteIcon />
          </button>
        </li>
      )}
    </Draggable>
  );
}
