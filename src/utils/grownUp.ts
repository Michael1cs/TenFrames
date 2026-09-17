/**
 * Remembers that a grown-up just answered the parental gate.
 *
 * The gate guards three doors — settings, the parent dashboard and the price
 * screen — and a parent who opened settings and then tapped "unlock" was
 * asked the multiplication twice within ten seconds. One answer now opens
 * every door for a few minutes, which is long enough to finish what they
 * came to do and short enough that a child picking up the phone later
 * still meets the gate.
 */
const GROWN_UP_WINDOW_MS = 5 * 60 * 1000;

let verifiedUntil = 0;

export function markGrownUp(now: number = Date.now()): void {
  verifiedUntil = now + GROWN_UP_WINDOW_MS;
}

export function isGrownUp(now: number = Date.now()): boolean {
  return now < verifiedUntil;
}

/** Test seam. */
export function forgetGrownUp(): void {
  verifiedUntil = 0;
}
