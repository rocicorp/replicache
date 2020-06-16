import React from 'react';
import {render} from '@testing-library/react';
import App from './App';

test('Login Screen', () => {
  const {getByText, baseElement} = render(<App />);
  const el = getByText(/Login/);
  expect(el).toBeInTheDocument();

  expect(baseElement).toMatchInlineSnapshot(`
    <body>
      <div>
        <form
          class="LoginScreen"
        >
          <input
            placeholder="Email"
          />
          <button
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </body>
  `);
});
