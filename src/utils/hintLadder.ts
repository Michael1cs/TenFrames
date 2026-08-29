import {CellState, CountingChallenge, GameMode, Problem} from '../types/game';

/**
 * The maths behind the hint ladder, as pure functions.
 *
 * These used to live inside handleSubmit's closure in AdventureLevelScreen,
 * where the only way to check them was to read them. They are the part of the
 * ladder that can actually be wrong — which cells to highlight, and which
 * board to build in front of the child — so they belong somewhere a test can
 * reach them.
 *
 * The rule both functions must satisfy: applying the returned changes to the
 * child's board must produce a board that AdventureLevelScreen's own
 * correctness check accepts. `__tests__/hintLadder.test.ts` asserts exactly
 * that, by re-implementing the check and running it over every mode and every
 * under/overshoot.
 */

export interface LadderContext {
  gameMode: GameMode;
  cells: CellState[];
  problem: Problem | null;
  counting: CountingChallenge | null;
}

const indicesWhere = (
  cells: CellState[],
  pred: (c: CellState, i: number) => boolean,
): number[] => cells.map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);

/**
 * Second rung: the cells the child must change to be right, read from the
 * board as they left it.
 *
 * Positional rather than chronological — first empties to fill, last extras to
 * clear — because the order the child tapped in is not recorded, and position
 * is what reads naturally on a frame.
 */
export function cellsToChange(ctx: LadderContext): number[] {
  const {gameMode, cells, problem, counting} = ctx;

  if (gameMode === 'counting' && counting) {
    const {instruction, targetNumber} = counting;

    if (instruction === 'fill_top_row') {
      return [
        ...indicesWhere(cells, (c, i) => i < 5 && c === 'empty'),
        ...indicesWhere(cells, (c, i) => i >= 5 && c !== 'empty'),
      ];
    }
    if (instruction === 'fill_bottom_row') {
      return [
        ...indicesWhere(cells, (c, i) => i >= 5 && c === 'empty'),
        ...indicesWhere(cells, (c, i) => i < 5 && c !== 'empty'),
      ];
    }
    if (instruction === 'fill_both_equal') {
      const perRow = targetNumber / 2;
      const out: number[] = [];
      for (const [lo, hi] of [
        [0, 5],
        [5, 10],
      ] as const) {
        const filled = indicesWhere(
          cells,
          (c, i) => i >= lo && i < hi && c !== 'empty',
        );
        const empty = indicesWhere(
          cells,
          (c, i) => i >= lo && i < hi && c === 'empty',
        );
        if (filled.length < perRow) {
          out.push(...empty.slice(0, perRow - filled.length));
        } else {
          out.push(...filled.slice(perRow));
        }
      }
      return out;
    }

    // fill_exactly
    const filled = indicesWhere(cells, c => c !== 'empty');
    const empty = indicesWhere(cells, c => c === 'empty');
    return filled.length < targetNumber
      ? empty.slice(0, targetNumber - filled.length)
      : filled.slice(targetNumber);
  }

  if (!problem) return [];

  if (gameMode === 'subtraction') {
    const kept = indicesWhere(cells, c => c === 'color1');
    const empty = indicesWhere(cells, c => c === 'empty');
    return kept.length > problem.answer
      ? kept.slice(problem.answer)
      : empty.slice(0, problem.answer - kept.length);
  }

  // addition / puzzle — the child's own operand is color2
  const placed = indicesWhere(cells, c => c === 'color2');
  const empty = indicesWhere(cells, c => c === 'empty');
  return placed.length < problem.num2
    ? empty.slice(0, problem.num2 - placed.length)
    : placed.slice(problem.num2);
}

export interface AssistStep {
  index: number;
  state: CellState;
}

export interface AssistPlan {
  /** Board to reset to before the walkthrough starts. */
  base: CellState[];
  /** Applied one at a time, counted aloud as num_1 … num_N. */
  steps: AssistStep[];
}

/**
 * Third rung: reset to the operand's starting point and build the answer one
 * cell at a time, so the child watches it happen instead of being told it.
 *
 * `steps.length` is what the counting voice counts, so it must equal the
 * quantity being counted — the whole target for counting mode, the child's
 * operand for the arithmetic modes.
 */
export function buildAssistPlan(ctx: LadderContext): AssistPlan {
  const {gameMode, problem, counting} = ctx;
  let base: CellState[] = Array(10).fill('empty');
  const steps: AssistStep[] = [];

  if (gameMode === 'counting' && counting) {
    const {instruction, targetNumber} = counting;
    const positions =
      instruction === 'fill_top_row'
        ? [0, 1, 2, 3, 4]
        : instruction === 'fill_bottom_row'
        ? [5, 6, 7, 8, 9]
        : instruction === 'fill_both_equal'
        ? [
            ...Array.from({length: targetNumber / 2}, (_, i) => i),
            ...Array.from({length: targetNumber / 2}, (_, i) => 5 + i),
          ]
        : Array.from({length: targetNumber}, (_, i) => i);
    for (const i of positions) steps.push({index: i, state: 'filled'});
    return {base, steps};
  }

  if (!problem) return {base, steps};

  if (gameMode === 'subtraction') {
    base = base.map((c, i) => (i < problem.num1 ? 'color1' : c));
    for (let k = 0; k < problem.num2; k++) {
      steps.push({index: problem.num1 - 1 - k, state: 'empty'});
    }
    return {base, steps};
  }

  // addition / puzzle
  base = base.map((c, i) => (i < problem.num1 ? 'color1' : c));
  for (let k = 0; k < problem.num2; k++) {
    steps.push({index: problem.num1 + k, state: 'color2'});
  }
  return {base, steps};
}

/** The board the walkthrough ends on, i.e. base with every step applied. */
export function applyAssistPlan(plan: AssistPlan): CellState[] {
  const cells = [...plan.base];
  for (const s of plan.steps) cells[s.index] = s.state;
  return cells;
}
