/**
 * How long after the child's last tap the board is judged.
 *
 * The child's answer is WHERE THEY STOP, not where the app catches them.
 * Both Free Play and Adventure used to submit ~350ms after the placed count
 * MATCHED the target, which meant a child tapping onward toward a larger,
 * wrong number was stopped and congratulated the instant they passed through
 * the right one — they could not answer incorrectly by overshooting, and a
 * "first-try correct" score measured tapping rhythm rather than knowing.
 *
 * Under the stop rule the pause itself is the commitment, so the same constant
 * has to govern both places or the two halves of the app disagree about what
 * an answer is.
 *
 * Tune against a real 4-7 year old: too short judges a slow counter
 * mid-thought, too long makes a correct answer feel ignored.
 */
export const STOP_JUDGE_MS = 2000;
