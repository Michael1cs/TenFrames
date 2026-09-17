/**
 * The ghost-hand demo: which cell it taps, and that it is shown once per
 * mode across restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasSeenDemo,
  markDemoSeen,
  pickDemoTargets,
  resetDemoCacheForTests,
} from '../src/utils/firstTimeDemo';
import {CellState} from '../src/types/game';

const board = (filled: number, state: CellState = 'color1'): CellState[] =>
  Array.from({length: 10}, (_, i) => (i < filled ? state : 'empty'));

describe('ghost-hand demo targets', () => {
  it('taps the first empty cell when adding a counter', () => {
    expect(pickDemoTargets('counting', board(0))).toEqual([0]);
    expect(pickDemoTargets('addition', board(4))).toEqual([4]);
    expect(pickDemoTargets('puzzle', board(7))).toEqual([7]);
  });

  it('shows a single tap, never the answer', () => {
    for (const mode of ['counting', 'addition', 'subtraction', 'puzzle'] as const) {
      expect(pickDemoTargets(mode, board(5)).length).toBeLessThanOrEqual(1);
    }
  });

  it('takes away the last counter when subtracting', () => {
    expect(pickDemoTargets('subtraction', board(6))).toEqual([5]);
  });

  it('has nothing to show on a board that offers no move', () => {
    expect(pickDemoTargets('addition', board(10))).toEqual([]);
    expect(pickDemoTargets('subtraction', board(0))).toEqual([]);
  });
});

describe('ghost-hand demo, seen once', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetDemoCacheForTests();
  });

  it('is unseen on a fresh install', async () => {
    expect(await hasSeenDemo('counting')).toBe(false);
  });

  it('stays seen across a restart, per mode', async () => {
    await markDemoSeen('addition');
    resetDemoCacheForTests(); // as if the app relaunched
    expect(await hasSeenDemo('addition')).toBe(true);
    expect(await hasSeenDemo('subtraction')).toBe(false);
  });
});
