import React from 'react';
import {render} from '@testing-library/react';
import App from './App';

test('Replicache loads', () => {
  const {getByText} = render(<App />);
  const el = getByText(/Replicache/);
  expect(el).toBeInTheDocument();
});
