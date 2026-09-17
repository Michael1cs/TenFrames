/**
 * A paid unlock and the day's exercise counts must survive a cold start.
 *
 * They did not: GameShell's save effect ran on mount, before the boot effect
 * had read storage, and wrote the hook's initial values over the stored ones —
 * isPremium false in a release build. A parent who paid got the free app back
 * on the next launch, and force-quitting reset the free daily limit. It never
 * showed in development, where usePremium starts premium.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

// No @types/node in this project; declare the one global the test flips.
declare const global: {__DEV__: boolean};

const PREMIUM_KEY = '@tenframes_premium';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function coldStart() {
  // A release build is the case that matters: usePremium starts premium in
  // development, so the wipe wrote back `true` and hid itself.
  // usePremium reads __DEV__ when it renders, so flipping it here is enough;
  // re-requiring the module tree would give the test a second React.
  global.__DEV__ = false;
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Let the boot effect's awaited storage reads settle.
  for (let i = 0; i < 6; i++) {
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
  }
  await ReactTestRenderer.act(async () => {
    tree.unmount();
  });
}

afterEach(() => {
  global.__DEV__ = true;
});

describe('premium data survives a cold start', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps a purchased unlock', async () => {
    await AsyncStorage.setItem(
      PREMIUM_KEY,
      JSON.stringify({
        isPremium: true,
        purchaseDate: '2026-09-01T10:00:00.000Z',
        dailyUsage: {date: '', counts: {}},
      }),
    );

    await coldStart();

    const stored = JSON.parse((await AsyncStorage.getItem(PREMIUM_KEY)) as string);
    expect(stored.isPremium).toBe(true);
    expect(stored.purchaseDate).toBe('2026-09-01T10:00:00.000Z');
  });

  it("keeps today's exercise counts, so force-quitting does not reset the free limit", async () => {
    await AsyncStorage.setItem(
      PREMIUM_KEY,
      JSON.stringify({
        isPremium: false,
        dailyUsage: {date: today(), counts: {addition: 5, subtraction: 2}},
      }),
    );

    await coldStart();

    const stored = JSON.parse((await AsyncStorage.getItem(PREMIUM_KEY)) as string);
    expect(stored.dailyUsage.date).toBe(today());
    expect(stored.dailyUsage.counts).toEqual({addition: 5, subtraction: 2});
  });
});

describe('the app actually mounts in tests', () => {
  it('renders a non-empty tree', async () => {
    await AsyncStorage.clear();
    global.__DEV__ = false;
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    for (let i = 0; i < 6; i++) {
      await ReactTestRenderer.act(async () => {
        await Promise.resolve();
      });
    }
    const json = tree.toJSON();
    expect(json).not.toBeNull();
    // The boot gate renders null until storage has been read; past it there
    // is a real tree with the home screen's wordmark in it.
    const text = JSON.stringify(json);
    expect(text.length).toBeGreaterThan(200);
    await ReactTestRenderer.act(async () => {
      tree.unmount();
    });
  });
});
