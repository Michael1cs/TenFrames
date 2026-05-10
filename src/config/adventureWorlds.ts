import {AdventureWorld, AdventureProgress} from '../types/game';

// v1.6 Adventure: 3 lumi × 5 niveluri = 15 niveluri totale.
// Pentru 4-6 ani, mai puține niveluri = mai puțină repetiție, sesiuni
// mai scurte care mențin atenția. Provocările noi (Make 5/10, Memory
// World) vin în iterația următoare.
export const ADVENTURE_WORLDS: AdventureWorld[] = [
  // === World 1: Counting Meadow (FREE) ===
  // Subitizing & one-to-one correspondence (1-10).
  {
    id: 'counting-meadow',
    nameKey: 'adventure.worlds.countingMeadow',
    emoji: '🌿',
    theme: 'forest',
    freeLevels: 2,
    levels: [
      {
        id: 'cm-1',
        worldId: 'counting-meadow',
        order: 1,
        nameKey: 'adventure.levels.cm1',
        emoji: '🍄',
        isBonus: false,
        gameMode: 'counting',
        modeLevel: 1, // fill_exactly cu N=1-3
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
        modeLevel: 3, // fill_exactly cu N=3-5
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
        modeLevel: 5, // mix top_row + numere medii
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
        modeLevel: 7, // mix bottom_row + numere mai mari
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
        modeLevel: 8, // champion: mix complet inclusiv 8/9/10
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'counting-meadow', count: 10},
      },
    ],
  },

  // === World 2: Addition Island (PREMIUM after lvl 2) ===
  // „Mai mult" — adunare progresivă cu sume ≤ 10.
  {
    id: 'addition-island',
    nameKey: 'adventure.worlds.additionIsland',
    emoji: '🐳',
    theme: 'ocean',
    freeLevels: 2,
    levels: [
      {
        id: 'ai-1',
        worldId: 'addition-island',
        order: 1,
        nameKey: 'adventure.levels.ai1',
        emoji: '🐚',
        isBonus: false,
        gameMode: 'addition',
        modeLevel: 1, // adună 1 (fundament: +1)
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
        modeLevel: 2, // adună 2
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
        modeLevel: 3, // adună 3
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
        modeLevel: 5, // adună 5 — anchor pentru memorare
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
        modeLevel: 10, // champion: adunare mixtă (random sume ≤ 10)
        problemCount: 5,
        unlockCondition: {type: 'stars', worldId: 'addition-island', count: 10},
      },
    ],
  },

  // === World 3: Subtraction Mountain (PREMIUM after lvl 2) ===
  // „Mai puțin" — scădere progresivă din numere ≤ 10.
  {
    id: 'subtraction-mountain',
    nameKey: 'adventure.worlds.subtractionMountain',
    emoji: '🚀',
    theme: 'space',
    freeLevels: 2,
    levels: [
      {
        id: 'sm-1',
        worldId: 'subtraction-mountain',
        order: 1,
        nameKey: 'adventure.levels.sm1',
        emoji: '🌙',
        isBonus: false,
        gameMode: 'subtraction',
        modeLevel: 1, // scade 1 (fundament: -1)
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
        modeLevel: 2, // scade 2
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
        modeLevel: 3, // scade 3
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
        modeLevel: 5, // scade 5
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
        modeLevel: 10, // champion: scădere mixtă
        problemCount: 5,
        unlockCondition: {
          type: 'stars',
          worldId: 'subtraction-mountain',
          count: 10,
        },
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
