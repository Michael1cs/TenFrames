export type GameMode = 'counting' | 'addition' | 'subtraction' | 'puzzle';
// 'filled' = user placed (counting mode or single-color)
// 'color1' = first addend / pre-filled for subtraction/puzzle
// 'color2' = second addend / user-added in addition/puzzle
export type CellState = 'empty' | 'filled' | 'color1' | 'color2';
export type Theme = 'space' | 'forest' | 'ocean' | 'farm' | 'candy' | 'unicorn' | 'pixel' | 'slime' | 'kpop' | 'monsters';
export type MascotMood = 'happy' | 'excited' | 'thinking' | 'celebrating';
export type Language = 'ro' | 'en';
export type AudioMode = 'full' | 'sfx' | 'mute';

export interface Problem {
  num1: number;
  num2: number;
  answer: number;
}

export interface GameState {
  gameMode: GameMode;
  cells: CellState[];
  score: number;
  streak: number;
  level: number;
  currentProblem: Problem | null;
  userAnswer: number | null;
  isCorrect: boolean | null;
  hasSubmitted: boolean;
  mascotMood: MascotMood;
  showConfetti: boolean;
}

export interface PlayerData {
  name: string;
  theme: Theme;
  language: Language;
  highScore: number;
  level: number;
  lastMode?: 'adventure' | 'freeplay';
  audioMode?: AudioMode;
}

// === Reward System Types ===

export interface RewardData {
  totalStars: number;
  starsAvailable: number; // stars not yet spent
  stickers: string[]; // unlocked sticker IDs
  achievements: string[]; // unlocked achievement IDs
  streak: StreakData;
  levelStars: LevelStars; // stars per mode per level
  stats: GameStats;
  milestonesSeen: string[]; // milestone IDs already celebrated
}

export interface StreakData {
  current: number;
  lastPlayedDate: string; // 'YYYY-MM-DD'
  longest: number;
}

export interface LevelStars {
  [mode: string]: {[levelId: string]: number}; // mode -> levelId -> stars (1-3)
}

export interface GameStats {
  totalProblems: number;
  correctFirstTry: number;
  byMode: {
    [mode: string]: {attempted: number; correct: number};
  };
}

export interface Sticker {
  id: string;
  emoji: string;
  nameKey: string;
  category: 'numbers' | 'animals' | 'space' | 'nature' | 'food' | 'sports';
  requirement: number; // total stars needed to unlock
}

export interface Achievement {
  id: string;
  emoji: string;
  nameKey: string;
  descKey: string;
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'stars' | 'streak' | 'stickers' | 'mode_complete' | 'problems' | 'perfect';
  value: number;
  mode?: GameMode;
}

export interface ThemeColors {
  backgroundFrom: string;
  backgroundTo: string;
  backgroundVia: string;
  text: string;
  accent: string;
  cellEmpty: string;
  cellEmptyBorder: string;
  cellFilled: string;
  cellFilledBorder: string;
  marble: string;
  // Two-color mode (addition, puzzle)
  cellColor1: string;
  cellColor1Border: string;
  marbleColor1: string;
  emojiColor1: string;
  cellColor2: string;
  cellColor2Border: string;
  marbleColor2: string;
  emojiColor2: string;
  primaryButton: string;
  primaryButtonEnd: string;
  accentButton: string;
  accentButtonEnd: string;
  numberBg: string;
  numberBorder: string;
  numberText: string;
}

export interface ThemeConfig {
  id: Theme;
  nameKey: string;
  emoji: string;
  selectorEmoji: string;
  colors: ThemeColors;
  backgroundEmojis: BackgroundEmoji[];
  backgroundPortrait: any; // ImageSourcePropType (require PNG)
  backgroundLandscape: any; // ImageSourcePropType (require PNG)
  tokenImage?: any; // ImageSourcePropType — filled cell token (require PNG)
}

export interface BackgroundEmoji {
  emoji: string;
  left: number;
  top: number;
  size: number;
  delay: number;
}

// === Adventure Map Types ===

export type WorldId =
  | 'counting-meadow'
  | 'addition-island'
  | 'subtraction-mountain';

export interface AdventureProgress {
  version: number;
  currentWorld: WorldId;
  worlds: Record<WorldId, WorldProgress>;
}

export interface WorldProgress {
  unlocked: boolean;
  levels: Record<string, AdventureLevelProgress>;
}

export interface AdventureLevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0-3
  bestFirstTry: number; // best count of first-try correct out of problemCount
  attempts: number;
}

export type UnlockCondition =
  | {type: 'first'}
  | {type: 'previous'; levelId: string}
  | {type: 'stars'; worldId: WorldId; count: number};

export interface AdventureLevel {
  id: string;
  worldId: WorldId;
  order: number;
  nameKey: string;
  emoji: string;
  isBonus: boolean;
  gameMode: GameMode;
  modeLevel: number;
  problemCount: number;
  unlockCondition: UnlockCondition;
}

export interface AdventureWorld {
  id: WorldId;
  nameKey: string;
  emoji: string;
  theme: Theme;
  freeLevels: number; // first N levels are free, rest need premium
  levels: AdventureLevel[];
}

export interface CountingChallenge {
  targetNumber: number;
  instruction: 'fill_exactly' | 'fill_top_row' | 'fill_bottom_row' | 'fill_both_equal';
}

// === Premium / Trial System ===

export interface DailyUsage {
  date: string; // 'YYYY-MM-DD'
  counts: {[mode: string]: number}; // mode -> exercises completed today
}

export interface PremiumData {
  isPremium: boolean;
  purchaseDate?: string; // ISO date
  dailyUsage: DailyUsage;
}
