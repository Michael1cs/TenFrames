import {AgeGroup, CellState, GameMode, MemoryChallenge, Problem, CountingChallenge} from '../types/game';

const YOUNG_ADDITION_POOL: Problem[] = [
  {num1: 1, num2: 1, answer: 2},
  {num1: 1, num2: 2, answer: 3},
  {num1: 2, num2: 1, answer: 3},
  {num1: 1, num2: 3, answer: 4},
  {num1: 3, num2: 1, answer: 4},
  {num1: 2, num2: 2, answer: 4},
  {num1: 1, num2: 4, answer: 5},
  {num1: 4, num2: 1, answer: 5},
  {num1: 2, num2: 3, answer: 5},
  {num1: 3, num2: 2, answer: 5},
];

const YOUNG_SUBTRACTION_POOL: Problem[] = [
  {num1: 2, num2: 1, answer: 1},
  {num1: 3, num2: 1, answer: 2},
  {num1: 3, num2: 2, answer: 1},
  {num1: 4, num2: 1, answer: 3},
  {num1: 4, num2: 2, answer: 2},
  {num1: 4, num2: 3, answer: 1},
  {num1: 5, num2: 1, answer: 4},
  {num1: 5, num2: 2, answer: 3},
  {num1: 5, num2: 3, answer: 2},
  {num1: 5, num2: 4, answer: 1},
];

function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate a problem based on game mode and difficulty level.
 * Levels 1-9: focused practice (e.g., level 1 = +1 only, level 2 = +2 only)
 * Level 10+: random (full range)
 * ageGroup === 'young' clamps sum/difference to ≤ 5.
 */
export function generateProblem(
  gameMode: GameMode,
  level: number = 10,
  ageGroup: AgeGroup = 'older',
): Problem {
  if (ageGroup === 'young') {
    if (gameMode === 'addition') return pickRandom(YOUNG_ADDITION_POOL);
    if (gameMode === 'subtraction') return pickRandom(YOUNG_SUBTRACTION_POOL);
  }
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

// Doubles pool: 1+1, 2+2, 3+3, 4+4, 5+5. Capped at 5+5 since result must fit
// in ten frame (max 10).
const DOUBLES_POOL: Problem[] = [
  {num1: 1, num2: 1, answer: 2},
  {num1: 2, num2: 2, answer: 4},
  {num1: 3, num2: 3, answer: 6},
  {num1: 4, num2: 4, answer: 8},
  {num1: 5, num2: 5, answer: 10},
];

function generateAdditionProblem(level: number): Problem {
  // Special level 20: Doubles Castle random mix.
  if (level === 20) {
    return DOUBLES_POOL[Math.floor(Math.random() * DOUBLES_POOL.length)];
  }
  // Levels 21-25: specific double N+N (21 = 1+1, 22 = 2+2, …, 25 = 5+5).
  if (level >= 21 && level <= 25) {
    const n = level - 20;
    return {num1: n, num2: n, answer: n + n};
  }

  let num1: number, num2: number;

  if (level >= 1 && level <= 9) {
    // Level N: primarily add N, but allow ±1 for variety at higher levels
    if (level >= 7) {
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      num2 = Math.max(1, Math.min(9, level + variation));
    } else {
      num2 = level;
    }
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
    // Level N: primarily subtract N, but allow ±1 for variety at higher levels
    if (level >= 7) {
      // Pool is tiny at high levels, so vary num2 by ±1
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      num2 = Math.max(1, Math.min(9, level + variation));
    } else {
      num2 = level;
    }
    const minNum1 = num2 + 1;
    const maxNum1 = 10;
    num1 = Math.floor(Math.random() * (maxNum1 - minNum1 + 1)) + minNum1;
  } else {
    // Level 10+: random
    num1 = Math.floor(Math.random() * 7) + 3;
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
  }

  return {num1, num2, answer: num1 - num2};
}

/**
 * Decomposition problem: child sees `answer` cells in color1, must flip
 * some of them to color2 so the two groups make a valid split.
 * Each level has a small band of totals (±1 around level + 3) so the
 * 5 problems in a level aren't identical numbers.
 */
export function generateDivideProblem(level: number): Problem {
  const center = Math.min(10, Math.max(3, level + 3));
  const lo = Math.max(3, center - 1);
  const hi = Math.min(10, center + 1);
  const total = lo + Math.floor(Math.random() * (hi - lo + 1));
  const num2 = Math.floor(Math.random() * (total - 1)) + 1;
  const num1 = total - num2;
  return {num1, num2, answer: total};
}

/**
 * Fair-share problem: child shares `total` items equally between `buckets`
 * baskets so each basket gets `target = total / buckets`. Levels progress
 * from ÷2 with small totals (4, 6) up to ÷3 (6, 9) and ÷5 (10).
 */
export interface ShareProblem {
  total: number;
  buckets: number;
  target: number; // total / buckets — always evenly divisible
}

const SHARE_CONFIGS: Record<number, {totals: number[]; buckets: number}> = {
  1: {totals: [4, 6], buckets: 2}, // 4÷2=2, 6÷2=3
  2: {totals: [6, 8], buckets: 2},
  3: {totals: [8, 10], buckets: 2},
  4: {totals: [6, 9], buckets: 3}, // ÷3
  5: {totals: [9, 6], buckets: 3},
  6: {totals: [10], buckets: 5}, // ÷5 — special, maps to ten frame rows
  7: {totals: [4, 6, 8, 10], buckets: 2}, // mixed
};

export function generateShareProblem(level: number): ShareProblem {
  const cfg = SHARE_CONFIGS[level] ?? SHARE_CONFIGS[1];
  const total = cfg.totals[Math.floor(Math.random() * cfg.totals.length)];
  return {total, buckets: cfg.buckets, target: total / cfg.buckets};
}

export function generatePuzzleNumber(level?: number): number {
  // Friends-of-10 progression: levels 1-9 force the partner (e.g. level 3 →
  // puzzleNumber 3 → child must fill 7). Anything else: random 1-8.
  if (level !== undefined && level >= 1 && level <= 9) {
    return level;
  }
  return Math.floor(Math.random() * 8) + 1;
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


/**
 * Generate a memory challenge based on level (1-6).
 * Easier levels: fewer cells, longer show duration.
 */
export function generateMemoryChallenge(level: number): MemoryChallenge {
  let min: number, max: number, durationMs: number;
  switch (level) {
    case 1: min = 1; max = 2; durationMs = 3000; break;
    case 2: min = 2; max = 3; durationMs = 2500; break;
    case 3: min = 3; max = 4; durationMs = 2200; break;
    case 4: min = 4; max = 5; durationMs = 2000; break;
    case 5: min = 5; max = 6; durationMs = 1800; break;
    case 6: min = 6; max = 8; durationMs = 1500; break; // champion
    default: min = 3; max = 5; durationMs = 2200;
  }
  const targetCount = min + Math.floor(Math.random() * (max - min + 1));

  // Pick targetCount random cell positions from 0-9.
  const indices = Array.from({length: 10}, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, targetCount);

  const targetCells: CellState[] = Array(10).fill("empty");
  for (const i of indices) targetCells[i] = "filled";

  return {targetCells, targetCount, showDurationMs: durationMs};
}
