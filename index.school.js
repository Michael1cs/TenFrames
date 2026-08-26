/**
 * @format
 *
 * Entry point for the SCHOOL EDITION binary (com.tenframes.school).
 *
 * This must stay a `require`, not an `import`: ES imports are hoisted above
 * the assignment, which would evaluate the whole app before the flag is set.
 * Everything else — RTL lock, error handler, registration — lives in index.js
 * and runs identically for both editions.
 *
 * Builds select this file via ENTRY_FILE (iOS "Bundle React Native code and
 * images" phase) / the entryFile gradle property (Android). See
 * SCHOOL_EDITION.md.
 */
/* global globalThis */
globalThis.__SCHOOL_EDITION__ = true;

require('./index');
