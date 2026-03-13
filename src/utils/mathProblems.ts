import {GameMode, Problem} from '../types/game';

export function generateProblem(gameMode: GameMode): Problem {
  let num1: number, num2: number, answer: number;

  if (gameMode === 'addition') {
    num1 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    num2 = Math.floor(Math.random() * (10 - num1)) + 1; // 1 to (10-num1)
    answer = num1 + num2;

    if (answer > 10) {
      return generateProblem(gameMode);
    }
  } else if (gameMode === 'subtraction') {
    num1 = Math.floor(Math.random() * 7) + 3; // 3 to 9
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 to (num1-1)
    answer = num1 - num2;

    if (answer <= 0 || answer > 9) {
      return generateProblem(gameMode);
    }
  } else {
    // Default / counting / puzzle
    num1 = Math.floor(Math.random() * 8) + 1;
    num2 = Math.floor(Math.random() * (10 - num1)) + 1;
    answer = num1 + num2;
  }

  return {num1, num2, answer};
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
