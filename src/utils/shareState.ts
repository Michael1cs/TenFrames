/**
 * The state of a sharing problem: which pieces of food are still in the
 * pool, and which pieces each animal has been given. Every piece has an id,
 * so it keeps its place in the pool grid and a move is one atomic change —
 * the previous version updated the pool and the basket in two separate
 * state calls, and when React deferred the first, the second never ran:
 * a carrot vanished from the pool and no animal received it.
 */
export interface ShareState {
  total: number;
  pool: number[]; // ids still to be handed out, in grid order
  baskets: number[][]; // ids each animal holds
}

export function startShare(total: number, buckets: number): ShareState {
  return {
    total,
    pool: Array.from({length: total}, (_, i) => i),
    baskets: Array.from({length: buckets}, () => []),
  };
}

/** Hand a piece to an animal: the dragged one, or the last in the pool. */
export function give(state: ShareState, basket: number, id?: number): ShareState {
  if (basket < 0 || basket >= state.baskets.length) return state;
  const pick =
    id !== undefined && state.pool.includes(id)
      ? id
      : state.pool[state.pool.length - 1];
  if (pick === undefined) return state;
  return {
    ...state,
    pool: state.pool.filter(p => p !== pick),
    baskets: state.baskets.map((b, i) => (i === basket ? [...b, pick] : b)),
  };
}

/** Take the last piece back from an animal into its old place in the pool. */
export function takeBack(state: ShareState, basket: number): ShareState {
  const held = state.baskets[basket];
  if (!held || held.length === 0) return state;
  const id = held[held.length - 1];
  return {
    ...state,
    pool: [...state.pool, id].sort((a, b) => a - b),
    baskets: state.baskets.map((b, i) => (i === basket ? b.slice(0, -1) : b)),
  };
}

export const remaining = (state: ShareState) => state.pool.length;

/** Everything handed out, and every animal has exactly `target`. */
export function isFair(state: ShareState, target: number): boolean {
  return state.pool.length === 0 && state.baskets.every(b => b.length === target);
}
