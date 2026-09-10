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

// Never serve the identical problem twice in a row. Focused levels draw from
// pools as small as 2-3 facts (doubles bands, young pools), so a plain
// uniform pick repeats back-to-back often enough that children notice. The
// guard remembers the last key per scope and re-rolls a few times; a pool of
// size one (share level 6 is always 10÷5 by design) simply gives up and
// repeats, which is correct there.
const lastServedKey = new Map<string, string>();

function withoutImmediateRepeat<T>(
  scope: string,
  generate: () => T,
  keyOf: (value: T) => string,
): T {
  let value = generate();
  const last = lastServedKey.get(scope);
  // 25 re-rolls: for a pool of two the miss chance is 2^-26 per draw —
  // effectively never — while a pool of one falls through quickly.
  for (let tries = 0; tries < 25 && keyOf(value) === last; tries++) {
    value = generate();
  }
  lastServedKey.set(scope, keyOf(value));
  return value;
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
  return withoutImmediateRepeat(
    gameMode,
    () => generateProblemOnce(gameMode, level, ageGroup),
    p => `${p.num1}|${p.num2}`,
  );
}

function generateProblemOnce(
  gameMode: GameMode,
  level: number,
  ageGroup: AgeGroup,
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
  // Levels 21-25: doubles drill, but each level picks a double from a small
  // band around its center (±1, clamped 1..5). Five identical doubles in a
  // row felt repetitive; mixing 2-3 nearby doubles keeps the level engaging
  // while staying focused.
  if (level >= 21 && level <= 25) {
    const center = level - 20;
    const lo = Math.max(1, center - 1);
    const hi = Math.min(5, center + 1);
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    return {num1: n, num2: n, answer: n + n};
  }

  // Level 26: near-doubles (n + n+1). The standard step after doubles — "5 and
  // 6 is double 5 and one more" — and the only thing Doubles Castle's second
  // boss can be without changing game mode. Caps at 4+5 so it fits the frame.
  if (level === 26) {
    const n = 1 + Math.floor(Math.random() * 4);
    return {num1: n, num2: n + 1, answer: n + n + 1};
  }

  // Levels 30-35: "High Five!" — num1 is always 5, a full top row, and the
  // child counts on from it. 30 -> +1 ... 34 -> +5 with a +/-1 band so no
  // level is a single fact; 35 mixes 1..5. Deliberately clear of the 20-25
  // doubles band, which AdventureLevelScreen checks for its doubles voice.
  if (level >= 30 && level <= 35) {
    const center = level - 29;
    const num2 =
      level === 35
        ? 1 + Math.floor(Math.random() * 5)
        : Math.max(1, Math.min(5, center + (Math.floor(Math.random() * 3) - 1)));
    return {num1: 5, num2, answer: 5 + num2};
  }

  // Levels 12-18: SUM bands. Levels 1-9 fix the addend and let the total vary,
  // which narrows the pool as it climbs — measured, level 9 reaches exactly
  // three facts (1+8, 1+9, 2+8) at the climax of the biggest world. Fixing the
  // TOTAL instead widens it: sum 6 has 5 facts, sum 10 has 9.
  //   12-16 -> sums 6,7,8,9,10   17 -> mixed 6..10   18 -> mixed 8..10
  if (level >= 12 && level <= 18) {
    const sum =
      level <= 16
        ? level - 6
        : level === 17
        ? 6 + Math.floor(Math.random() * 5)
        : 8 + Math.floor(Math.random() * 3);
    const a = 1 + Math.floor(Math.random() * (sum - 1));
    return {num1: a, num2: sum - a, answer: sum};
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
  // Mirror of the addition sum bands: fix the MINUEND and let the subtrahend
  // range over it, so the pool widens with the level instead of collapsing.
  //   12-16 -> minuend 6,7,8,9,10   17 -> mixed 6..10   18 -> mixed 8..10
  if (level >= 12 && level <= 18) {
    const minuend =
      level <= 16
        ? level - 6
        : level === 17
        ? 6 + Math.floor(Math.random() * 5)
        : 8 + Math.floor(Math.random() * 3);
    const sub = 1 + Math.floor(Math.random() * (minuend - 1));
    return {num1: minuend, num2: sub, answer: minuend - sub};
  }

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

// Level 8: the Farm Share finale — every split the world taught, mixed. Needed
// because levels 6 (÷5) and 7 (mixed ÷2) were already taken by regular levels,
// so the world's two bosses had nowhere distinct to sit.
const SHARE_FINALE: {total: number; buckets: number}[] = [
  {total: 8, buckets: 2},
  {total: 10, buckets: 2},
  {total: 6, buckets: 3},
  {total: 9, buckets: 3},
  {total: 10, buckets: 5},
];

export function generateShareProblem(level: number): ShareProblem {
  return withoutImmediateRepeat(
    'share',
    () => generateShareProblemOnce(level),
    p => `${p.total}|${p.buckets}`,
  );
}

function generateShareProblemOnce(level: number): ShareProblem {
  if (level === 8) {
    const p = SHARE_FINALE[Math.floor(Math.random() * SHARE_FINALE.length)];
    return {total: p.total, buckets: p.buckets, target: p.total / p.buckets};
  }
  const cfg = SHARE_CONFIGS[level] ?? SHARE_CONFIGS[1];
  const total = cfg.totals[Math.floor(Math.random() * cfg.totals.length)];
  return {total, buckets: cfg.buckets, target: total / cfg.buckets};
}

export function generatePuzzleNumber(level?: number): number {
  return withoutImmediateRepeat(
    'puzzle',
    () => generatePuzzleNumberOnce(level),
    n => String(n),
  );
}

function generatePuzzleNumberOnce(level?: number): number {
  // Each level picks the start number from a small band around its modeLevel
  // (±1) so the 5 problems in a level mix 2-3 different partners — drilling
  // one pair 5x straight was too repetitive. Level 0 / 10+ is fully random.
  if (level !== undefined && level >= 1 && level <= 9) {
    const lo = Math.max(1, level - 1);
    const hi = Math.min(9, level + 1);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
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
  return withoutImmediateRepeat(
    'counting',
    () => generateCountingChallengeOnce(level),
    c => `${c.targetNumber}|${c.instruction}`,
  );
}

function generateCountingChallengeOnce(level: number): CountingChallenge {
  // Pool of challenges per level - picks randomly from pool
  const pools: Record<number, CountingChallenge[]> = {
    // High Five! — levels 11-12. The whole point is that a full top row is
    // five and can be seen without recounting, so every challenge here is
    // anchored on a row rather than on a bare quantity.
    11: [
      {targetNumber: 5, instruction: 'fill_top_row'},
      {targetNumber: 5, instruction: 'fill_bottom_row'},
      {targetNumber: 5, instruction: 'fill_exactly'},
      {targetNumber: 10, instruction: 'fill_both_equal'},
    ],
    12: [
      {targetNumber: 6, instruction: 'fill_exactly'},
      {targetNumber: 7, instruction: 'fill_exactly'},
      {targetNumber: 8, instruction: 'fill_exactly'},
      {targetNumber: 9, instruction: 'fill_exactly'},
      {targetNumber: 10, instruction: 'fill_exactly'},
    ],
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
    case 7: min = 7; max = 9; durationMs = 1200; break; // grand champion
    default: min = 3; max = 5; durationMs = 2200;
  }
  const targetCount = min + Math.floor(Math.random() * (max - min + 1));

  // Pick targetCount random cell positions from 0-9. Fisher-Yates: the old
  // `.sort(() => Math.random() - 0.5)` is not a uniform shuffle — comparator
  // results are inconsistent, so the outcome depends on the sort algorithm and
  // some positions were systematically favoured.
  const pool = Array.from({length: 10}, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const indices = pool.slice(0, targetCount);

  const targetCells: CellState[] = Array(10).fill("empty");
  for (const i of indices) targetCells[i] = "filled";

  return {targetCells, targetCount, showDurationMs: durationMs};
}
