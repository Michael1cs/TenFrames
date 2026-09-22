import {ladderFor, LADDER_CAPS} from '../src/hooks/useGameState';
import {rungStars} from '../src/components/feedback/RungProgress';

describe('the rung meter', () => {
  it('shows one star per rung on the short ladders', () => {
    expect([1, 2, 3, 4].map(l => rungStars(l, 4))).toEqual([1, 2, 3, 4]);
  });

  it('folds the eleven-rung ladders onto five stars, never fewer than one', () => {
    const seq = Array.from({length: 11}, (_, i) => rungStars(i + 1, 11));
    expect(seq[0]).toBe(1);
    expect(seq[10]).toBe(5);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1]);
  });

  it('only climbs where a ladder exists', () => {
    const levels = {addition: 3, readSub: 2};
    expect(ladderFor('addition', levels)).toEqual({level: 3, cap: 11});
    expect(ladderFor('readSub', levels)).toEqual({level: 2, cap: LADDER_CAPS.readSub});
    expect(ladderFor('counting', levels)).toBeNull();
    expect(ladderFor('workshop', levels)).toBeNull();
  });
});
