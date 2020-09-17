let activeDrag = null;

async function handleDragStart(
  e,
  targetID,
  startIndex,
  getCurrentTodos,
  handleRender,
  handleDragEnd,
) {
  const target = document.querySelectorAll('.todo-item')[startIndex];
  activeDrag = {
    targetID,
    startIndex,
    getCurrentTodos,
    handleRender,
    handleDragEnd,
    startY: e.pageY,
    itemHeight: target.offsetHeight,
  };
  document.body.classList.add('dragging');
  activeDrag.handleRender(activeDrag.getCurrentTodos());
  e.preventDefault();
}

async function handleDragMove(e) {
  if (!activeDrag) {
    return;
  }

  const dPx = e.pageY - activeDrag.startY;
  const dItem = Math.round(dPx / activeDrag.itemHeight);
  const todos = activeDrag.getCurrentTodos();
  const newIndex = Math.max(
    0,
    Math.min(todos.length, activeDrag.startIndex + dItem),
  );
  const currentIndex = todos.findIndex(todo => todo.id == activeDrag.targetID);
  if (currentIndex == -1) {
    handleDragEnd();
    return;
  }
  if (newIndex == currentIndex) {
    return;
  }

  const dragTodos = [...activeDrag.getCurrentTodos()];
  const [todo] = dragTodos.splice(currentIndex, 1);
  dragTodos.splice(newIndex, 0, todo);
  activeDrag.handleRender(dragTodos);
}

async function handleDragEnd() {
  document.body.classList.remove('dragging');
  if (!activeDrag) {
    return;
  }

  const todos = activeDrag.getCurrentTodos();
  const currentIndex = todos.findIndex(todo => todo.id == activeDrag.targetID);
  if (currentIndex == -1) {
    console.log(`todo ${todo.id} no longer present on dragend`);
    return;
  }

  const prev = currentIndex == 0 ? 0 : todos[currentIndex - 1].order;
  const next =
    currentIndex == todos.length - 1 ? 1 : todos[currentIndex + 1].order;
  const order = prev + (next - prev) / 2;
  await activeDrag.handleDragEnd(activeDrag.targetID, order);
  activeDrag = null;
}

function isDragging(id) {
  return activeDrag?.targetID == id;
}

document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);

export {handleDragStart, isDragging};
