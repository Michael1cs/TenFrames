import {ladderFor, LADDER_CAPS} from '../src/hooks/useGameState';
import {rungColor, RUNG_COLORS} from '../src/components/feedback/RungProgress';

describe('the rung meter', () => {
  it('only climbs where a ladder exists', () => {
    const levels = {addition: 3, readSub: 2};
    expect(ladderFor('addition', levels)).toEqual({level: 3, cap: 11});
    expect(ladderFor('readSub', levels)).toEqual({level: 2, cap: LADDER_CAPS.readSub});
    expect(ladderFor('counting', levels)).toBeNull();
    expect(ladderFor('workshop', levels)).toBeNull();
  });

  it('changes colour on every climb, never repeating two rungs in a row', () => {
    for (let l = 1; l < 20; l++) expect(rungColor(l + 1)).not.toBe(rungColor(l));
    expect(new Set(RUNG_COLORS).size).toBe(RUNG_COLORS.length);
  });
});
