import {Sticker, Achievement} from '../types/game';

// 36 stickers unlocked progressively by total stars earned.
//
// The thresholds run to 630 stars. They used to top out at 100: a perfect
// Adventure level is 15 stars (5 problems x 3), so 15 of the 36 stickers
// came from the first level and the album was full after ~7 of 98 levels —
// then nothing, for the rest of the journey. The curve is quick at the
// start (a sticker on the first answer, five in the first level) and long
// at the end, so there is always a next one coming.
export const ALL_STICKERS: Sticker[] = [
  // Numbers (unlocked early)
  {id: 'num-1', emoji: '1️⃣', nameKey: 'stickers.num1', category: 'numbers', requirement: 1},
  {id: 'num-2', emoji: '2️⃣', nameKey: 'stickers.num2', category: 'numbers', requirement: 2},
  {id: 'num-3', emoji: '3️⃣', nameKey: 'stickers.num3', category: 'numbers', requirement: 3},
  {id: 'num-4', emoji: '4️⃣', nameKey: 'stickers.num4', category: 'numbers', requirement: 7},
  {id: 'num-5', emoji: '5️⃣', nameKey: 'stickers.num5', category: 'numbers', requirement: 13},
  {id: 'num-10', emoji: '🔟', nameKey: 'stickers.num10', category: 'numbers', requirement: 25},
  // Animals
  {id: 'cat', emoji: '🐱', nameKey: 'stickers.cat', category: 'animals', requirement: 5},
  {id: 'dog', emoji: '🐶', nameKey: 'stickers.dog', category: 'animals', requirement: 10},
  {id: 'rabbit', emoji: '🐰', nameKey: 'stickers.rabbit', category: 'animals', requirement: 20},
  {id: 'bear', emoji: '🐻', nameKey: 'stickers.bear', category: 'animals', requirement: 36},
  {id: 'panda', emoji: '🐼', nameKey: 'stickers.panda', category: 'animals', requirement: 85},
  {id: 'unicorn', emoji: '🦄', nameKey: 'stickers.unicorn', category: 'animals', requirement: 150},
  // Space
  {id: 'rocket', emoji: '🚀', nameKey: 'stickers.rocket', category: 'space', requirement: 16},
  {id: 'star', emoji: '⭐', nameKey: 'stickers.star', category: 'space', requirement: 30},
  {id: 'moon', emoji: '🌙', nameKey: 'stickers.moon', category: 'space', requirement: 58},
  {id: 'planet', emoji: '🪐', nameKey: 'stickers.planet', category: 'space', requirement: 105},
  {id: 'ufo', emoji: '🛸', nameKey: 'stickers.ufo', category: 'space', requirement: 210},
  {id: 'alien', emoji: '👽', nameKey: 'stickers.alien', category: 'space', requirement: 360},
  // Nature
  {id: 'flower', emoji: '🌸', nameKey: 'stickers.flower', category: 'nature', requirement: 42},
  {id: 'tree', emoji: '🌳', nameKey: 'stickers.tree', category: 'nature', requirement: 66},
  {id: 'rainbow', emoji: '🌈', nameKey: 'stickers.rainbow', category: 'nature', requirement: 120},
  {id: 'sun', emoji: '☀️', nameKey: 'stickers.sun', category: 'nature', requirement: 190},
  {id: 'butterfly', emoji: '🦋', nameKey: 'stickers.butterfly', category: 'nature', requirement: 290},
  {id: 'mushroom', emoji: '🍄', nameKey: 'stickers.mushroom', category: 'nature', requirement: 450},
  // Food
  {id: 'apple', emoji: '🍎', nameKey: 'stickers.apple', category: 'food', requirement: 50},
  {id: 'cake', emoji: '🎂', nameKey: 'stickers.cake', category: 'food', requirement: 95},
  {id: 'icecream', emoji: '🍦', nameKey: 'stickers.icecream', category: 'food', requirement: 135},
  {id: 'pizza', emoji: '🍕', nameKey: 'stickers.pizza', category: 'food', requirement: 235},
  {id: 'candy', emoji: '🍬', nameKey: 'stickers.candy', category: 'food', requirement: 320},
  {id: 'donut', emoji: '🍩', nameKey: 'stickers.donut', category: 'food', requirement: 500},
  // Sports/Fun
  {id: 'soccer', emoji: '⚽', nameKey: 'stickers.soccer', category: 'sports', requirement: 75},
  {id: 'trophy', emoji: '🏆', nameKey: 'stickers.trophy', category: 'sports', requirement: 170},
  {id: 'medal', emoji: '🥇', nameKey: 'stickers.medal', category: 'sports', requirement: 260},
  {id: 'crown', emoji: '👑', nameKey: 'stickers.crown', category: 'sports', requirement: 400},
  {id: 'diamond', emoji: '💎', nameKey: 'stickers.diamond', category: 'sports', requirement: 560},
  {id: 'hundred', emoji: '💯', nameKey: 'stickers.hundred', category: 'sports', requirement: 630},
];

// Achievements / Badges
export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Stars milestones
  {
    id: 'first-star',
    emoji: '⭐',
    nameKey: 'achievements.firstStar',
    descKey: 'achievements.firstStarDesc',
    requirement: {type: 'stars', value: 1},
  },
  {
    id: 'star-10',
    emoji: '🌟',
    nameKey: 'achievements.star10',
    descKey: 'achievements.star10Desc',
    requirement: {type: 'stars', value: 10},
  },
  {
    id: 'star-25',
    emoji: '✨',
    nameKey: 'achievements.star25',
    descKey: 'achievements.star25Desc',
    requirement: {type: 'stars', value: 25},
  },
  {
    id: 'star-50',
    emoji: '🏅',
    nameKey: 'achievements.star50',
    descKey: 'achievements.star50Desc',
    requirement: {type: 'stars', value: 50},
  },
  {
    id: 'star-100',
    emoji: '💫',
    nameKey: 'achievements.star100',
    descKey: 'achievements.star100Desc',
    requirement: {type: 'stars', value: 100},
  },
  // Streak achievements
  {
    id: 'streak-3',
    emoji: '🔥',
    nameKey: 'achievements.streak3',
    descKey: 'achievements.streak3Desc',
    requirement: {type: 'streak', value: 3},
  },
  {
    id: 'streak-7',
    emoji: '🔥',
    nameKey: 'achievements.streak7',
    descKey: 'achievements.streak7Desc',
    requirement: {type: 'streak', value: 7},
  },
  // Mode completion (10 correct in a mode)
  {
    id: 'counting-champ',
    emoji: '🔢',
    nameKey: 'achievements.countingChamp',
    descKey: 'achievements.countingChampDesc',
    requirement: {type: 'mode_complete', value: 10, mode: 'counting'},
  },
  {
    id: 'addition-star',
    emoji: '➕',
    nameKey: 'achievements.additionStar',
    descKey: 'achievements.additionStarDesc',
    requirement: {type: 'mode_complete', value: 10, mode: 'addition'},
  },
  {
    id: 'subtraction-hero',
    emoji: '➖',
    nameKey: 'achievements.subtractionHero',
    descKey: 'achievements.subtractionHeroDesc',
    requirement: {type: 'mode_complete', value: 10, mode: 'subtraction'},
  },
  {
    id: 'puzzle-master',
    emoji: '🧩',
    nameKey: 'achievements.puzzleMaster',
    descKey: 'achievements.puzzleMasterDesc',
    requirement: {type: 'mode_complete', value: 10, mode: 'puzzle'},
  },
  // Perfect streak (5 correct in a row without mistakes)
  {
    id: 'perfect-5',
    emoji: '💎',
    nameKey: 'achievements.perfect5',
    descKey: 'achievements.perfect5Desc',
    requirement: {type: 'perfect', value: 5},
  },
  // Sticker collector
  {
    id: 'collector-10',
    emoji: '📚',
    nameKey: 'achievements.collector10',
    descKey: 'achievements.collector10Desc',
    requirement: {type: 'stickers', value: 10},
  },
  {
    id: 'collector-all',
    emoji: '🎪',
    nameKey: 'achievements.collectorAll',
    descKey: 'achievements.collectorAllDesc',
    requirement: {type: 'stickers', value: 36},
  },
];

// Feedback messages rotated randomly
export const CORRECT_FEEDBACK_KEYS = [
  'feedback.correct',
  'feedback.great',
  'feedback.bravo',
  'feedback.super',
  'feedback.champion',
  'feedback.genius',
];

export const WRONG_FEEDBACK_KEYS = [
  'feedback.wrong',
  'feedback.tryAgain',
  'feedback.almostThere',
  'feedback.keepTrying',
];

// What a sticker says when a child taps it in the album. Number stickers
// say their number with the clips the counting game already uses; every
// other sticker has its own name line (stk_<id>).
export function stickerVoiceId(sticker: Sticker): string {
  const n = /^num-(\d+)$/.exec(sticker.id);
  return n ? `num_${n[1]}` : `stk_${sticker.id}`;
}
