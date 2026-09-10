/**
 * Free Play retry regression (compact / young profile).
 *
 * After a wrong answer, useGameState retries the SAME problem: it resets the
 * board and drops hasSubmitted back to false, but num1/num2 stay identical.
 * The auto-submit guard in AdditionMode/SubtractionMode used to re-arm only
 * when the problem changed, so on retry it stayed latched — and since compact
 * mode hides the manual ✓ button, the second answer was never judged and the
 * game soft-locked until reset.
 *
 * The scenario below walks the exact prop sequence useGameState produces:
 * answer wrong → judged → retry reset → answer again → must be judged again.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AdditionMode} from '../src/components/game/AdditionMode';
import {SubtractionMode} from '../src/components/game/SubtractionMode';
import {STOP_JUDGE_MS} from '../src/config/timing';
import {Problem} from '../src/types/game';

jest.mock('../src/components/game/TenFrame', () => ({
  TenFrame: () => null,
}));
jest.mock('../src/components/game/NumberDisplay', () => ({
  NumberDisplay: () => null,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

async function expectRetryIsJudged(
  Mode: typeof AdditionMode | typeof SubtractionMode,
  problem: Problem,
  wrongAnswer: number,
  rightAnswer: number,
) {
  const onSubmit = jest.fn();
  const baseProps = {
    cells: Array(10).fill('empty') as any,
    onCellClick: () => {},
    onSubmit,
    onReset: () => {},
    currentProblem: problem,
    userAnswer: problem.num1, // board starts with num1 pre-placed
    isCorrect: null,
    hasSubmitted: false,
    feedback: '',
    colors: {} as any,
    emoji: '🚀',
    level: 1,
    ageGroup: 'young' as const,
    ageProfile: {compact: true, fontScale: 1} as any,
  };

  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<Mode {...baseProps} />);
  });

  // Child taps to a wrong count and stops → stop-rule judges the board.
  await ReactTestRenderer.act(() => {
    root.update(<Mode {...baseProps} userAnswer={wrongAnswer} />);
  });
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(STOP_JUDGE_MS);
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);

  // useGameState marks it wrong (hasSubmitted true, feedback shown)…
  await ReactTestRenderer.act(() => {
    root.update(
      <Mode
        {...baseProps}
        userAnswer={wrongAnswer}
        hasSubmitted={true}
        isCorrect={false}
        feedback="wrong"
      />,
    );
  });

  // …then 3s later resets the SAME problem for retry.
  await ReactTestRenderer.act(() => {
    root.update(<Mode {...baseProps} userAnswer={problem.num1} />);
  });

  // Child answers again and stops → the retry MUST be judged too.
  await ReactTestRenderer.act(() => {
    root.update(<Mode {...baseProps} userAnswer={rightAnswer} />);
  });
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(STOP_JUDGE_MS);
  });
  expect(onSubmit).toHaveBeenCalledTimes(2);
}

test('addition: second answer after a wrong try is auto-judged', async () => {
  await expectRetryIsJudged(AdditionMode, {num1: 2, num2: 3, answer: 5}, 4, 5);
});

test('subtraction: second answer after a wrong try is auto-judged', async () => {
  await expectRetryIsJudged(
    SubtractionMode,
    {num1: 8, num2: 3, answer: 5},
    6,
    5,
  );
});
