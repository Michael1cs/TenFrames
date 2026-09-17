/**
 * Farm Share bookkeeping. A move is one change: a carrot can never leave
 * the pool without arriving somewhere.
 */
import {give, isFair, remaining, startShare, takeBack} from '../src/utils/shareState';

describe('sharing state', () => {
  it('starts with everything in the pool and nothing given', () => {
    const s = startShare(6, 2);
    expect(s.pool).toEqual([0, 1, 2, 3, 4, 5]);
    expect(s.baskets).toEqual([[], []]);
    expect(remaining(s)).toBe(6);
  });

  it('moves the dragged piece, keeping the others in place', () => {
    const s = give(startShare(6, 2), 1, 2);
    expect(s.pool).toEqual([0, 1, 3, 4, 5]);
    expect(s.baskets[1]).toEqual([2]);
  });

  it('gives the last piece on a plain tap', () => {
    const s = give(startShare(6, 2), 0);
    expect(s.pool).toEqual([0, 1, 2, 3, 4]);
    expect(s.baskets[0]).toEqual([5]);
  });

  it('never conjures food from an empty pool', () => {
    let s = startShare(2, 2);
    s = give(s, 0);
    s = give(s, 0);
    const again = give(s, 1);
    expect(again).toBe(s);
    expect(remaining(again)).toBe(0);
  });

  it('puts a piece back in its old place', () => {
    let s = give(startShare(6, 2), 0, 2);
    s = takeBack(s, 0);
    expect(s.pool).toEqual([0, 1, 2, 3, 4, 5]);
    expect(s.baskets[0]).toEqual([]);
  });

  it('knows a fair share when it sees one', () => {
    let s = startShare(6, 2);
    [0, 1, 2].forEach(id => (s = give(s, 0, id)));
    expect(isFair(s, 3)).toBe(false); // pool not empty
    [3, 4, 5].forEach(id => (s = give(s, 1, id)));
    expect(isFair(s, 3)).toBe(true);
    s = takeBack(s, 1);
    s = give(s, 0);
    expect(isFair(s, 3)).toBe(false); // 4 and 2
  });
});
