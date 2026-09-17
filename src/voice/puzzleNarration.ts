// What the voice says in a "make N" puzzle: a board with some counters,
// and the child adds until the total is N.
//
// Only N = 10 fills the frame. The Make 10! lines ("fill the empty cells",
// "until the frame is full", "the frame is full!") are wrong for Number
// Bubbles, whose targets run 3 to 9 — a child who follows them fills every
// cell and gets it wrong. Every other target uses lines that hold for any
// number.

// "Make seven!" / "Make ten!"
export function puzzleTargetId(target: number): string {
  return target === 10 ? 'instr_make_ten' : `make_${target}`;
}

// The goal, then how to reach it — rotating across the level.
export function puzzleInstructionIds(target: number, problemIndex: number): string[] {
  const turn = 1 + (problemIndex % 3);
  return [
    puzzleTargetId(target),
    target === 10 ? `pzl_ask_${turn}` : `pzl_part_ask_${turn}`,
  ];
}

// After a wrong answer, before the child tries again.
export function puzzleRetryIds(target: number): string[] {
  return target === 10
    ? ['instr_puzzle', 'instr_make_ten']
    : [puzzleTargetId(target), 'pzl_part_ask_2'];
}

// Half the time the praise names what the child built; the rest of the
// time it comes from the general pool.
export function puzzlePraisePool(
  target: number,
  generalPool: string[],
  random: number = Math.random(),
): string[] {
  if (random >= 0.5) return generalPool;
  return target === 10 ? ['ok_full_1'] : ['ok_count_1'];
}
