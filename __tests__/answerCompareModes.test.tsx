/**
 * Answer mode ("name the number") and Compare mode ("which has more?"):
 * generator bands, and the Free Play flow — a correct pick advances, a wrong
 * pick marks the bubble and lets the child retry immediately.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  generateAnswerProblem,
  generateCompareProblem,
} from '../src/utils/mathProblems';
import {useGameState} from '../src/hooks/useGameState';

describe('generateAnswerProblem', () => {
  it('level 1: sum slot with small totals', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateAnswerProblem(1);
      expect(p.slot).toBe('sum');
      expect(p.answer).toBeGreaterThanOrEqual(2);
      expect(p.answer).toBeLessThanOrEqual(5);
      expect(p.expected).toBe(p.answer);
      expect(p.num1 + p.num2).toBe(p.answer);
    }
  });

  it('level 5: missing addend with totals <= 5, voiced by make_N (>= 3)', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateAnswerProblem(5);
      expect(p.slot).toBe('addend');
      expect(p.answer).toBeGreaterThanOrEqual(3);
      expect(p.answer).toBeLessThanOrEqual(5);
      expect(p.expected).toBe(p.num2);
    }
  });

  it('level 8 (boss): addend slot only, big totals', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateAnswerProblem(8);
      expect(p.slot).toBe('addend');
      expect(p.answer).toBeGreaterThanOrEqual(6);
      expect(p.answer).toBeLessThanOrEqual(10);
    }
  });

  it('level 7 mixes both slots', () => {
    const slots = new Set<string>();
    for (let i = 0; i < 200; i++) {
      slots.add(generateAnswerProblem(7).slot);
    }
    expect(slots).toEqual(new Set(['sum', 'addend']));
  });
});

describe('generateCompareProblem', () => {
  it('level 1: obvious difference (>= 3), never equal', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateCompareProblem(1);
      expect(p.correct).not.toBe('equal');
      expect(Math.abs(p.left - p.right)).toBeGreaterThanOrEqual(3);
      expect(p.correct).toBe(p.left > p.right ? 'left' : 'right');
    }
  });

  it('level 2: close counts (difference 1-2) force real counting', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateCompareProblem(2);
      const diff = Math.abs(p.left - p.right);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(2);
    }
  });

  it('level 3 sometimes serves equal pairs, correctly labeled', () => {
    let equals = 0;
    for (let i = 0; i < 400; i++) {
      const p = generateCompareProblem(3);
      if (p.left === p.right) {
        equals++;
        expect(p.correct).toBe('equal');
      }
    }
    expect(equals).toBeGreaterThan(0);
  });

  it('counts always fit a ten frame (1-10)', () => {
    for (const level of [1, 2, 3]) {
      for (let i = 0; i < 200; i++) {
        const p = generateCompareProblem(level);
        expect(p.left).toBeGreaterThanOrEqual(1);
        expect(p.left).toBeLessThanOrEqual(10);
        expect(p.right).toBeGreaterThanOrEqual(1);
        expect(p.right).toBeLessThanOrEqual(10);
      }
    }
  });
});

type Api = ReturnType<typeof useGameState>;

function Probe({onRender}: {onRender: (api: Api) => void}) {
  onRender(useGameState());
  return null;
}

describe('Free Play answer mode', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function setup(): Promise<() => Api> {
    let api!: Api;
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
    });
    await ReactTestRenderer.act(() => {
      api.setGameMode('answer');
    });
    return () => api;
  }

  it('generates a problem and pre-fills num1 on the frame', async () => {
    const api = await setup();
    const p = api().answerProblem!;
    expect(p).toBeTruthy();
    expect(api().cells.filter(c => c === 'color1')).toHaveLength(p.num1);
    expect(api().hasSubmitted).toBe(false);
  });

  it('wrong pick marks the bubble and allows an immediate retry', async () => {
    const api = await setup();
    const p = api().answerProblem!;
    const wrong = p.expected === 0 ? 1 : p.expected - 1;
    await ReactTestRenderer.act(() => {
      api().handleNumberPick(wrong);
    });
    expect(api().wrongPick).toBe(wrong);
    expect(api().isCorrect).toBe(false);
    // Not locked: the pad accepts the next pick right away.
    expect(api().hasSubmitted).toBe(false);

    await ReactTestRenderer.act(() => {
      api().handleNumberPick(p.expected);
    });
    expect(api().isCorrect).toBe(true);
    expect(api().hasSubmitted).toBe(true);
    expect(api().score).toBe(1);
  });

  it('correct pick advances to a fresh problem after the praise pause', async () => {
    const api = await setup();
    const first = api().answerProblem!;
    await ReactTestRenderer.act(() => {
      api().handleNumberPick(first.expected);
    });
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(api().hasSubmitted).toBe(false);
    expect(api().answerProblem).toBeTruthy();
    // Anti-repeat guard: never the same fact twice in a row.
    const second = api().answerProblem!;
    expect(`${second.slot}|${second.num1}|${second.num2}`).not.toBe(
      `${first.slot}|${first.num1}|${first.num2}`,
    );
  });
});

describe('Free Play compare mode', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('correct side advances, wrong side retries', async () => {
    let api!: Api;
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
    });
    await ReactTestRenderer.act(() => {
      api.setGameMode('compare');
    });
    const p = api.compareProblem!;
    expect(p).toBeTruthy();

    const wrong = p.correct === 'left' ? 'right' : 'left';
    await ReactTestRenderer.act(() => {
      api.handleComparePick(wrong);
    });
    expect(api.isCorrect).toBe(false);
    expect(api.hasSubmitted).toBe(false);

    await ReactTestRenderer.act(() => {
      api.handleComparePick(p.correct);
    });
    expect(api.isCorrect).toBe(true);
    expect(api.score).toBe(1);

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(api.hasSubmitted).toBe(false);
    expect(api.compareProblem).toBeTruthy();
  });
});
