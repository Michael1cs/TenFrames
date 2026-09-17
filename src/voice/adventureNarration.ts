import {CountingChallenge} from '../types/game';

// What the voice says for the parts of Adventure where the words have to
// match the level's actual rule. Kept out of the screen so each rule can be
// tested: every bug of this class so far (Make N on Number Bubbles, "same on
// both rows", "tap the one with more" on equal frames) was a sentence that
// no longer matched the check next to it.

// Counting. A plain "fill N" leads with a rotating ask so the number lands
// inside a sentence; the row instructions name the row; "same on both rows"
// names HOW MANY per row, because the check accepts only exactly that.
export function countingInstructionIds(
  challenge: CountingChallenge,
  problemIndex: number,
): string[] {
  const {instruction, targetNumber} = challenge;
  const longForm = problemIndex % 2 === 1;
  if (instruction === 'fill_top_row') {
    return [longForm ? 'cnt_top_long' : 'instr_top_row'];
  }
  if (instruction === 'fill_bottom_row') {
    return [longForm ? 'cnt_bottom_long' : 'instr_bottom_row'];
  }
  if (instruction === 'fill_both_equal') {
    const perRow = targetNumber / 2;
    return [
      Number.isInteger(perRow) && perRow >= 1 && perRow <= 5
        ? `both_rows_${perRow}`
        : 'instr_both_rows',
    ];
  }
  return [`cnt_ask_${1 + (problemIndex % 3)}`, `num_${targetNumber}`];
}

// Compare. From modeLevel 3 the generator produces equal pairs, so every
// problem on those levels asks a question that allows "the same" — asking it
// only when the frames are equal would tell the child the answer.
export function compareAskIds(modeLevel: number, problemIndex: number): string[] {
  const canBeEqual = modeLevel >= 3;
  if (canBeEqual) {
    const asks = ['cmp_ask_eq_1', 'cmp_ask_eq_2'];
    return problemIndex === 0
      ? [asks[0], 'cmp_ask_same']
      : [asks[problemIndex % asks.length]];
  }
  const asks = ['cmp_ask_1', 'cmp_ask_2', 'cmp_ask_3', 'cmp_ask_4'];
  return [asks[problemIndex === 0 ? 1 : 1 + ((problemIndex - 1) % 3)]];
}

// Answer mode. The "sum" slot is answered with the total; the "addend" slot
// with the part the child added, so its instruction has to end on that
// question and its pad nudge cannot say "tap the number".
export function answerInstructionIds(
  slot: 'sum' | 'addend',
  num1: number,
  num2: number,
  answer: number,
  noun?: string,
): string[] {
  if (slot === 'sum') {
    return noun ? [`have_${noun}_${num1}`, `add_more_${noun}_${num2}`] : ['instr_addition'];
  }
  const makeId = answer === 10 ? 'instr_make_ten' : `make_${answer}`;
  return noun
    ? [`have_${noun}_${num1}`, makeId, 'pzl_part_ask_2']
    : [makeId, 'pzl_part_ask_2'];
}

export function padNudgeId(slot: 'sum' | 'addend'): string {
  return slot === 'addend' ? 'ask_added_tap' : 'instr_tap_number';
}
