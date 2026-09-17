/**
 * Rewards must last the journey. A perfect Adventure level is 15 stars, so
 * thresholds that topped out at 100 filled the album after ~7 of 98 levels.
 */
import {ALL_STICKERS} from '../src/utils/rewardData';

describe('sticker pacing', () => {
  const thresholds = ALL_STICKERS.map(s => s.requirement).sort((a, b) => a - b);

  it('gives the first sticker on the first answer', () => {
    expect(thresholds[0]).toBe(1);
  });

  it('gives a handful in the first level, so the album starts filling at once', () => {
    expect(thresholds.filter(t => t <= 15).length).toBeGreaterThanOrEqual(5);
  });

  it('keeps a next sticker coming deep into Adventure', () => {
    // 630 stars ≈ 42 perfect levels of 98.
    expect(thresholds[thresholds.length - 1]).toBeGreaterThanOrEqual(500);
  });

  it('never bunches: every threshold is distinct', () => {
    expect(new Set(thresholds).size).toBe(thresholds.length);
  });
});
