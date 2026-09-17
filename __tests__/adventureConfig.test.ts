import {
  ADVENTURE_WORLDS,
  getDefaultAdventureProgress,
  isLevelPremiumLocked,
  nextPlayableLevel,
  pickRecommendedWorld,
} from '../src/config/adventureWorlds';
import {AdventureLevelProgress, AdventureProgress, WorldId} from '../src/types/game';

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

describe('recommended world', () => {
  // Finish the first `count` levels of a world and unlock the one after,
  // the way playing through them would.
  function play(progress: AdventureProgress, worldId: WorldId, count: number) {
    const world = ADVENTURE_WORLDS.find(w => w.id === worldId)!;
    world.levels.forEach((level, i) => {
      const lp = progress.worlds[worldId].levels[level.id];
      if (i < count) Object.assign(lp, {unlocked: true, completed: true, stars: 3, attempts: 1});
      if (i === count) lp.unlocked = true;
    });
    return progress;
  }

  it('points a new player at the first world', () => {
    expect(pickRecommendedWorld(getDefaultAdventureProgress(), false)).toBe('counting-meadow');
  });

  it('stays on the world the child is playing', () => {
    const p = play(getDefaultAdventureProgress(), 'counting-meadow', 2);
    expect(pickRecommendedWorld(p, false)).toBe('counting-meadow');
  });

  it('prefers the furthest world the child has started', () => {
    const p = getDefaultAdventureProgress();
    play(p, 'counting-meadow', 1);
    play(p, 'addition-island', 1);
    expect(pickRecommendedWorld(p, false)).toBe('addition-island');
  });

  it("never points a free player at a crown", () => {
    // Hungry Monsters has one free level: once it's done, the next level is
    // premium, so the pulse moves on to a world with something free left.
    const p = play(getDefaultAdventureProgress(), 'monster-more', 1);
    const mm = ADVENTURE_WORLDS.find(w => w.id === 'monster-more')!;
    expect(mm.freeLevels).toBe(1);
    const pick = pickRecommendedWorld(p, false);
    expect(pick).not.toBe('monster-more');
    expect(pick).toBe('counting-meadow');
  });

  it('keeps a premium player on the world they started', () => {
    const p = play(getDefaultAdventureProgress(), 'monster-more', 1);
    expect(pickRecommendedWorld(p, true)).toBe('monster-more');
  });

  it('moves on from a finished world', () => {
    const cm = ADVENTURE_WORLDS.find(w => w.id === 'counting-meadow')!;
    const p = play(getDefaultAdventureProgress(), 'counting-meadow', cm.levels.length);
    expect(pickRecommendedWorld(p, true)).toBe('high-five');
  });
});

describe('what a child can play next', () => {
  const fresh = {unlocked: false, completed: false, stars: 0, bestFirstTry: 0, attempts: 0};
  const done = {...fresh, unlocked: true, completed: true, stars: 3, attempts: 1};
  const open = {...fresh, unlocked: true};

  function worldWithProgress(worldId: string, completedCount: number) {
    const progress = getDefaultAdventureProgress();
    const world = ADVENTURE_WORLDS.find(w => w.id === worldId)!;
    world.levels.forEach((level, i) => {
      progress.worlds[world.id].levels[level.id] =
        i < completedCount ? {...done} : i === completedCount ? {...open} : {...fresh};
    });
    return {world, progress};
  }

  it('never offers a free child a crowned level', () => {
    // Hungry Monsters has one free level; after it, everything is crowned.
    const {world, progress} = worldWithProgress('monster-more', 1);
    expect(world.freeLevels).toBe(1);
    expect(nextPlayableLevel(world, progress, false)).toBeNull();
    expect(nextPlayableLevel(world, progress, true)?.order).toBe(2);
  });

  it('offers the next unfinished level while free ones remain', () => {
    const {world, progress} = worldWithProgress('counting-meadow', 1);
    expect(nextPlayableLevel(world, progress, false)?.order).toBe(2);
  });

  it('returns nothing once a premium player has finished a world', () => {
    const world = ADVENTURE_WORLDS.find(w => w.id === 'counting-meadow')!;
    const {progress} = worldWithProgress('counting-meadow', world.levels.length);
    expect(nextPlayableLevel(world, progress, true)).toBeNull();
  });
});

describe('bonus levels stay reachable', () => {
  it('never asks for more than 80% of the stars available before it', () => {
    // Memory Garden's last bonus used to require every star of the world:
    // perfection on all six levels before it, or the level never opened.
    for (const w of ADVENTURE_WORLDS) {
      w.levels.forEach((level, i) => {
        const cond = level.unlockCondition as {type: string; stars?: number};
        if (cond.type !== 'stars') return;
        const available = 3 * i; // levels before this one, three stars each
        expect(cond.stars ?? 0).toBeLessThanOrEqual(Math.ceil(available * 0.8));
      });
    }
  });
});
