import {GameMode, Problem} from '../types/game';

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
