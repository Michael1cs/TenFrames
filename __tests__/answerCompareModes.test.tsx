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

  it('level 4 (boss) asks the finest discrimination: equal or one apart', () => {
    let equals = 0;
    for (let i = 0; i < 400; i++) {
      const p = generateCompareProblem(4);
      const diff = Math.abs(p.left - p.right);
      expect(diff).toBeLessThanOrEqual(1);
      if (diff === 0) {
        equals++;
        expect(p.correct).toBe('equal');
      }
    }
    expect(equals).toBeGreaterThan(0);
  });

  it('counts always fit a ten frame (1-10)', () => {
    for (const level of [1, 2, 3, 4]) {
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

describe('generateReadProblem — the locked-frame games', () => {
  const {generateReadProblem, READ_LEVEL_CAP} = require('../src/utils/mathProblems');

  it('addition: both parts fit the frame and the answer is the total', () => {
    for (let level = 1; level <= READ_LEVEL_CAP; level++) {
      for (let i = 0; i < 120; i++) {
        const p = generateReadProblem('add', level);
        expect(p.op).toBe('add');
        expect(p.slot).toBe('sum');
        expect(p.num1).toBeGreaterThanOrEqual(1);
        expect(p.num2).toBeGreaterThanOrEqual(1);
        expect(p.num1 + p.num2).toBe(p.answer);
        expect(p.answer).toBeLessThanOrEqual(10);
        expect(p.expected).toBe(p.answer);
      }
    }
  });

  it('subtraction: always leaves at least one counter to read', () => {
    for (let level = 1; level <= READ_LEVEL_CAP; level++) {
      for (let i = 0; i < 120; i++) {
        const p = generateReadProblem('sub', level);
        expect(p.op).toBe('sub');
        expect(p.num1).toBeLessThanOrEqual(10);
        expect(p.num2).toBeGreaterThanOrEqual(1);
        expect(p.num2).toBeLessThan(p.num1);
        expect(p.answer).toBe(p.num1 - p.num2);
        expect(p.answer).toBeGreaterThanOrEqual(1);
        expect(p.expected).toBe(p.answer);
      }
    }
  });

  it('gets harder as the ladder climbs', () => {
    const mean = (op: 'add' | 'sub', level: number) => {
      let total = 0;
      for (let i = 0; i < 400; i++) total += generateReadProblem(op, level).num1;
      return total / 400;
    };
    expect(mean('add', READ_LEVEL_CAP)).toBeGreaterThan(mean('add', 1));
    expect(mean('sub', READ_LEVEL_CAP)).toBeGreaterThan(mean('sub', 1));
  });

  it('clamps a level from outside the ladder instead of breaking', () => {
    for (const level of [0, -3, 99]) {
      const p = generateReadProblem('add', level);
      expect(p.answer).toBeGreaterThanOrEqual(2);
      expect(p.answer).toBeLessThanOrEqual(10);
    }
  });
});

describe('the locked frame is not a working space', () => {
  const {lockedFrameInstructionId} = require('../src/voice/adventureNarration');
  const VOICE_SCRIPT = require('../src/voice/script').VOICE_SCRIPT;

  it('asks about what is on the frame, never for a counter to be added', () => {
    // "Add three more" on a board that does not respond is the bug this
    // whole pair of games could most easily have shipped with.
    expect(lockedFrameInstructionId('add')).toBe('add_alt_1');
    expect(lockedFrameInstructionId('sub')).toBe('sub_alt_1');
    for (const id of ['add_alt_1', 'sub_alt_1']) {
      const line = VOICE_SCRIPT.find((l: {id: string}) => l.id === id);
      expect(line).toBeTruthy();
      expect(line.ro).not.toMatch(/mai pune|adaug/i);
      expect(line.en).not.toMatch(/add |put /i);
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

describe('Free Play locked-frame games', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function setup(mode: 'readAdd' | 'readSub'): Promise<() => Api> {
    let api!: Api;
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
    });
    await ReactTestRenderer.act(() => {
      api.setGameMode(mode);
    });
    return () => api;
  }

  it('addition arrives with both parts already placed', async () => {
    const api = await setup('readAdd');
    const p = api().answerProblem!;
    expect(p.op).toBe('add');
    expect(api().cells.filter(c => c === 'color1')).toHaveLength(p.num1);
    expect(api().cells.filter(c => c === 'color2')).toHaveLength(p.num2);
  });

  it('subtraction arrives holding the group it started with', async () => {
    const api = await setup('readSub');
    const p = api().answerProblem!;
    expect(p.op).toBe('sub');
    // The ones that left are still drawn, faded, by the screen — the state
    // holds the whole starting group.
    expect(api().cells.filter(c => c === 'color1')).toHaveLength(p.num1);
    expect(api().cells.filter(c => c === 'color2')).toHaveLength(0);
  });

  it('ignores taps on the frame — the child cannot build the answer', async () => {
    for (const mode of ['readAdd', 'readSub'] as const) {
      const api = await setup(mode);
      const before = [...api().cells];
      for (const index of [0, 4, 7, 9]) {
        await ReactTestRenderer.act(() => {
          api().handleCellClick(index);
        });
      }
      expect(api().cells).toEqual(before);
    }
  });

  it('a correct pad tap scores, a wrong one lets the child pick again', async () => {
    const api = await setup('readAdd');
    const wrong = api().answerProblem!.expected === 10 ? 1 : 10;
    await ReactTestRenderer.act(() => {
      api().handleNumberPick(wrong);
    });
    expect(api().isCorrect).toBe(false);
    expect(api().hasSubmitted).toBe(false);
    expect(api().score).toBe(0);

    await ReactTestRenderer.act(() => {
      api().handleNumberPick(api().answerProblem!.expected);
    });
    expect(api().isCorrect).toBe(true);
    expect(api().score).toBe(1);
  });

  it('climbs its own ladder after three in a row, and stops at the cap', async () => {
    const {READ_LEVEL_CAP} = require('../src/utils/mathProblems');
    const api = await setup('readSub');
    expect(api().readSubLevel).toBe(1);
    for (let i = 0; i < 3 * (READ_LEVEL_CAP + 2); i++) {
      await ReactTestRenderer.act(() => {
        api().handleNumberPick(api().answerProblem!.expected);
      });
      await ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(5000);
      });
    }
    expect(api().readSubLevel).toBe(READ_LEVEL_CAP);
    // The other games' ladders are untouched by this one.
    expect(api().readAddLevel).toBe(1);
    expect(api().additionLevel).toBe(1);
  });
});

describe('switching between the locked games', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('never shows the old game\'s problem under the new game\'s name', async () => {
    // The screen narrates from (gameMode, answerProblem). A render where the
    // mode says subtraction but the problem is still the addition one made
    // the app say "How many are there now in total?" and then "How many are
    // left?" on every switch.
    const seen: string[] = [];
    let api!: Api;
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <Probe
          onRender={a => {
            api = a;
            if (a.answerProblem) seen.push(`${a.gameMode}:${a.answerProblem.op}`);
          }}
        />,
      );
    });
    for (const mode of ['readAdd', 'readSub', 'readAdd', 'readSub'] as const) {
      await ReactTestRenderer.act(() => {
        api.setGameMode(mode);
      });
    }
    expect(seen).not.toContain('readSub:add');
    expect(seen).not.toContain('readAdd:sub');
    expect(api.answerProblem?.op).toBe('sub');
  });

  it('also clears a building problem when leaving addition for subtraction', async () => {
    const seen: string[] = [];
    let api!: Api;
    let renders = 0;
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <Probe
          onRender={a => {
            api = a;
            renders++;
            seen.push(`${a.gameMode}:${a.currentProblem ? 'p' : '-'}`);
          }}
        />,
      );
    });
    await ReactTestRenderer.act(() => api.setGameMode('addition'));
    const before = renders;
    await ReactTestRenderer.act(() => api.setGameMode('subtraction'));
    // The first render under 'subtraction' carries no problem at all.
    expect(seen[before]).toBe('subtraction:-');
    expect(api.currentProblem).toBeTruthy();
  });
});
