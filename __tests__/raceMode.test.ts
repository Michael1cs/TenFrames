import {raceBand, RACE_MS} from '../src/components/game/RaceMode';
import {READ_LEVEL_CAP} from '../src/utils/mathProblems';

describe('the race', () => {
  it('lasts 35 seconds', () => {
    expect(RACE_MS).toBe(35000);
  });
  it('meets bigger numbers as the score grows, up to the ladder top', () => {
    expect(raceBand(0)).toBe(1);
    expect(raceBand(3)).toBe(1);
    expect(raceBand(4)).toBe(2);
    expect(raceBand(8)).toBe(3);
    expect(raceBand(40)).toBe(READ_LEVEL_CAP);
  });
});
