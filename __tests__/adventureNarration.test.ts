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
    const ids = answerInstructionIds({slot: 'addend', num1: 3, num2: 5, answer: 8, noun: 'star'});
    expect(ids[ids.length - 1]).toBe('pzl_part_ask_2');
    expect(padNudgeId('addend')).toBe('ask_added_tap');
    speakable(ids.concat([padNudgeId('addend')]));
  });

  it('asks for the total on sum problems', () => {
    const ids = answerInstructionIds({slot: 'sum', num1: 3, num2: 2, answer: 5, noun: 'star'});
    expect(ids).toEqual(['have_star_3', 'add_more_star_2']);
    speakable(ids);
    expect(padNudgeId('sum')).toBe('instr_tap_number');
  });

  it('covers every answer level the game ships', () => {
    const answerLevels = ADVENTURE_WORLDS.flatMap(w => w.levels).filter(l => l.gameMode === 'answer');
    expect(answerLevels.length).toBeGreaterThan(0);
    for (const answer of [3, 4, 5, 6, 7, 8, 9, 10]) {
      speakable(answerInstructionIds({slot: 'addend', num1: 1, num2: answer - 1, answer}));
    }
  });
});

describe('locked-frame levels', () => {
  it('asks about what the frame holds, never to add counters the child cannot place', () => {
    const add = answerInstructionIds({slot: 'sum', num1: 5, num2: 3, answer: 8, noun: 'star', op: 'add', locked: true});
    const sub = answerInstructionIds({slot: 'sum', num1: 7, num2: 3, answer: 4, noun: 'rocket', op: 'sub', locked: true});
    expect(add).toEqual(['add_alt_1']);
    expect(sub).toEqual(['sub_alt_1']);
    speakable(add.concat(sub).concat([padNudgeId('sum')]));
    // Nothing that tells the child to place or remove a counter.
    for (const id of add.concat(sub)) {
      expect(id).not.toMatch(/^add_more_|^take_|^have_/);
    }
  });

  it('keeps one line, because the pad nudge follows it', () => {
    expect(answerInstructionIds({slot: 'sum', num1: 6, num2: 2, answer: 8, noun: 'star', locked: true})).toHaveLength(1);
  });
});
