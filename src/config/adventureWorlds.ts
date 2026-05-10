import {AdventureWorld, AdventureProgress} from '../types/game';

// v1.6 Adventure: 6 lumi × 5 niveluri = 30 niveluri totale.
// Pentru 4-6 ani, multe lumi tematice = varietate, sesiuni scurte
// (5 step-uri/nivel = ~2-3 min). Prima provocare din fiecare lume e
// gratis; restul sunt premium (pentru daily limit / IAP).
export const ADVENTURE_WORLDS: AdventureWorld[] = [
  // === World 1: Counting Meadow (FREE) ===
  // Subitizing & one-to-one correspondence (1-10).
  {
    id: 'counting-meadow',
    nameKey: 'adventure.worlds.countingMeadow',
    emoji: '🌿',
    theme: 'forest',
    freeLevels: 5,
    levels: [
      {
        id: 'cm-1',
        worldId: 'counting-meadow',
        order: 1,
        nameKey: 'adventure.levels.cm1',
        emoji: '🍄',
        isBonus: false,
        gameMode: 'counting',
        modeLevel: 1, // fill_exactly N=1-3
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'cm-2',
        worldId: 'counting-meadow',
        order: 2,
        nameKey: 'adventure.levels.cm2',
        emoji: '🦋',
        isBonus: false,
        gameMode: 'counting',
        modeLevel: 3,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'cm-1'},
      },
      {
        id: 'cm-3',
        worldId: 'counting-meadow',
        order: 3,
        nameKey: 'adventure.levels.cm3',
        emoji: '🌸',
        isBonus: false,
        gameMode: 'counting',
        modeLevel: 5,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'cm-2'},
      },
      {
        id: 'cm-4',
        worldId: 'counting-meadow',
        order: 4,
        nameKey: 'adventure.levels.cm4',
        emoji: '🐛',
        isBonus: false,
        gameMode: 'counting',
        modeLevel: 7,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'cm-3'},
      },
      {
        id: 'cm-bonus-b',
        worldId: 'counting-meadow',
        order: 5,
        nameKey: 'adventure.levels.cmBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'counting',
        modeLevel: 8,
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'counting-meadow', count: 10},
      },
    ],
  },

  // === World 2: Addition Island ===
  // „Mai mult" — adunare progresivă cu sume ≤ 10.
  {
    id: 'addition-island',
    nameKey: 'adventure.worlds.additionIsland',
    emoji: '🐳',
    theme: 'ocean',
    freeLevels: 5,
    levels: [
      {
        id: 'ai-1',
        worldId: 'addition-island',
        order: 1,
        nameKey: 'adventure.levels.ai1',
        emoji: '🐚',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 1,
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'ai-2',
        worldId: 'addition-island',
        order: 2,
        nameKey: 'adventure.levels.ai2',
        emoji: '🐟',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 2,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'ai-1'},
      },
      {
        id: 'ai-3',
        worldId: 'addition-island',
        order: 3,
        nameKey: 'adventure.levels.ai3',
        emoji: '🦀',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 3,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'ai-2'},
      },
      {
        id: 'ai-5',
        worldId: 'addition-island',
        order: 4,
        nameKey: 'adventure.levels.ai5',
        emoji: '🐙',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 5,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'ai-3'},
      },
      {
        id: 'ai-bonus-b',
        worldId: 'addition-island',
        order: 5,
        nameKey: 'adventure.levels.aiBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'addition',
        modeLevel: 10,
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'addition-island', count: 10},
      },
    ],
  },

  // === World 3: Subtraction Mountain ===
  // „Mai puțin" — scădere progresivă din numere ≤ 10.
  {
    id: 'subtraction-mountain',
    nameKey: 'adventure.worlds.subtractionMountain',
    emoji: '🚀',
    theme: 'space',
    freeLevels: 5,
    levels: [
      {
        id: 'sm-1',
        worldId: 'subtraction-mountain',
        order: 1,
        nameKey: 'adventure.levels.sm1',
        emoji: '🌙',
        isBonus: false,
        gameMode: 'subtraction',
        modeLevel: 1,
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'sm-2',
        worldId: 'subtraction-mountain',
        order: 2,
        nameKey: 'adventure.levels.sm2',
        emoji: '🚀',
        isBonus: false,
        gameMode: 'subtraction',
        modeLevel: 2,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'sm-1'},
      },
      {
        id: 'sm-3',
        worldId: 'subtraction-mountain',
        order: 3,
        nameKey: 'adventure.levels.sm3',
        emoji: '🪐',
        isBonus: false,
        gameMode: 'subtraction',
        modeLevel: 3,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'sm-2'},
      },
      {
        id: 'sm-5',
        worldId: 'subtraction-mountain',
        order: 4,
        nameKey: 'adventure.levels.sm5',
        emoji: '🛸',
        isBonus: false,
        gameMode: 'subtraction',
        modeLevel: 5,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'sm-3'},
      },
      {
        id: 'sm-bonus-b',
        worldId: 'subtraction-mountain',
        order: 5,
        nameKey: 'adventure.levels.smBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'subtraction',
        modeLevel: 10,
        problemCount: 5,
        unlockCondition: {
          type: 'stars',
          worldId: 'subtraction-mountain',
          count: 10,
        },
      },
    ],
  },

  // === World 4: Make 10 Beach ===
  // Complement de 10 (pre-fill N, child completează la 10).
  // Folosește gameMode 'puzzle' care deja face asta.
  {
    id: 'make-ten-beach',
    nameKey: 'adventure.worlds.makeTenBeach',
    emoji: '🏖️',
    theme: 'candy',
    freeLevels: 5,
    levels: [
      {
        id: 'mtb-1',
        worldId: 'make-ten-beach',
        order: 1,
        nameKey: 'adventure.levels.mtb1',
        emoji: '🍬',
        isBonus: false,
        gameMode: 'puzzle',
        modeLevel: 1,
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'mtb-2',
        worldId: 'make-ten-beach',
        order: 2,
        nameKey: 'adventure.levels.mtb2',
        emoji: '🍭',
        isBonus: false,
        gameMode: 'puzzle',
        modeLevel: 2,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mtb-1'},
      },
      {
        id: 'mtb-3',
        worldId: 'make-ten-beach',
        order: 3,
        nameKey: 'adventure.levels.mtb3',
        emoji: '🧁',
        isBonus: false,
        gameMode: 'puzzle',
        modeLevel: 3,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mtb-2'},
      },
      {
        id: 'mtb-4',
        worldId: 'make-ten-beach',
        order: 4,
        nameKey: 'adventure.levels.mtb4',
        emoji: '🍰',
        isBonus: false,
        gameMode: 'puzzle',
        modeLevel: 4,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mtb-3'},
      },
      {
        id: 'mtb-bonus-b',
        worldId: 'make-ten-beach',
        order: 5,
        nameKey: 'adventure.levels.mtbBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'puzzle',
        modeLevel: 5,
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'make-ten-beach', count: 10},
      },
    ],
  },

  // === World 5: Doubles Castle ===
  // Dubluri (1+1 până la 5+5) — modeLevel 20 = doubles.
  {
    id: 'doubles-castle',
    nameKey: 'adventure.worlds.doublesCastle',
    emoji: '🏰',
    theme: 'unicorn',
    freeLevels: 5,
    levels: [
      {
        id: 'dc-1',
        worldId: 'doubles-castle',
        order: 1,
        nameKey: 'adventure.levels.dc1',
        emoji: '✨',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 20, // doubles pool
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'dc-2',
        worldId: 'doubles-castle',
        order: 2,
        nameKey: 'adventure.levels.dc2',
        emoji: '🌈',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 20,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'dc-1'},
      },
      {
        id: 'dc-3',
        worldId: 'doubles-castle',
        order: 3,
        nameKey: 'adventure.levels.dc3',
        emoji: '🦄',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 20,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'dc-2'},
      },
      {
        id: 'dc-4',
        worldId: 'doubles-castle',
        order: 4,
        nameKey: 'adventure.levels.dc4',
        emoji: '👑',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 20,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'dc-3'},
      },
      {
        id: 'dc-bonus-b',
        worldId: 'doubles-castle',
        order: 5,
        nameKey: 'adventure.levels.dcBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'addition',
        modeLevel: 20,
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'doubles-castle', count: 10},
      },
    ],
  },

  // === World 6: Memory Garden ===
  // Memorie vizuală — show → hide → reproduce. Folosește gameMode 'memory'.
  {
    id: 'memory-garden',
    nameKey: 'adventure.worlds.memoryGarden',
    emoji: '🍄',
    theme: 'unicorn',
    freeLevels: 5,
    levels: [
      {
        id: 'mg-1',
        worldId: 'memory-garden',
        order: 1,
        nameKey: 'adventure.levels.mg1',
        emoji: '🌷',
        isBonus: false,
        gameMode: 'memory',
        modeLevel: 1, // 1-2 cells, 3s
        problemCount: 5,
        unlockCondition: {type: 'first'},
      },
      {
        id: 'mg-2',
        worldId: 'memory-garden',
        order: 2,
        nameKey: 'adventure.levels.mg2',
        emoji: '🌹',
        isBonus: false,
        gameMode: 'memory',
        modeLevel: 2,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mg-1'},
      },
      {
        id: 'mg-3',
        worldId: 'memory-garden',
        order: 3,
        nameKey: 'adventure.levels.mg3',
        emoji: '🌻',
        isBonus: false,
        gameMode: 'memory',
        modeLevel: 3,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mg-2'},
      },
      {
        id: 'mg-4',
        worldId: 'memory-garden',
        order: 4,
        nameKey: 'adventure.levels.mg4',
        emoji: '🌺',
        isBonus: false,
        gameMode: 'memory',
        modeLevel: 4,
        problemCount: 5,
        unlockCondition: {type: 'previous', levelId: 'mg-3'},
      },
      {
        id: 'mg-bonus-b',
        worldId: 'memory-garden',
        order: 5,
        nameKey: 'adventure.levels.mgBonusB',
        emoji: '🏆',
        isBonus: true,
        gameMode: 'memory',
        modeLevel: 5,
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'memory-garden', count: 10},
      },
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
      'doubles-castle': {unlocked: true, levels: {}},
      'memory-garden': {unlocked: true, levels: {}},
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
