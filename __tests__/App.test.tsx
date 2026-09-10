/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Unmount so effect cleanups clear their timers — otherwise the jest
  // worker is force-exited after the run.
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
});
