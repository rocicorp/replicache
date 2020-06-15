import React, {useCallback} from 'react';
import type {Todo, MutationFunctions} from './App';
import {ListItem} from './ListItem';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';
import type {DropResult} from 'react-beautiful-dnd';
import type Replicache from '../../../out.cjs/mod';
import {newOrderBetween} from './order';

type ListProps = {
  todos: Todo[];
  mutations: MutationFunctions;
  rep: Replicache;
};

export const List = React.memo(
  (props: ListProps) => {
    const {todos, mutations, rep} = props;
    const onDragEnd = useCallback(
      (result: DropResult) => {
        if (!result.destination) {
          return;
        }

        if (result.destination.index === result.source.index) {
          return;
        }

        handleReorder(
          result.source.index,
          result.destination.index,
          todos,
          rep,
          mutations.updateTodo,
        );

        // Also mutate the array. If we do not do this we flicker a bit... It
        // seems like this is required by react-beautiful-dnd.
        const [removed] = todos.splice(result.source.index, 1);
        todos.splice(result.destination.index, 0, removed);
      },
      [todos, rep, mutations],
    );

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {provided => (
            <ul
              className="App-list"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {todos.map((todo, index) => (
                <ListItem
                  key={todo.id}
                  todo={todo}
                  mutations={mutations}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    );
  },
  (prevProps, nextProps) => {
    const prevTodos = prevProps.todos;
    const nextTodos = nextProps.todos;
    return (
      prevTodos.length === nextTodos.length &&
      prevTodos.every((t1, i) => todosEqual(t1, nextTodos[i]))
    );
  },
);

function todosEqual(t1: Todo, t2: Todo): boolean {
  return (
    t1.id === t2.id &&
    t1.listId === t2.listId &&
    t1.text === t2.text &&
    t1.complete === t2.complete &&
    t1.order === t2.order
  );
}

async function handleReorder(
  oldIndex: number,
  newIndex: number,
  todos: Todo[],
  rep: Replicache,
  updateTodo: MutationFunctions['updateTodo'],
) {
  if (oldIndex === newIndex) {
    return;
  }

  if (newIndex === todos.length && oldIndex === todos.length - 1) {
    return;
  }

  let id = todos[oldIndex].id;
  let left: Todo | null = null;
  let right: Todo | null = null;
  if (newIndex === 0) {
    right = todos[0];
  } else if (newIndex === todos.length - 1) {
    left = todos[todos.length - 1];
  } else {
    if (newIndex > oldIndex) {
      left = todos[newIndex];
      right = todos[newIndex + 1];
    } else {
      left = todos[newIndex - 1];
      right = todos[newIndex];
    }
  }

  const order = newOrderBetween(left, right);
  await updateTodo({id, order});
  rep.sync();
}
