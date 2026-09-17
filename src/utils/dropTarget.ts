export type DropRect = {x: number; y: number; w: number; h: number};

/**
 * Which target a dragged thing was dropped on, or -1.
 *
 * The margin is deliberate: a four-year-old drags with a whole hand and lets
 * go near the basket rather than on it. Overlapping targets resolve to the
 * one whose centre is closest, so a generous margin never makes the choice
 * ambiguous.
 */
export function dropTargetAt(
  rects: (DropRect | undefined)[],
  x: number,
  y: number,
  margin = 28,
): number {
  let best = -1;
  let bestDistance = Infinity;
  rects.forEach((r, i) => {
    if (!r) return;
    const inside =
      x >= r.x - margin &&
      x <= r.x + r.w + margin &&
      y >= r.y - margin &&
      y <= r.y + r.h + margin;
    if (!inside) return;
    const dx = x - (r.x + r.w / 2);
    const dy = y - (r.y + r.h / 2);
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}
