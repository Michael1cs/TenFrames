import {AdventureWorld, AdventureProgress} from '../types/game';

// v1.6 Adventure: 7 lumi cu progresie completa = 68 niveluri totale.
// Pentru 4-6 ani, mai multe niveluri = retention mai bun + justifica
// pretul premium fata de o aplicatie cu doar 30 niveluri.
//
// Structura per lume:
//   - Counting: 10 niveluri (cm1-cm8 + 2 bonus)
//   - Addition: 12 niveluri (ai1-ai10 + 2 bonus)
//   - Subtraction: 12 niveluri (sm1-sm10 + 2 bonus)
//   - Make 10: 11 niveluri (mtb1-mtb9 drill pe perechi 1+9...9+1 + 2 bonus mix)
//   - Doubles: 7 niveluri (5 doubles individuale + 2 bonus mix)
//   - Memory: 7 niveluri (5 progresive + 2 bonus la cels max)
//   - Farm Share: 8 niveluri (6 progresive ÷2..÷5 + 2 bonus mix)

function unlockPrev(prev: string) {
  return {type: 'previous' as const, levelId: prev};
}

function unlockStars(worldId: any, count: number) {
  return {type: 'stars' as const, worldId, count};
}

export const ADVENTURE_WORLDS: AdventureWorld[] = [
  // === World 1: Counting Meadow ===
  {
    id: 'counting-meadow',
    nameKey: 'adventure.worlds.countingMeadow',
    emoji: '🌿',
    theme: 'forest',
    freeLevels: 3,
    levels: [
      {id: 'cm-1', worldId: 'counting-meadow', order: 1, nameKey: 'adventure.levels.cm1', emoji: '🍄', isBonus: false, gameMode: 'counting', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'cm-2', worldId: 'counting-meadow', order: 2, nameKey: 'adventure.levels.cm2', emoji: '🦋', isBonus: false, gameMode: 'counting', modeLevel: 2, problemCount: 5, unlockCondition: unlockPrev('cm-1')},
      {id: 'cm-3', worldId: 'counting-meadow', order: 3, nameKey: 'adventure.levels.cm3', emoji: '🌸', isBonus: false, gameMode: 'counting', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('cm-2')},
      {id: 'cm-4', worldId: 'counting-meadow', order: 4, nameKey: 'adventure.levels.cm4', emoji: '🐛', isBonus: false, gameMode: 'counting', modeLevel: 4, problemCount: 5, unlockCondition: unlockPrev('cm-3')},
      {id: 'cm-5', worldId: 'counting-meadow', order: 5, nameKey: 'adventure.levels.cm5', emoji: '🌻', isBonus: false, gameMode: 'counting', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('cm-4')},
      {id: 'cm-6', worldId: 'counting-meadow', order: 6, nameKey: 'adventure.levels.cm6', emoji: '🦊', isBonus: false, gameMode: 'counting', modeLevel: 6, problemCount: 5, unlockCondition: unlockPrev('cm-5')},
      {id: 'cm-7', worldId: 'counting-meadow', order: 7, nameKey: 'adventure.levels.cm7', emoji: '🦉', isBonus: false, gameMode: 'counting', modeLevel: 7, problemCount: 5, unlockCondition: unlockPrev('cm-6')},
      {id: 'cm-8', worldId: 'counting-meadow', order: 8, nameKey: 'adventure.levels.cm8', emoji: '🌳', isBonus: false, gameMode: 'counting', modeLevel: 8, problemCount: 5, unlockCondition: unlockPrev('cm-7')},
      {id: 'cm-bonus-a', worldId: 'counting-meadow', order: 9, nameKey: 'adventure.levels.cmBonusA', emoji: '⭐', isBonus: true, gameMode: 'counting', modeLevel: 9, problemCount: 5, unlockCondition: unlockStars('counting-meadow', 15)},
      {id: 'cm-bonus-b', worldId: 'counting-meadow', order: 10, nameKey: 'adventure.levels.cmBonusB', emoji: '🏆', isBonus: true, gameMode: 'counting', modeLevel: 10, problemCount: 5, unlockCondition: unlockStars('counting-meadow', 20)},
    ],
  },

  // === World 2: Addition Island ===
  {
    id: 'addition-island',
    nameKey: 'adventure.worlds.additionIsland',
    emoji: '🐳',
    theme: 'ocean',
    freeLevels: 3,
    levels: [
      {id: 'ai-1', worldId: 'addition-island', order: 1, nameKey: 'adventure.levels.ai1', emoji: '🐚', isBonus: false, gameMode: 'addition', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'ai-2', worldId: 'addition-island', order: 2, nameKey: 'adventure.levels.ai2', emoji: '🐟', isBonus: false, gameMode: 'addition', modeLevel: 2, problemCount: 5, unlockCondition: unlockPrev('ai-1')},
      {id: 'ai-3', worldId: 'addition-island', order: 3, nameKey: 'adventure.levels.ai3', emoji: '🦀', isBonus: false, gameMode: 'addition', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('ai-2')},
      {id: 'ai-4', worldId: 'addition-island', order: 4, nameKey: 'adventure.levels.ai4', emoji: '🐠', isBonus: false, gameMode: 'addition', modeLevel: 4, problemCount: 5, unlockCondition: unlockPrev('ai-3')},
      {id: 'ai-5', worldId: 'addition-island', order: 5, nameKey: 'adventure.levels.ai5', emoji: '🐙', isBonus: false, gameMode: 'addition', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('ai-4')},
      {id: 'ai-6', worldId: 'addition-island', order: 6, nameKey: 'adventure.levels.ai6', emoji: '🦞', isBonus: false, gameMode: 'addition', modeLevel: 6, problemCount: 5, unlockCondition: unlockPrev('ai-5')},
      {id: 'ai-7', worldId: 'addition-island', order: 7, nameKey: 'adventure.levels.ai7', emoji: '🐬', isBonus: false, gameMode: 'addition', modeLevel: 7, problemCount: 5, unlockCondition: unlockPrev('ai-6')},
      {id: 'ai-8', worldId: 'addition-island', order: 8, nameKey: 'adventure.levels.ai8', emoji: '🐳', isBonus: false, gameMode: 'addition', modeLevel: 8, problemCount: 5, unlockCondition: unlockPrev('ai-7')},
      {id: 'ai-9', worldId: 'addition-island', order: 9, nameKey: 'adventure.levels.ai9', emoji: '🦑', isBonus: false, gameMode: 'addition', modeLevel: 9, problemCount: 5, unlockCondition: unlockPrev('ai-8')},
      {id: 'ai-10', worldId: 'addition-island', order: 10, nameKey: 'adventure.levels.ai10', emoji: '🏝️', isBonus: false, gameMode: 'addition', modeLevel: 10, problemCount: 5, unlockCondition: unlockPrev('ai-9')},
      {id: 'ai-bonus-a', worldId: 'addition-island', order: 11, nameKey: 'adventure.levels.aiBonusA', emoji: '⭐', isBonus: true, gameMode: 'addition', modeLevel: 10, problemCount: 5, unlockCondition: unlockStars('addition-island', 20)},
      {id: 'ai-bonus-b', worldId: 'addition-island', order: 12, nameKey: 'adventure.levels.aiBonusB', emoji: '🏆', isBonus: true, gameMode: 'addition', modeLevel: 11, problemCount: 5, unlockCondition: unlockStars('addition-island', 25)},
    ],
  },

  // === World 3: Subtraction Mountain ===
  {
    id: 'subtraction-mountain',
    nameKey: 'adventure.worlds.subtractionMountain',
    emoji: '🚀',
    theme: 'space',
    freeLevels: 3,
    levels: [
      {id: 'sm-1', worldId: 'subtraction-mountain', order: 1, nameKey: 'adventure.levels.sm1', emoji: '🌙', isBonus: false, gameMode: 'subtraction', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'sm-2', worldId: 'subtraction-mountain', order: 2, nameKey: 'adventure.levels.sm2', emoji: '🚀', isBonus: false, gameMode: 'subtraction', modeLevel: 2, problemCount: 5, unlockCondition: unlockPrev('sm-1')},
      {id: 'sm-3', worldId: 'subtraction-mountain', order: 3, nameKey: 'adventure.levels.sm3', emoji: '🪐', isBonus: false, gameMode: 'subtraction', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('sm-2')},
      {id: 'sm-4', worldId: 'subtraction-mountain', order: 4, nameKey: 'adventure.levels.sm4', emoji: '☄️', isBonus: false, gameMode: 'subtraction', modeLevel: 4, problemCount: 5, unlockCondition: unlockPrev('sm-3')},
      {id: 'sm-5', worldId: 'subtraction-mountain', order: 5, nameKey: 'adventure.levels.sm5', emoji: '🛸', isBonus: false, gameMode: 'subtraction', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('sm-4')},
      {id: 'sm-6', worldId: 'subtraction-mountain', order: 6, nameKey: 'adventure.levels.sm6', emoji: '🌍', isBonus: false, gameMode: 'subtraction', modeLevel: 6, problemCount: 5, unlockCondition: unlockPrev('sm-5')},
      {id: 'sm-7', worldId: 'subtraction-mountain', order: 7, nameKey: 'adventure.levels.sm7', emoji: '👽', isBonus: false, gameMode: 'subtraction', modeLevel: 7, problemCount: 5, unlockCondition: unlockPrev('sm-6')},
      {id: 'sm-8', worldId: 'subtraction-mountain', order: 8, nameKey: 'adventure.levels.sm8', emoji: '🔭', isBonus: false, gameMode: 'subtraction', modeLevel: 8, problemCount: 5, unlockCondition: unlockPrev('sm-7')},
      {id: 'sm-9', worldId: 'subtraction-mountain', order: 9, nameKey: 'adventure.levels.sm9', emoji: '🌌', isBonus: false, gameMode: 'subtraction', modeLevel: 9, problemCount: 5, unlockCondition: unlockPrev('sm-8')},
      {id: 'sm-10', worldId: 'subtraction-mountain', order: 10, nameKey: 'adventure.levels.sm10', emoji: '🌠', isBonus: false, gameMode: 'subtraction', modeLevel: 10, problemCount: 5, unlockCondition: unlockPrev('sm-9')},
      {id: 'sm-bonus-a', worldId: 'subtraction-mountain', order: 11, nameKey: 'adventure.levels.smBonusA', emoji: '⭐', isBonus: true, gameMode: 'subtraction', modeLevel: 10, problemCount: 5, unlockCondition: unlockStars('subtraction-mountain', 20)},
      {id: 'sm-bonus-b', worldId: 'subtraction-mountain', order: 12, nameKey: 'adventure.levels.smBonusB', emoji: '🏆', isBonus: true, gameMode: 'subtraction', modeLevel: 11, problemCount: 5, unlockCondition: unlockStars('subtraction-mountain', 25)},
    ],
  },

  // === World 4: Make 10! ===
  // 6 niveluri progresive + 2 bonus = 8 totale
  {
    id: 'make-ten-beach',
    nameKey: 'adventure.worlds.makeTenBeach',
    emoji: '🍬',
    theme: 'candy',
    freeLevels: 3,
    levels: [
      {id: 'mtb-1', worldId: 'make-ten-beach', order: 1, nameKey: 'adventure.levels.mtb1', emoji: '🍬', isBonus: false, gameMode: 'puzzle', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'mtb-2', worldId: 'make-ten-beach', order: 2, nameKey: 'adventure.levels.mtb2', emoji: '🍭', isBonus: false, gameMode: 'puzzle', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('mtb-1')},
      {id: 'mtb-3', worldId: 'make-ten-beach', order: 3, nameKey: 'adventure.levels.mtb3', emoji: '🧁', isBonus: false, gameMode: 'puzzle', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('mtb-2')},
      {id: 'mtb-4', worldId: 'make-ten-beach', order: 4, nameKey: 'adventure.levels.mtb4', emoji: '🍩', isBonus: false, gameMode: 'puzzle', modeLevel: 7, problemCount: 5, unlockCondition: unlockPrev('mtb-3')},
      {id: 'mtb-5', worldId: 'make-ten-beach', order: 5, nameKey: 'adventure.levels.mtb5', emoji: '🍫', isBonus: false, gameMode: 'puzzle', modeLevel: 9, problemCount: 5, unlockCondition: unlockPrev('mtb-4')},
      {id: 'mtb-6', worldId: 'make-ten-beach', order: 6, nameKey: 'adventure.levels.mtb6', emoji: '🍦', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, unlockCondition: unlockPrev('mtb-5')},
      {id: 'mtb-bonus-a', worldId: 'make-ten-beach', order: 7, nameKey: 'adventure.levels.mtbBonusA', emoji: '⭐', isBonus: true, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, unlockCondition: unlockStars('make-ten-beach', 12)},
      {id: 'mtb-bonus-b', worldId: 'make-ten-beach', order: 8, nameKey: 'adventure.levels.mtbBonusB', emoji: '🏆', isBonus: true, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, unlockCondition: unlockStars('make-ten-beach', 16)},
    ],
  },

  // === World: Mixed Targets ===
  // 6 progresive (Make 3, 5, 6, 7, 8, 9) + 2 bonus cu target='mixed' (3..9
  // random per problem) = 8 niveluri. Puzzle drill, dar fără să fie mereu
  // "Make 10" — copilul învață și partner-pairs pentru numere mai mici.
  {
    id: 'mixed-targets',
    nameKey: 'adventure.worlds.mixedTargets',
    emoji: '🧪',
    theme: 'slime',
    freeLevels: 3,
    levels: [
      {id: 'mt-1', worldId: 'mixed-targets', order: 1, nameKey: 'adventure.levels.mt1', emoji: '🧪', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 3, unlockCondition: {type: 'first'}},
      {id: 'mt-2', worldId: 'mixed-targets', order: 2, nameKey: 'adventure.levels.mt2', emoji: '🧫', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 5, unlockCondition: unlockPrev('mt-1')},
      {id: 'mt-3', worldId: 'mixed-targets', order: 3, nameKey: 'adventure.levels.mt3', emoji: '🔬', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 6, unlockCondition: unlockPrev('mt-2')},
      {id: 'mt-4', worldId: 'mixed-targets', order: 4, nameKey: 'adventure.levels.mt4', emoji: '🧬', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 7, unlockCondition: unlockPrev('mt-3')},
      {id: 'mt-5', worldId: 'mixed-targets', order: 5, nameKey: 'adventure.levels.mt5', emoji: '💊', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 8, unlockCondition: unlockPrev('mt-4')},
      {id: 'mt-6', worldId: 'mixed-targets', order: 6, nameKey: 'adventure.levels.mt6', emoji: '🥽', isBonus: false, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 9, unlockCondition: unlockPrev('mt-5')},
      {id: 'mt-bonus-a', worldId: 'mixed-targets', order: 7, nameKey: 'adventure.levels.mtBonusA', emoji: '⭐', isBonus: true, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 'mixed', unlockCondition: unlockStars('mixed-targets', 12)},
      {id: 'mt-bonus-b', worldId: 'mixed-targets', order: 8, nameKey: 'adventure.levels.mtBonusB', emoji: '🏆', isBonus: true, gameMode: 'puzzle', modeLevel: 0, problemCount: 5, puzzleTarget: 'mixed', unlockCondition: unlockStars('mixed-targets', 16)},
    ],
  },

  // === World 5: Doubles Castle ===
  // 5 doubles individuale (1+1, 2+2, 3+3, 4+4, 5+5) + 2 bonus mix = 7 total
  {
    id: 'doubles-castle',
    nameKey: 'adventure.worlds.doublesCastle',
    emoji: '🏰',
    theme: 'unicorn',
    freeLevels: 3,
    levels: [
      {id: 'dc-1', worldId: 'doubles-castle', order: 1, nameKey: 'adventure.levels.dc1', emoji: '✨', isBonus: false, gameMode: 'addition', modeLevel: 21, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'dc-2', worldId: 'doubles-castle', order: 2, nameKey: 'adventure.levels.dc2', emoji: '🌈', isBonus: false, gameMode: 'addition', modeLevel: 22, problemCount: 5, unlockCondition: unlockPrev('dc-1')},
      {id: 'dc-3', worldId: 'doubles-castle', order: 3, nameKey: 'adventure.levels.dc3', emoji: '🦄', isBonus: false, gameMode: 'addition', modeLevel: 23, problemCount: 5, unlockCondition: unlockPrev('dc-2')},
      {id: 'dc-4', worldId: 'doubles-castle', order: 4, nameKey: 'adventure.levels.dc4', emoji: '👑', isBonus: false, gameMode: 'addition', modeLevel: 24, problemCount: 5, unlockCondition: unlockPrev('dc-3')},
      {id: 'dc-5', worldId: 'doubles-castle', order: 5, nameKey: 'adventure.levels.dc5', emoji: '💎', isBonus: false, gameMode: 'addition', modeLevel: 25, problemCount: 5, unlockCondition: unlockPrev('dc-4')},
      {id: 'dc-bonus-a', worldId: 'doubles-castle', order: 6, nameKey: 'adventure.levels.dcBonusA', emoji: '⭐', isBonus: true, gameMode: 'addition', modeLevel: 20, problemCount: 5, unlockCondition: unlockStars('doubles-castle', 10)},
      {id: 'dc-bonus-b', worldId: 'doubles-castle', order: 7, nameKey: 'adventure.levels.dcBonusB', emoji: '🏆', isBonus: true, gameMode: 'addition', modeLevel: 20, problemCount: 5, unlockCondition: unlockStars('doubles-castle', 15)},
    ],
  },

  // === World 6: Memory Garden ===
  // 5 progresive + 2 bonus (mai multe celule + show mai rapid)
  {
    id: 'memory-garden',
    nameKey: 'adventure.worlds.memoryGarden',
    emoji: '🍄',
    theme: 'unicorn',
    freeLevels: 3,
    levels: [
      {id: 'mg-1', worldId: 'memory-garden', order: 1, nameKey: 'adventure.levels.mg1', emoji: '🚀', isBonus: false, gameMode: 'memory', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}, theme: 'space'},
      {id: 'mg-2', worldId: 'memory-garden', order: 2, nameKey: 'adventure.levels.mg2', emoji: '🐟', isBonus: false, gameMode: 'memory', modeLevel: 2, problemCount: 5, unlockCondition: unlockPrev('mg-1'), theme: 'ocean'},
      {id: 'mg-3', worldId: 'memory-garden', order: 3, nameKey: 'adventure.levels.mg3', emoji: '🍄', isBonus: false, gameMode: 'memory', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('mg-2'), theme: 'forest'},
      {id: 'mg-4', worldId: 'memory-garden', order: 4, nameKey: 'adventure.levels.mg4', emoji: '🐰', isBonus: false, gameMode: 'memory', modeLevel: 4, problemCount: 5, unlockCondition: unlockPrev('mg-3'), theme: 'farm'},
      {id: 'mg-5', worldId: 'memory-garden', order: 5, nameKey: 'adventure.levels.mg5', emoji: '🍬', isBonus: false, gameMode: 'memory', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('mg-4'), theme: 'candy'},
      {id: 'mg-bonus-a', worldId: 'memory-garden', order: 6, nameKey: 'adventure.levels.mgBonusA', emoji: '🦄', isBonus: true, gameMode: 'memory', modeLevel: 6, problemCount: 5, unlockCondition: unlockStars('memory-garden', 12), theme: 'unicorn'},
      {id: 'mg-bonus-b', worldId: 'memory-garden', order: 7, nameKey: 'adventure.levels.mgBonusB', emoji: '👾', isBonus: true, gameMode: 'memory', modeLevel: 6, problemCount: 5, unlockCondition: unlockStars('memory-garden', 18), theme: 'pixel'},
    ],
  },

  // === World 7: Farm Share ===
  // Fair-share / equal grouping: N pieces of food + K baskets with animals;
  // child taps a basket to drop one food in, and the screen advances when
  // all baskets hold the same count. Pedagogy: division as equal sharing,
  // the most intuitive entry point for 4-6 year olds.
  {
    id: 'farm-share',
    nameKey: 'adventure.worlds.farmShare',
    emoji: '🐰',
    theme: 'farm',
    freeLevels: 3,
    levels: [
      {id: 'fs-1', worldId: 'farm-share', order: 1, nameKey: 'adventure.levels.fs1', emoji: '🐰', isBonus: false, gameMode: 'share', modeLevel: 1, problemCount: 5, unlockCondition: {type: 'first'}},
      {id: 'fs-2', worldId: 'farm-share', order: 2, nameKey: 'adventure.levels.fs2', emoji: '🐔', isBonus: false, gameMode: 'share', modeLevel: 2, problemCount: 5, unlockCondition: unlockPrev('fs-1')},
      {id: 'fs-3', worldId: 'farm-share', order: 3, nameKey: 'adventure.levels.fs3', emoji: '🐷', isBonus: false, gameMode: 'share', modeLevel: 3, problemCount: 5, unlockCondition: unlockPrev('fs-2')},
      {id: 'fs-4', worldId: 'farm-share', order: 4, nameKey: 'adventure.levels.fs4', emoji: '🐄', isBonus: false, gameMode: 'share', modeLevel: 4, problemCount: 5, unlockCondition: unlockPrev('fs-3')},
      {id: 'fs-5', worldId: 'farm-share', order: 5, nameKey: 'adventure.levels.fs5', emoji: '🐔', isBonus: false, gameMode: 'share', modeLevel: 5, problemCount: 5, unlockCondition: unlockPrev('fs-4')},
      {id: 'fs-6', worldId: 'farm-share', order: 6, nameKey: 'adventure.levels.fs6', emoji: '🐰', isBonus: false, gameMode: 'share', modeLevel: 6, problemCount: 5, unlockCondition: unlockPrev('fs-5')},
      {id: 'fs-bonus-a', worldId: 'farm-share', order: 7, nameKey: 'adventure.levels.fsBonusA', emoji: '⭐', isBonus: true, gameMode: 'share', modeLevel: 7, problemCount: 5, unlockCondition: unlockStars('farm-share', 12)},
      {id: 'fs-bonus-b', worldId: 'farm-share', order: 8, nameKey: 'adventure.levels.fsBonusB', emoji: '🏆', isBonus: true, gameMode: 'share', modeLevel: 7, problemCount: 5, unlockCondition: unlockStars('farm-share', 18)},
    ],
  },

];

export function getDefaultAdventureProgress(): AdventureProgress {
  const progress: AdventureProgress = {
    version: 1,
    currentWorld: 'counting-meadow',
    worlds: {
      'counting-meadow': {unlocked: true, levels: {}},
      'addition-island': {unlocked: true, levels: {}},
      'subtraction-mountain': {unlocked: true, levels: {}},
      'make-ten-beach': {unlocked: true, levels: {}},
      'mixed-targets': {unlocked: true, levels: {}},
      'doubles-castle': {unlocked: true, levels: {}},
      'memory-garden': {unlocked: true, levels: {}},
      'farm-share': {unlocked: true, levels: {}},
    },
  };

  for (const world of ADVENTURE_WORLDS) {
    for (const level of world.levels) {
      const isFirst = level.unlockCondition.type === 'first';
      progress.worlds[world.id].levels[level.id] = {
        unlocked: isFirst,
        completed: false,
        stars: 0,
        bestFirstTry: 0,
        attempts: 0,
      };
    }
  }

  return progress;
}

export function getWorldStars(
  worldId: string,
  progress: AdventureProgress,
): number {
  const world = progress.worlds[worldId as keyof typeof progress.worlds];
  if (!world) return 0;
  return Object.values(world.levels).reduce((sum, l) => sum + l.stars, 0);
}

export function getWorldMaxStars(worldId: string): number {
  const world = ADVENTURE_WORLDS.find(w => w.id === worldId);
  if (!world) return 0;
  return world.levels.length * 3;
}
