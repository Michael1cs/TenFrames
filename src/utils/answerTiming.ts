import {Problem} from '../types/game';

/**
 * Has the child actually touched the board yet?
 *
 * Free Play seeds `userAnswer` with the operand already on the frame
 * (`useGameState` calls `setUserAnswer(problem.num1)` when a new addition or
 * subtraction problem is set up), so "userAnswer is not null" does NOT mean
 * "the child answered". Getting this wrong armed the stop-rule timer the
 * instant a problem appeared: the board was judged wrong two seconds later
 * without a single tap, and because `handleCellClick` ignores taps once
 * `hasSubmitted` is set, the frame then went dead for the rest of the problem.
 *
 * The board counts as engaged when the filled count differs from where it
 * started — the child added a counter (addition, puzzle) or removed one
 * (subtraction). Returning the board to its starting state disengages again,
 * which is correct: an undone move is not an answer.
 */
export function hasEngaged(
  userAnswer: number | null,
  problem: Problem | null,
): boolean {
  if (userAnswer === null || !problem) return false;
  return userAnswer !== problem.num1;
}
