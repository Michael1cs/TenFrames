/**
 * Which edition of the app this binary is.
 *
 * The School Edition is the same product sold up-front to institutions through
 * Apple School Manager / managed Android: everything unlocked from first
 * launch, no daily limit, no upgrade screen, no parental gate — because on a
 * managed classroom device there is no parent, no personal Apple ID, and
 * in-app purchases are usually blocked by MDM policy outright.
 *
 * The flag is set by the ENTRY FILE, not by an env var or a manual toggle:
 * `index.school.js` sets `globalThis.__SCHOOL_EDITION__ = true` and then
 * requires the normal `index.js`. The school binaries are produced by builds
 * whose native config points ENTRY_FILE at `index.school.js`, so the JS bundle
 * itself differs — a consumer binary cannot accidentally ship as school or
 * vice versa, and nothing needs flipping back after a release.
 *
 * Reading it once at module scope is deliberate: the entry file runs before
 * any app module is evaluated, and an edition cannot change mid-session.
 */
export const IS_SCHOOL_EDITION: boolean =
  (globalThis as {__SCHOOL_EDITION__?: unknown}).__SCHOOL_EDITION__ === true;
