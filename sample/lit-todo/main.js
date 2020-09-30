import {handleDragStart, isDragging} from './drag.js';
import Replicache, {REPMWasmInvoker} from 'replicache/out/mod.js';
import {html, render} from 'lit-html';
import {classMap} from 'lit-html/directives/class-map.js';
import {live} from 'lit-html/directives/live';
import {repeat} from 'lit-html/directives/repeat.js';
import '@material/mwc-checkbox/mwc-checkbox.js';
import '@material/mwc-fab';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar/mwc-top-app-bar.js';

const key = id => `/todo/${id}`;

let rep = new Replicache({
  // URL of the diff server to use. The diff server periodically fetches
  // the 'client view' from your service and returns any delta. You can
  // use our hosted diff server (as here) or a local diff server, which
  // is useful during development. See
  // https://github.com/rocicorp/replicache#server-side for more
  // information.
  diffServerURL: 'https://serve.replicache.dev/pull',

  // Auth token for the diff server, if any.
  diffServerAuth: '1',

  // URL of your service's Replicache batch endpoint. Replicache
  // will send batches of mutations here for application when the
  // network is available.
  batchURL: 'https://replicache-sample-todo.now.sh/serve/replicache-batch',

  // Auth token for your client view and batch endpoints, if any.
  dataLayerAuth: '2',
  pushDelay: 300,

  repmInvoker: new REPMWasmInvoker(
    './output/wasm/release/replicache_client_bg.wasm',
  ),
});

rep.onSync = syncing => {
  const icon = document.querySelector('.sync-icon');
  icon.textContent = 'sync';
  icon.classList.remove('offline');
  if (syncing) {
    icon.classList.add('syncing');
    setTimeout(() => icon.classList.toggle('syncing', false), 500);
  }
  if (!rep.online) {
    icon.classList.add('offline');
    icon.textContent = 'sync_problem';
  }
};

rep.subscribe(
  async tx => {
    const todos = (await tx.scanAll({prefix: '/todo/'})).map(([k, v]) => v);
    todos.sort((a, b) => a.order - b.order);
    return todos;
  },
  {
    onData: update,
  },
);

const updateTodo = rep.register('updateTodo', async (tx, changes) => {
  const todo = await tx.get(key(changes.id));
  Object.assign(todo, changes);
  await tx.put(key(todo.id), todo);
});

const deleteTodo = rep.register('deleteTodo', async (tx, {id}) => {
  await tx.del(key(id));
});

const createTodo = rep.register('createTodo', async (tx, todo) => {
  await tx.put(key(todo.id), todo);
});

async function handleCreate() {
  const last = todos[todos.length - 1];
  await createTodo({
    id: Math.round(Math.random() * 2 ** 30),
    listID: 2,
    text: 'Untitled',
    order: last ? last.order + (1 - last.order) / 2 : 0.5,
    complete: false,
  });
  document
    .querySelector('.todo-list .todo-item:last-of-type .textwrap span')
    .focus();
}

async function handleDelete(id, e) {
  // Need to stop propagation rather than just preventDefault() because we don't
  // want the handler at the item level to interpret this click as a checkmark toggle.
  e.stopPropagation();
  await deleteTodo({id});
}

async function handleFocus(e) {
  const selection = getSelection();
  const range = document.createRange();
  range.selectNodeContents(e.target);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function handleBlur(id, e) {
  const text = e.target.textContent;
  await updateTodo({id, text});
}

async function handleCheck(id, e) {
  updateTodo({id, complete: !e.currentTarget.checked});
}

async function handleItemClick(id, e) {
  const checkbox = e.currentTarget.parentElement.querySelector('mwc-checkbox');
  checkbox.checked = !checkbox.checked;
  updateTodo({id, complete: checkbox.checked});
}

async function handleTextClick(e) {
  e.stopPropagation();
}

async function handleDragEnd(id, order) {
  await updateTodo({id, order});
}

function handleKeydown(e, isLast) {
  if (isLast && e.key == 'Tab' && !e.shiftKey) {
    handleCreate();
  }
}

let todos = [];
function update(newTodos) {
  todos = newTodos;

  // Using lit-html, but the principle is the same in any UI framework.
  // See https://github.com/rocicorp/replicache-sdk-js/tree/master/sample/cal
  // for an example using React.
  const item = (todo, index) => html`<div
    class=${classMap({'todo-item': true, dragging: isDragging(todo.id)})}
  >
    <mwc-icon
      class="handle"
      @mousedown=${e =>
        handleDragStart(e, todo.id, index, () => todos, update, handleDragEnd)}
      >drag_handle</mwc-icon
    >
    <mwc-checkbox
      .checked=${live(todo.complete)}
      @input=${e => handleCheck(todo.id, e)}
    ></mwc-checkbox>
    <div class="textwrap" @click=${e => handleItemClick(todo.id, e)}>
      <span
        @focus=${handleFocus}
        @click=${handleTextClick}
        @blur=${e => handleBlur(todo.id, e)}
        @keydown=${e => handleKeydown(e, index == todos.length - 1)}
        contenteditable
        >${todo.text}</span
      >
    </div>
    <mwc-icon-button
      @click=${e => handleDelete(todo.id, e)}
      icon="delete"
    ></mwc-icon-button>
  </div>`;
  render(
    repeat(newTodos, todo => todo.id, item),
    document.querySelector('.todo-list'),
  );
}

window.addEventListener('load', () => {
  // FOUC
  document.body.style.visibility = 'visible';
});
document.querySelector('mwc-fab').addEventListener('click', handleCreate);

Pusher.logToConsole = true;
new Pusher('8084fa6056631d43897d', {
  cluster: 'us3',
})
  .subscribe('u-2')
  .bind('poke', function (data) {
    rep.sync();
  });
