import {
  ADVENTURE_WORLDS,
  getDefaultAdventureProgress,
  isLevelPremiumLocked,
} from '../src/config/adventureWorlds';
import {AdventureLevelProgress} from '../src/types/game';

const ALL_LEVELS = ADVENTURE_WORLDS.flatMap(w => w.levels);

describe('adventure configuration', () => {
  it('gives every world a default progress entry', () => {
    const defaults = getDefaultAdventureProgress();
    for (const world of ADVENTURE_WORLDS) {
      expect(defaults.worlds[world.id]).toBeDefined();
      for (const level of world.levels) {
        expect(defaults.worlds[world.id].levels[level.id]).toBeDefined();
      }
    }
  });

  it('uses a unique id for every level', () => {
    const ids = ALL_LEVELS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stamps every level with its own world id', () => {
    for (const world of ADVENTURE_WORLDS) {
      for (const level of world.levels) {
        expect(level.worldId).toBe(world.id);
      }
    }
  });

  it('numbers levels consecutively from one', () => {
    for (const world of ADVENTURE_WORLDS) {
      const orders = world.levels.map(l => l.order);
      expect(orders).toEqual(orders.map((_, i) => i + 1));
    }
  });

  it('only ever unlocks from a level that exists', () => {
    const ids = new Set(ALL_LEVELS.map(l => l.id));
    for (const level of ALL_LEVELS) {
      const cond = level.unlockCondition as {type: string; levelId?: string};
      if (cond.type === 'prev' && cond.levelId) {
        expect(ids.has(cond.levelId)).toBe(true);
      }
    }
  });

  it('starts every world with exactly one first level', () => {
    for (const world of ADVENTURE_WORLDS) {
      const firsts = world.levels.filter(
        l => (l.unlockCondition as {type: string}).type === 'first',
      );
      expect(firsts).toHaveLength(1);
      expect(firsts[0].order).toBe(1);
    }
  });

  // Five worlds shipped their two bosses with an identical modeLevel, so the
  // reward for finishing a world was the same level twice, behind the paywall.
  it('never ends a world with the same boss twice', () => {
    for (const world of ADVENTURE_WORLDS) {
      const bosses = world.levels.filter(l => l.isBonus);
      if (bosses.length < 2) continue;
      const signatures = bosses.map(
        b => `${b.gameMode}|${b.modeLevel}|${b.puzzleTarget ?? 'default'}`,
      );
      expect(new Set(signatures).size).toBe(signatures.length);
    }
  });

  it('keeps at least one level free in every world', () => {
    for (const world of ADVENTURE_WORLDS) {
      expect(world.freeLevels).toBeGreaterThan(0);
      expect(world.freeLevels).toBeLessThanOrEqual(world.levels.length);
    }
  });

  it('includes High Five! as the second world', () => {
    expect(ADVENTURE_WORLDS[1].id).toBe('high-five');
    expect(ADVENTURE_WORLDS[1].levels).toHaveLength(10);
  });
});

describe('premium locking', () => {
  const fresh: AdventureLevelProgress = {
    unlocked: false,
    completed: false,
    stars: 0,
    bestFirstTry: 0,
    attempts: 0,
  };
  const unlocked = {...fresh, unlocked: true};
  const completed = {...fresh, unlocked: true, completed: true, stars: 2, attempts: 1};

  const world = (id: string) => ADVENTURE_WORLDS.find(w => w.id === id)!;
  const level = (worldId: string, order: number) =>
    world(worldId).levels.find(l => l.order === order)!;

  it('never locks anything for a premium player', () => {
    for (const w of ADVENTURE_WORLDS) {
      for (const l of w.levels) {
        expect(isLevelPremiumLocked(w, l, fresh, true)).toBe(false);
      }
    }
  });

  it("keeps each world's free levels open", () => {
    for (const w of ADVENTURE_WORLDS) {
      for (const l of w.levels.filter(x => !x.isBonus && x.order <= w.freeLevels)) {
        expect(isLevelPremiumLocked(w, l, fresh, false)).toBe(false);
      }
    }
  });

  it('locks levels past the free allowance, and every bonus', () => {
    const mm = world('monster-more'); // one free level
    expect(isLevelPremiumLocked(mm, level('monster-more', 2), fresh, false)).toBe(true);
    for (const w of ADVENTURE_WORLDS) {
      for (const l of w.levels.filter(x => x.isBonus)) {
        expect(isLevelPremiumLocked(w, l, fresh, false)).toBe(true);
      }
    }
  });

  it('grandfathers a level the child already completed', () => {
    // A free player who finished Make 10! level 3 under the old flat
    // three-free-levels tier must keep it after the tier shrank to one.
    const mtb = world('make-ten-beach');
    expect(mtb.freeLevels).toBeLessThan(3);
    expect(isLevelPremiumLocked(mtb, level('make-ten-beach', 3), completed, false)).toBe(false);
  });

  it('does NOT grandfather a level that is merely unlocked', () => {
    // Progression unlocks the next level on a fresh install too, so treating
    // "unlocked" as owned would hand every new player the paid levels.
    const mtb = world('make-ten-beach');
    expect(isLevelPremiumLocked(mtb, level('make-ten-beach', 2), unlocked, false)).toBe(true);
  });
});
