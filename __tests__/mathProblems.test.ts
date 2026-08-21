import {
  generateProblem,
  generateShareProblem,
  generateMemoryChallenge,
} from '../src/utils/mathProblems';

const DRAWS = 400;

function facts(mode: 'addition' | 'subtraction', level: number): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < DRAWS; i++) {
    const p = generateProblem(mode, level, 'older');
    set.add(`${p.num1}-${p.num2}`);
  }
  return set;
}

describe('problem generation', () => {
  // The defect this guards: levels 1-9 fix the ADDEND, so the pool narrows as
  // the level climbs. Measured before the sum bands existed, level 9 offered
  // exactly three facts for a five-problem level, at the climax of the two
  // biggest worlds.
  it.each([12, 13, 14, 15, 16, 17, 18])(
    'addition band %i offers at least four distinct facts',
    level => {
      expect(facts('addition', level).size).toBeGreaterThanOrEqual(4);
    },
  );

  it.each([12, 13, 14, 15, 16, 17, 18])(
    'subtraction band %i offers at least four distinct facts',
    level => {
      expect(facts('subtraction', level).size).toBeGreaterThanOrEqual(4);
    },
  );

  it('widens as the sum grows rather than narrowing', () => {
    const sizes = [12, 13, 14, 15, 16].map(l => facts('addition', l).size);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
  });

  it('never generates a sum above ten', () => {
    for (const level of [12, 13, 14, 15, 16, 17, 18, 26]) {
      for (let i = 0; i < DRAWS; i++) {
        const p = generateProblem('addition', level, 'older');
        expect(p.num1 + p.num2).toBe(p.answer);
        expect(p.answer).toBeLessThanOrEqual(10);
        expect(p.num1).toBeGreaterThanOrEqual(1);
        expect(p.num2).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('never generates a negative difference', () => {
    for (const level of [1, 5, 9, 10, 12, 16, 17, 18]) {
      for (let i = 0; i < DRAWS; i++) {
        const p = generateProblem('subtraction', level, 'older');
        expect(p.answer).toBe(p.num1 - p.num2);
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.num1).toBeLessThanOrEqual(10);
      }
    }
  });

  // High Five! — num1 is always a full top row, and the child counts on.
  it('always starts High Five from a full top row', () => {
    for (let level = 30; level <= 35; level++) {
      for (let i = 0; i < DRAWS; i++) {
        const p = generateProblem('addition', level, 'older');
        expect(p.num1).toBe(5);
        expect(p.num2).toBeGreaterThanOrEqual(1);
        expect(p.num2).toBeLessThanOrEqual(5);
        expect(p.answer).toBe(5 + p.num2);
        expect(p.answer).toBeLessThanOrEqual(10);
      }
    }
  });

  it('never makes a High Five level a single fact', () => {
    for (let level = 30; level <= 35; level++) {
      expect(facts('addition', level).size).toBeGreaterThanOrEqual(2);
    }
  });

  it('shares evenly at every level, finale included', () => {
    for (let level = 1; level <= 8; level++) {
      for (let i = 0; i < 100; i++) {
        const p = generateShareProblem(level);
        expect(p.total % p.buckets).toBe(0);
        expect(p.target).toBe(p.total / p.buckets);
        expect(p.total).toBeLessThanOrEqual(10);
      }
    }
  });

  it('places exactly the requested number of memory dots', () => {
    for (let level = 1; level <= 7; level++) {
      for (let i = 0; i < 100; i++) {
        const c = generateMemoryChallenge(level);
        expect(c.targetCells).toHaveLength(10);
        expect(c.targetCells.filter(x => x === 'filled')).toHaveLength(
          c.targetCount,
        );
      }
    }
  });

  it('reaches every cell position over many memory draws', () => {
    // Guards the shuffle: `.sort(() => Math.random() - 0.5)` is not uniform and
    // systematically favoured some positions.
    const hits = new Array(10).fill(0);
    for (let i = 0; i < 4000; i++) {
      generateMemoryChallenge(3).targetCells.forEach((c, idx) => {
        if (c === 'filled') hits[idx]++;
      });
    }
    const min = Math.min(...hits);
    const max = Math.max(...hits);
    expect(min).toBeGreaterThan(0);
    expect(max / min).toBeLessThan(1.35);
  });
});
