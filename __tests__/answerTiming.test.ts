import {hasEngaged} from '../src/utils/answerTiming';
import {Problem} from '../src/types/game';

const addition: Problem = {num1: 3, num2: 2, answer: 5};
const subtraction: Problem = {num1: 7, num2: 3, answer: 4};

describe('hasEngaged — when the stop-rule timer may start', () => {
  // The regression this exists to prevent: useGameState seeds userAnswer with
  // problem.num1, so treating "not null" as "answered" judged the board two
  // seconds after the problem appeared, without a single tap — and taps are
  // ignored after submission, so the frame went dead.
  it('is not engaged on a freshly set-up problem', () => {
    expect(hasEngaged(addition.num1, addition)).toBe(false);
    expect(hasEngaged(subtraction.num1, subtraction)).toBe(false);
  });

  it('is not engaged before anything is set up', () => {
    expect(hasEngaged(null, addition)).toBe(false);
    expect(hasEngaged(5, null)).toBe(false);
    expect(hasEngaged(null, null)).toBe(false);
  });

  it('is engaged once the child adds a counter', () => {
    for (let placed = 1; placed <= 10 - addition.num1; placed++) {
      expect(hasEngaged(addition.num1 + placed, addition)).toBe(true);
    }
  });

  it('is engaged once the child removes a counter', () => {
    for (let removed = 1; removed <= subtraction.num1; removed++) {
      expect(hasEngaged(subtraction.num1 - removed, subtraction)).toBe(true);
    }
  });

  it('disengages again when the child undoes back to the start', () => {
    expect(hasEngaged(addition.num1 + 2, addition)).toBe(true);
    expect(hasEngaged(addition.num1, addition)).toBe(false);
  });

  it('treats a correct answer as engaged, so it can be judged', () => {
    expect(hasEngaged(addition.answer, addition)).toBe(true);
    expect(hasEngaged(subtraction.answer, subtraction)).toBe(true);
  });

  // num1 === 0 means nothing is prefilled, so any counter placed is a change.
  it('handles a problem with nothing prefilled', () => {
    const p: Problem = {num1: 0, num2: 4, answer: 4};
    expect(hasEngaged(0, p)).toBe(false);
    expect(hasEngaged(1, p)).toBe(true);
  });
});
