/**
 * Dropping food in front of an animal has to forgive a four-year-old's aim,
 * without ever guessing when two baskets are equally plausible.
 */
import {dropTargetAt, DropRect} from '../src/utils/dropTarget';

const left: DropRect = {x: 40, y: 400, w: 120, h: 80};
const right: DropRect = {x: 220, y: 400, w: 120, h: 80};
const rects = [left, right];

describe('drop target', () => {
  it('takes a drop inside a basket', () => {
    expect(dropTargetAt(rects, 100, 440)).toBe(0);
    expect(dropTargetAt(rects, 280, 440)).toBe(1);
  });

  it('forgives a near miss', () => {
    expect(dropTargetAt(rects, 100, 390)).toBe(0); // just above
    expect(dropTargetAt(rects, 345, 440)).toBe(1); // just right of it
  });

  it('gives up when the drop is nowhere near', () => {
    expect(dropTargetAt(rects, 100, 100)).toBe(-1);
    expect(dropTargetAt(rects, 600, 440)).toBe(-1);
  });

  it('picks the nearer basket when the margins overlap', () => {
    // 190 sits between the two, inside both margins; it is closer to the left.
    expect(dropTargetAt(rects, 185, 440)).toBe(0);
    expect(dropTargetAt(rects, 195, 440)).toBe(1);
  });

  it('ignores baskets that have not been measured yet', () => {
    expect(dropTargetAt([undefined, right], 280, 440)).toBe(1);
    expect(dropTargetAt([undefined], 280, 440)).toBe(-1);
  });
});
