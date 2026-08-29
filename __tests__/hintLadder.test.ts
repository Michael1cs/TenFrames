import {
  applyAssistPlan,
  buildAssistPlan,
  cellsToChange,
  LadderContext,
} from '../src/utils/hintLadder';
import {CellState, CountingChallenge, GameMode, Problem} from '../src/types/game';

/**
 * Mirror of AdventureLevelScreen's own correctness check (handleSubmit).
 * Kept deliberately verbatim: the ladder's whole contract is that its output
 * satisfies *this*, so a divergence here is exactly the bug worth catching.
 */
function isCorrect(ctx: LadderContext): boolean {
  const {gameMode, cells, problem, counting} = ctx;
  const topFilled = cells.slice(0, 5).filter(c => c !== 'empty').length;
  const bottomFilled = cells.slice(5, 10).filter(c => c !== 'empty').length;
  const totalFilled = topFilled + bottomFilled;

  if (gameMode === 'counting' && counting) {
    const {instruction, targetNumber} = counting;
    if (instruction === 'fill_top_row') return topFilled === 5 && bottomFilled === 0;
    if (instruction === 'fill_bottom_row') return bottomFilled === 5 && topFilled === 0;
    if (instruction === 'fill_both_equal') {
      const perRow = targetNumber / 2;
      return topFilled === perRow && bottomFilled === perRow;
    }
    return totalFilled === targetNumber;
  }
  if (!problem) return false;
  if (gameMode === 'subtraction') {
    return cells.filter(c => c === 'color1').length === problem.answer;
  }
  return cells.filter(c => c === 'color2').length === problem.num2;
}

const empty = (): CellState[] => Array(10).fill('empty');

/** Board as it looks when an addition/puzzle problem is handed to the child. */
function prefilled(num1: number): CellState[] {
  return empty().map((c, i) => (i < num1 ? 'color1' : c));
}

/**
 * Apply the second rung's highlighted cells the way a child following the hint
 * would: fill an empty one, clear a placed one.
 */
function followHint(ctx: LadderContext, diff: number[]): CellState[] {
  const cells = [...ctx.cells];
  const fillState: CellState =
    ctx.gameMode === 'counting'
      ? 'filled'
      : ctx.gameMode === 'subtraction'
      ? 'color1'
      : 'color2';
  for (const i of diff) {
    cells[i] = cells[i] === 'empty' ? fillState : 'empty';
  }
  return cells;
}

const COUNTING: {instruction: CountingChallenge['instruction']; target: number}[] = [
  {instruction: 'fill_exactly', target: 7},
  {instruction: 'fill_exactly', target: 3},
  {instruction: 'fill_top_row', target: 5},
  {instruction: 'fill_bottom_row', target: 5},
  {instruction: 'fill_both_equal', target: 6},
  {instruction: 'fill_both_equal', target: 10},
];

describe('hint ladder — second rung tells the child the truth', () => {
  it.each(COUNTING)(
    'counting $instruction/$target: following the hint from any board is correct',
    ({instruction, target}) => {
      const counting: CountingChallenge = {instruction, targetNumber: target};
      // Every plausible wrong board: n cells filled from the left, and n from
      // the right, covering both undershoot and overshoot in both rows.
      for (let n = 0; n <= 10; n++) {
        for (const fromLeft of [true, false]) {
          const cells = empty();
          for (let k = 0; k < n; k++) {
            cells[fromLeft ? k : 9 - k] = 'filled';
          }
          const ctx: LadderContext = {
            gameMode: 'counting',
            cells,
            problem: null,
            counting,
          };
          if (isCorrect(ctx)) continue; // already right, nothing to hint
          const after = followHint(ctx, cellsToChange(ctx));
          expect(isCorrect({...ctx, cells: after})).toBe(true);
        }
      }
    },
  );

  it.each(['addition', 'puzzle'] as GameMode[])(
    '%s: following the hint from any placement is correct',
    gameMode => {
      for (let num1 = 0; num1 <= 8; num1++) {
        for (let num2 = 1; num2 + num1 <= 10; num2++) {
          const problem: Problem = {num1, num2, answer: num1 + num2};
          // The child placed `placed` of their own counters, any amount.
          for (let placed = 0; placed <= 10 - num1; placed++) {
            const cells = prefilled(num1);
            for (let k = 0; k < placed; k++) cells[num1 + k] = 'color2';
            const ctx: LadderContext = {gameMode, cells, problem, counting: null};
            if (isCorrect(ctx)) continue;
            const after = followHint(ctx, cellsToChange(ctx));
            expect(isCorrect({...ctx, cells: after})).toBe(true);
          }
        }
      }
    },
  );

  it('subtraction: following the hint from any removal is correct', () => {
    for (let num1 = 2; num1 <= 10; num1++) {
      for (let num2 = 1; num2 < num1; num2++) {
        const problem: Problem = {num1, num2, answer: num1 - num2};
        // The child removed `removed` counters, any amount including too many.
        for (let removed = 0; removed <= num1; removed++) {
          const cells = prefilled(num1);
          for (let k = 0; k < removed; k++) cells[num1 - 1 - k] = 'empty';
          const ctx: LadderContext = {
            gameMode: 'subtraction',
            cells,
            problem,
            counting: null,
          };
          if (isCorrect(ctx)) continue;
          const after = followHint(ctx, cellsToChange(ctx));
          expect(isCorrect({...ctx, cells: after})).toBe(true);
        }
      }
    }
  });

  it('never highlights a cell twice, or one off the board', () => {
    const ctx: LadderContext = {
      gameMode: 'counting',
      cells: empty(),
      problem: null,
      counting: {instruction: 'fill_exactly', targetNumber: 7},
    };
    const diff = cellsToChange(ctx);
    expect(new Set(diff).size).toBe(diff.length);
    for (const i of diff) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(10);
    }
  });
});

describe('hint ladder — third rung builds a board the app accepts', () => {
  it.each(COUNTING)(
    'counting $instruction/$target ends correct, counting the whole target',
    ({instruction, target}) => {
      const counting: CountingChallenge = {instruction, targetNumber: target};
      const ctx: LadderContext = {
        gameMode: 'counting',
        cells: empty(),
        problem: null,
        counting,
      };
      const plan = buildAssistPlan(ctx);
      const final = applyAssistPlan(plan);
      expect(isCorrect({...ctx, cells: final})).toBe(true);
      // The voice counts num_1 … num_steps.length, so it must equal what the
      // child sees appear — the whole quantity for counting mode.
      const expected = instruction === 'fill_top_row' || instruction === 'fill_bottom_row' ? 5 : target;
      expect(plan.steps).toHaveLength(expected);
    },
  );

  it.each(['addition', 'puzzle'] as GameMode[])(
    '%s ends correct, and counts the child’s operand',
    gameMode => {
      for (let num1 = 0; num1 <= 8; num1++) {
        for (let num2 = 1; num2 + num1 <= 10; num2++) {
          const problem: Problem = {num1, num2, answer: num1 + num2};
          const ctx: LadderContext = {
            gameMode,
            cells: empty(),
            problem,
            counting: null,
          };
          const plan = buildAssistPlan(ctx);
          expect(applyAssistPlan(plan).filter(c => c === 'color1')).toHaveLength(num1);
          expect(isCorrect({...ctx, cells: applyAssistPlan(plan)})).toBe(true);
          expect(plan.steps).toHaveLength(num2);
        }
      }
    },
  );

  it('subtraction ends correct, and counts the removals', () => {
    for (let num1 = 2; num1 <= 10; num1++) {
      for (let num2 = 1; num2 < num1; num2++) {
        const problem: Problem = {num1, num2, answer: num1 - num2};
        const ctx: LadderContext = {
          gameMode: 'subtraction',
          cells: empty(),
          problem,
          counting: null,
        };
        const plan = buildAssistPlan(ctx);
        expect(isCorrect({...ctx, cells: applyAssistPlan(plan)})).toBe(true);
        expect(plan.steps).toHaveLength(num2);
      }
    }
  });

  it('never counts past ten — num_K clips only exist to num_10', () => {
    for (const {instruction, target} of COUNTING) {
      const plan = buildAssistPlan({
        gameMode: 'counting',
        cells: empty(),
        problem: null,
        counting: {instruction, targetNumber: target},
      });
      expect(plan.steps.length).toBeLessThanOrEqual(10);
    }
    for (let num1 = 0; num1 <= 8; num1++) {
      for (let num2 = 1; num2 + num1 <= 10; num2++) {
        const plan = buildAssistPlan({
          gameMode: 'addition',
          cells: empty(),
          problem: {num1, num2, answer: num1 + num2},
          counting: null,
        });
        expect(plan.steps.length).toBeLessThanOrEqual(10);
      }
    }
  });

  it('only ever touches valid board positions', () => {
    const plan = buildAssistPlan({
      gameMode: 'subtraction',
      cells: empty(),
      problem: {num1: 10, num2: 9, answer: 1},
      counting: null,
    });
    expect(plan.base).toHaveLength(10);
    for (const s of plan.steps) {
      expect(s.index).toBeGreaterThanOrEqual(0);
      expect(s.index).toBeLessThan(10);
    }
  });
});
