import AsyncStorage from '@react-native-async-storage/async-storage';
import {CellState} from '../types/game';

// The modes whose first visit gets the ghost-hand demo: the ones played by
// tapping cells in the ten frame.
export type DemoMode = 'counting' | 'addition' | 'subtraction' | 'puzzle';

const SEEN_KEY = '@tenframes_demos_seen';

let seen: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

function load(): Promise<Set<string>> {
  if (seen) return Promise.resolve(seen);
  if (!loading) {
    loading = AsyncStorage.getItem(SEEN_KEY)
      .then(raw => {
        const list = raw ? JSON.parse(raw) : [];
        seen = new Set(Array.isArray(list) ? list : []);
        return seen;
      })
      .catch(() => {
        seen = new Set();
        return seen;
      });
  }
  return loading;
}

export async function hasSeenDemo(mode: DemoMode): Promise<boolean> {
  return (await load()).has(mode);
}

// Marked when the demo starts — or when the child taps before it could,
// since a child who already taps doesn't need to be shown how.
export async function markDemoSeen(mode: DemoMode): Promise<void> {
  const set = await load();
  if (set.has(mode)) return;
  set.add(mode);
  try {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {
    // Not persisted: the demo may show once more after a restart. Harmless.
  }
}

// Which cell the ghost hand taps. It shows the GESTURE, never the answer,
// so it is always a single tap: an empty cell for counting, adding and
// making ten ("tap an empty one and a counter drops in"), the last filled
// cell for subtracting ("tap one to take it away"). One tap also can't
// contradict a level that asks for exactly one. Returns [] when the board
// offers nothing to demonstrate on.
export function pickDemoTargets(mode: DemoMode, cells: CellState[]): number[] {
  if (mode === 'subtraction') {
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i] !== 'empty') return [i];
    }
    return [];
  }
  const firstEmpty = cells.indexOf('empty');
  return firstEmpty === -1 ? [] : [firstEmpty];
}

// Test seam: forget the in-memory cache so a test can start from storage.
export function resetDemoCacheForTests() {
  seen = null;
  loading = null;
}
