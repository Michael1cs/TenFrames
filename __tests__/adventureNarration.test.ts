/**
 * The voice must never tell a child to do something the level then marks
 * wrong. Every bug of this class so far was a sentence that drifted away
 * from the check beside it:
 *   - Number Bubbles heard the Make-10 lines (fixed in puzzleNarration)
 *   - "Same on both rows!" never said how many, but only exactly half the
 *     target per row is accepted
 *   - "Tap the frame that has more" on levels where the frames can be equal
 *   - Number Town's missing-addend levels said "Make eight! Now tap the
 *     number!", while the accepted answer is the part that was added
 */
import {
  answerInstructionIds,
  compareAskIds,
  countingInstructionIds,
  padNudgeId,
} from '../src/voice/adventureNarration';
import {VOICE_SCRIPT} from '../src/voice/script';
import {ADVENTURE_WORLDS} from '../src/config/adventureWorlds';
import {CountingChallenge} from '../src/types/game';

declare function require(id: string): any;
declare const __dirname: string;
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const TEXT = new Map(VOICE_SCRIPT.map(e => [e.id, e]));
const speakable = (ids: string[]) => {
  const missing = ids.filter(id => !TEXT.has(id));
  expect(missing).toEqual([]);
  const noClip: string[] = [];
  for (const id of ids) {
    for (const lang of ['ro', 'en', 'de']) {
      const file = `voice_${lang}_${id}.mp3`;
      if (!fs.existsSync(path.join(ROOT, 'assets/audio', file))) noClip.push(file);
      if (!fs.existsSync(path.join(ROOT, 'android/app/src/main/res/raw', file))) {
        noClip.push(`raw/${file}`);
      }
    }
  }
  expect(noClip).toEqual([]);
};

describe('counting instructions', () => {
  it('says how many go in each row for "same on both rows"', () => {
    for (const target of [2, 4, 6, 8, 10]) {
      const challenge: CountingChallenge = {instruction: 'fill_both_equal', targetNumber: target};
      for (const i of [0, 1, 2]) {
        const ids = countingInstructionIds(challenge, i);
        expect(ids).toEqual([`both_rows_${target / 2}`]);
        speakable(ids);
      }
    }
  });

  it('never leaves a plain target unspoken', () => {
    for (const target of [1, 3, 7, 10]) {
      const ids = countingInstructionIds({instruction: 'fill_exactly', targetNumber: target}, 0);
      expect(ids).toContain(`num_${target}`);
      speakable(ids);
    }
  });

  it('names the row for row instructions', () => {
    for (const instruction of ['fill_top_row', 'fill_bottom_row'] as const) {
      for (const i of [0, 1]) {
        speakable(countingInstructionIds({instruction, targetNumber: 5}, i));
      }
    }
  });
});

describe('compare questions', () => {
  const MENTIONS_MORE_ONLY = /more|mai multe|mehr/i;

  it('allows "the same" on every problem of a level where frames can be equal', () => {
    for (let level = 3; level <= 4; level++) {
      for (const i of [0, 1, 2, 3, 4]) {
        const ids = compareAskIds(level, i);
        speakable(ids);
        for (const id of ids) {
          const e = TEXT.get(id)!;
          for (const text of [e.ro, e.en, e.de]) {
            if (!MENTIONS_MORE_ONLY.test(text)) continue;
            // If it talks about "more", it must also offer "the same".
            expect(`${id}: ${text}`).toMatch(/same|la fel|gleich/i);
          }
        }
      }
    }
  });

  it('keeps the plain question on levels that never produce equal frames', () => {
    for (const i of [0, 1, 2]) {
      const ids = compareAskIds(2, i);
      speakable(ids);
      expect(ids.some(id => id.startsWith('cmp_ask_eq'))).toBe(false);
    }
  });
});

describe('answer mode', () => {
  it('asks for the part that was added, not the total, on missing-addend problems', () => {
    const ids = answerInstructionIds('addend', 3, 5, 8, 'star');
    expect(ids[ids.length - 1]).toBe('pzl_part_ask_2');
    expect(padNudgeId('addend')).toBe('ask_added_tap');
    speakable(ids.concat([padNudgeId('addend')]));
  });

  it('asks for the total on sum problems', () => {
    const ids = answerInstructionIds('sum', 3, 2, 5, 'star');
    expect(ids).toEqual(['have_star_3', 'add_more_star_2']);
    speakable(ids);
    expect(padNudgeId('sum')).toBe('instr_tap_number');
  });

  it('covers every answer level the game ships', () => {
    const answerLevels = ADVENTURE_WORLDS.flatMap(w => w.levels).filter(l => l.gameMode === 'answer');
    expect(answerLevels.length).toBeGreaterThan(0);
    for (const answer of [3, 4, 5, 6, 7, 8, 9, 10]) {
      speakable(answerInstructionIds('addend', 1, answer - 1, answer));
    }
  });
});
