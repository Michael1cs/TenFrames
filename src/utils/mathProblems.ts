import {GameMode, Problem, CountingChallenge} from '../types/game';

/**
 * Generate a problem based on game mode and difficulty level.
 * Levels 1-9: focused practice (e.g., level 1 = +1 only, level 2 = +2 only)
 * Level 10+: random (full range)
 */
export function generateProblem(gameMode: GameMode, level: number = 10): Problem {
  if (gameMode === 'addition') {
    return generateAdditionProblem(level);
  } else if (gameMode === 'subtraction') {
    return generateSubtractionProblem(level);
  }
  // Default / counting / puzzle
  const num1 = Math.floor(Math.random() * 8) + 1;
  const num2 = Math.floor(Math.random() * (10 - num1)) + 1;
  return {num1, num2, answer: num1 + num2};
}

function generateAdditionProblem(level: number): Problem {
  let num1: number, num2: number;

  if (level >= 1 && level <= 9) {
    // Level N: second addend is always N
    num2 = level;
    const maxNum1 = 10 - num2;
    num1 = Math.floor(Math.random() * maxNum1) + 1; // 1 to (10-num2)
  } else {
    // Level 10+: random
    num1 = Math.floor(Math.random() * 8) + 1;
    num2 = Math.floor(Math.random() * (10 - num1)) + 1;
  }

  return {num1, num2, answer: num1 + num2};
}

function generateSubtractionProblem(level: number): Problem {
  let num1: number, num2: number;

  if (level >= 1 && level <= 9) {
    // Level N: subtract N
    num2 = level;
    const minNum1 = num2 + 1;
    num1 = Math.floor(Math.random() * (10 - minNum1 + 1)) + minNum1; // (num2+1) to 10
  } else {
    // Level 10+: random
    num1 = Math.floor(Math.random() * 7) + 3;
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
  }

  return {num1, num2, answer: num1 - num2};
}

export function generatePuzzleNumber(): number {
  return Math.floor(Math.random() * 8) + 1; // 1 to 8
}

export function checkAnswer(
  filledCount: number,
  problem: Problem | null,
): boolean {
  if (!problem) return false;
  return filledCount === problem.answer;
}

export function checkPuzzleAnswer(
  filledCount: number,
  puzzleNumber: number,
): boolean {
  return filledCount === 10 - puzzleNumber;
}

/**
 * Generate a structured counting challenge for adventure mode.
 * Each level has a range of targets + varied instructions.
 * Designed for 5-7 year olds.
 */
export function generateCountingChallenge(level: number): CountingChallenge {
  // Pool of challenges per level - picks randomly from pool
  const pools: Record<number, CountingChallenge[]> = {
    1: [
      {targetNumber: 1, instruction: 'fill_exactly'},
      {targetNumber: 2, instruction: 'fill_exactly'},
      {targetNumber: 3, instruction: 'fill_exactly'},
      {targetNumber: 2, instruction: 'fill_both_equal'}, // 1+1
    ],
    2: [
      {targetNumber: 2, instruction: 'fill_exactly'},
      {targetNumber: 3, instruction: 'fill_exactly'},
      {targetNumber: 4, instruction: 'fill_exactly'},
      {targetNumber: 4, instruction: 'fill_both_equal'}, // 2+2
    ],
    3: [
      {targetNumber: 3, instruction: 'fill_exactly'},
      {targetNumber: 4, instruction: 'fill_exactly'},
      {targetNumber: 5, instruction: 'fill_exactly'},
      {targetNumber: 5, instruction: 'fill_top_row'},
    ],
    4: [
      {targetNumber: 5, instruction: 'fill_top_row'},
      {targetNumber: 5, instruction: 'fill_bottom_row'},
      {targetNumber: 4, instruction: 'fill_exactly'},
      {targetNumber: 6, instruction: 'fill_exactly'},
      {targetNumber: 6, instruction: 'fill_both_equal'}, // 3+3
    ],
    5: [
      {targetNumber: 4, instruction: 'fill_both_equal'}, // 2+2
      {targetNumber: 6, instruction: 'fill_both_equal'}, // 3+3
      {targetNumber: 8, instruction: 'fill_both_equal'}, // 4+4
      {targetNumber: 5, instruction: 'fill_top_row'},
      {targetNumber: 7, instruction: 'fill_exactly'},
    ],
    6: [
      {targetNumber: 6, instruction: 'fill_exactly'},
      {targetNumber: 7, instruction: 'fill_exactly'},
      {targetNumber: 8, instruction: 'fill_exactly'},
      {targetNumber: 5, instruction: 'fill_bottom_row'},
      {targetNumber: 6, instruction: 'fill_both_equal'}, // 3+3
    ],
    7: [
      {targetNumber: 5, instruction: 'fill_bottom_row'},
      {targetNumber: 5, instruction: 'fill_top_row'},
      {targetNumber: 7, instruction: 'fill_exactly'},
      {targetNumber: 8, instruction: 'fill_exactly'},
      {targetNumber: 8, instruction: 'fill_both_equal'}, // 4+4
    ],
    8: [
      {targetNumber: 8, instruction: 'fill_exactly'},
      {targetNumber: 9, instruction: 'fill_exactly'},
      {targetNumber: 10, instruction: 'fill_exactly'},
      {targetNumber: 10, instruction: 'fill_both_equal'}, // 5+5
      {targetNumber: 5, instruction: 'fill_top_row'},
    ],
  };

  const pool = pools[level] ?? [
    // Level 9+: mix of everything
    {targetNumber: 5, instruction: 'fill_top_row' as const},
    {targetNumber: 5, instruction: 'fill_bottom_row' as const},
    {targetNumber: Math.floor(Math.random() * 4 + 1) * 2, instruction: 'fill_both_equal' as const},
    {targetNumber: Math.floor(Math.random() * 10) + 1, instruction: 'fill_exactly' as const},
    {targetNumber: Math.floor(Math.random() * 5) + 5, instruction: 'fill_exactly' as const},
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}
