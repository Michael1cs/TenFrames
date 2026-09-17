/**
 * Number Bubbles (make 3..9) was narrated with the Make 10! lines — "fill the
 * empty cells", "until the frame is full", "the frame is full!" — so a child
 * who followed the voice filled every cell and got it wrong. Only a target
 * of ten may mention a full frame or ten.
 */
import {
  puzzleInstructionIds,
  puzzlePraisePool,
  puzzleRetryIds,
  puzzleTargetId,
} from '../src/voice/puzzleNarration';
import {VOICE_SCRIPT} from '../src/voice/script';
import {ADVENTURE_WORLDS} from '../src/config/adventureWorlds';

declare function require(id: string): any;
declare const __dirname: string;
const fs = require('fs');
const path = require('path');

const SCRIPT = new Map(VOICE_SCRIPT.map(e => [e.id, e]));
const MENTIONS_TEN_OR_FULL = /\bten\b|\bfull\b|\bempty\b|zece|plin|goale|zehn|voll|leere/i;
const GENERAL = ['correct_1'];

function everyLineFor(target: number): string[] {
  const ids = new Set<string>();
  for (let i = 0; i < 6; i++) puzzleInstructionIds(target, i).forEach(id => ids.add(id));
  puzzleRetryIds(target).forEach(id => ids.add(id));
  puzzlePraisePool(target, GENERAL, 0).forEach(id => ids.add(id));
  return [...ids].filter(id => id !== 'correct_1');
}

describe('make-N puzzle narration', () => {
  const partialTargets = [3, 4, 5, 6, 7, 8, 9];

  it('never tells a child to fill the frame when the target is below ten', () => {
    for (const target of partialTargets) {
      for (const id of everyLineFor(target)) {
        const entry = SCRIPT.get(id)!;
        expect(entry).toBeDefined();
        for (const text of [entry.ro, entry.en, entry.de]) {
          // "Make seven!" names the target, which is the point; nothing
          // else may talk about ten, a full frame or empty cells.
          if (id === puzzleTargetId(target)) continue;
          expect(`${id}: ${text}`).not.toMatch(MENTIONS_TEN_OR_FULL);
        }
      }
    }
  });

  it('keeps the full-frame lines for Make 10', () => {
    expect(puzzleInstructionIds(10, 2)).toEqual(['instr_make_ten', 'pzl_ask_3']);
    expect(puzzleRetryIds(10)).toEqual(['instr_puzzle', 'instr_make_ten']);
    expect(puzzlePraisePool(10, GENERAL, 0)).toEqual(['ok_full_1']);
  });

  it('names the target first', () => {
    expect(puzzleInstructionIds(7, 0)[0]).toBe('make_7');
    expect(puzzleRetryIds(7)[0]).toBe('make_7');
  });

  it('uses the general praise the other half of the time', () => {
    expect(puzzlePraisePool(7, GENERAL, 0.5)).toBe(GENERAL);
  });

  it('has every line it can say, for every target a level uses, in three languages', () => {
    const targets = new Set<number>([10]);
    for (const w of ADVENTURE_WORLDS) {
      for (const l of w.levels) {
        if (l.gameMode !== 'puzzle') continue;
        if (typeof l.puzzleTarget === 'number') targets.add(l.puzzleTarget);
        else if (l.puzzleTarget === 'mixed') partialTargets.forEach(t => targets.add(t));
      }
    }
    const root = path.resolve(__dirname, '..');
    const missing: string[] = [];
    for (const target of targets) {
      for (const id of everyLineFor(target)) {
        for (const lang of ['ro', 'en', 'de']) {
          const file = `voice_${lang}_${id}.mp3`;
          if (!fs.existsSync(path.join(root, 'assets/audio', file))) missing.push(file);
          if (!fs.existsSync(path.join(root, 'android/app/src/main/res/raw', file))) {
            missing.push(`raw/${file}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
