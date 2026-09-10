/**
 * Tap-to-skip: the feedback pause after a submit (5s praise / 3s retry beat)
 * ends early when the child taps the frame, but a tap inside the 600ms grace
 * window right after judging is swallowed instead of cutting feedback short.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useGameState} from '../src/hooks/useGameState';

type Api = ReturnType<typeof useGameState>;

function Probe({onRender}: {onRender: (api: Api) => void}) {
  onRender(useGameState());
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

async function setupAdditionWrongSubmit(): Promise<{api: () => Api}> {
  let api!: Api;
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
  });
  await ReactTestRenderer.act(() => {
    api.setGameMode('addition');
  });
  // The board starts holding num1 and the answer is num1 + num2 with
  // num2 >= 1, so submitting immediately is always wrong.
  await ReactTestRenderer.act(() => {
    api.handleSubmit();
  });
  expect(api.isCorrect).toBe(false);
  expect(api.hasSubmitted).toBe(true);
  return {api: () => api};
}

test('a frame tap during the retry pause restores the board immediately', async () => {
  const {api} = await setupAdditionWrongSubmit();

  // Past the grace window, tap a cell: the retry reset runs now, not at 3s.
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(700);
  });
  await ReactTestRenderer.act(() => {
    api().handleCellClick(0);
  });
  expect(api().hasSubmitted).toBe(false);
  expect(api().feedback).toBe('');
});

test('a tap inside the grace window is swallowed, feedback stays up', async () => {
  const {api} = await setupAdditionWrongSubmit();

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(200);
  });
  await ReactTestRenderer.act(() => {
    api().handleCellClick(0);
  });
  // Neither skipped nor treated as a board edit.
  expect(api().hasSubmitted).toBe(true);
  expect(api().isCorrect).toBe(false);

  // And with no further taps the retry still lands on its own at 3s.
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(api().hasSubmitted).toBe(false);
});

test('the pause still ends by itself without any tap', async () => {
  const {api} = await setupAdditionWrongSubmit();
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(api().hasSubmitted).toBe(false);
});
