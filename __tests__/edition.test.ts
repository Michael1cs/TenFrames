/**
 * The edition flag is the single switch that turns the consumer binary into
 * the School Edition. It is set only by index.school.js, before any app
 * module loads — these tests pin down both directions and the read-once
 * semantics that the native builds rely on.
 */

// globalThis is already declared; this is just a typed view of the one
// property the entry file sets.
const g = globalThis as {__SCHOOL_EDITION__?: unknown};

afterEach(() => {
  delete g.__SCHOOL_EDITION__;
  jest.resetModules();
});

it('defaults to the consumer edition when the global is absent', () => {
  jest.isolateModules(() => {
    const {IS_SCHOOL_EDITION} = require('../src/config/edition');
    expect(IS_SCHOOL_EDITION).toBe(false);
  });
});

it('is the school edition when the entry file has set the global', () => {
  g.__SCHOOL_EDITION__ = true;
  jest.isolateModules(() => {
    const {IS_SCHOOL_EDITION} = require('../src/config/edition');
    expect(IS_SCHOOL_EDITION).toBe(true);
  });
});

it('treats anything but literal true as consumer', () => {
  for (const junk of [1, 'true', {}, null]) {
    g.__SCHOOL_EDITION__ = junk;
    jest.isolateModules(() => {
      const {IS_SCHOOL_EDITION} = require('../src/config/edition');
      expect(IS_SCHOOL_EDITION).toBe(false);
    });
    jest.resetModules();
  }
});

it('reads once at module scope — a late flip does not change a loaded module', () => {
  jest.isolateModules(() => {
    const {IS_SCHOOL_EDITION} = require('../src/config/edition');
    expect(IS_SCHOOL_EDITION).toBe(false);
    g.__SCHOOL_EDITION__ = true;
    const again = require('../src/config/edition');
    expect(again.IS_SCHOOL_EDITION).toBe(false);
  });
});
