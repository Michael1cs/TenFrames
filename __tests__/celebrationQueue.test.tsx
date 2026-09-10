/**
 * Celebration queue: crossing a star threshold can unlock a milestone, an
 * achievement and stickers in the same answer. They used to fire as three
 * simultaneous popups; now they file through a queue — one on stage at a
 * time, milestone → achievements → stickers — starting only after the stars
 * burst has had the stage.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useRewards} from '../src/hooks/useRewards';
import {ALL_STICKERS} from '../src/utils/rewardData';

type Api = ReturnType<typeof useRewards>;

function Probe({onRender}: {onRender: (api: Api) => void}) {
  onRender(useRewards());
  return null;
}

async function setupAt49Stars(): Promise<() => Api> {
  let api!: Api;
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
  });
  await ReactTestRenderer.act(() => {
    api.loadRewards({
      totalStars: 49,
      starsAvailable: 49,
      // Own everything below the 50 threshold so the crossing unlocks a
      // small, predictable sticker batch.
      stickers: ALL_STICKERS.filter(s => s.requirement < 50).map(s => s.id),
      achievements: [],
      streak: {current: 1, lastPlayedDate: '', longest: 1},
      levelStars: {},
      stats: {totalProblems: 49, correctFirstTry: 0, byMode: {}},
      milestonesSeen: ['stars-10', 'stars-25'],
    } as any);
  });
  return () => api;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('crossing 50 stars queues milestone, then achievements, then stickers — one at a time', async () => {
  const api = await setupAt49Stars();

  await ReactTestRenderer.act(() => {
    api().awardStars('addition', true); // +3 → 52, crosses 50
  });

  // The stars burst owns the stage first: nothing shows immediately.
  expect(api().currentCelebration).toBeNull();

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(2400);
  });
  expect(api().currentCelebration).toEqual({kind: 'milestone', id: 'stars-50'});

  // Walk the whole parade: milestone first, then every achievement (a fresh
  // save can unlock several at once), then one sticker batch, then quiet.
  const kinds: string[] = [];
  for (let i = 0; i < 30 && api().currentCelebration; i++) {
    kinds.push(api().currentCelebration!.kind);
    await ReactTestRenderer.act(() => {
      api().advanceCelebration();
    });
  }
  expect(api().currentCelebration).toBeNull();
  expect(kinds[0]).toBe('milestone');
  expect(kinds.filter(k => k === 'milestone')).toHaveLength(1);
  expect(kinds.filter(k => k === 'sticker')).toHaveLength(1);
  expect(kinds[kinds.length - 1]).toBe('sticker');
  // No achievement after the sticker: strict milestone → achievements → sticker.
  expect(kinds.lastIndexOf('achievement')).toBeLessThan(kinds.indexOf('sticker'));
});

test('an unattended milestone leaves the stage by itself after 8s', async () => {
  const api = await setupAt49Stars();
  await ReactTestRenderer.act(() => {
    api().awardStars('addition', true);
  });
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(2400);
  });
  expect(api().currentCelebration?.kind).toBe('milestone');
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(8000);
  });
  expect(api().currentCelebration?.kind).not.toBe('milestone');
});

test('milestonesSeen gains one entry per crossing, never duplicates', async () => {
  const api = await setupAt49Stars();
  await ReactTestRenderer.act(() => {
    api().awardStars('addition', true); // crosses 50
  });
  await ReactTestRenderer.act(() => {
    api().awardStars('addition', true); // 55, crosses nothing
  });
  await ReactTestRenderer.act(() => {
    api().awardStars('addition', true); // 58, crosses nothing
  });
  const seen = api().rewards.milestonesSeen;
  expect(seen.filter(m => m === 'stars-50')).toHaveLength(1);
  expect(seen).toHaveLength(3); // 10, 25, 50 — nothing re-appended
});

test('loadRewards dedupes the duplicates left by the old bug', async () => {
  let api!: Api;
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe onRender={a => (api = a)} />);
  });
  await ReactTestRenderer.act(() => {
    api.loadRewards({
      totalStars: 30,
      starsAvailable: 30,
      stickers: [],
      achievements: [],
      streak: {current: 1, lastPlayedDate: '', longest: 1},
      levelStars: {},
      stats: {totalProblems: 0, correctFirstTry: 0, byMode: {}},
      milestonesSeen: ['stars-10', 'stars-10', 'stars-25', 'stars-10', 'stars-25'],
    } as any);
  });
  expect(api.rewards.milestonesSeen).toEqual(['stars-10', 'stars-25']);
});

test('an ordinary answer with no unlocks celebrates nothing', async () => {
  const api = await setupAt49Stars();
  await ReactTestRenderer.act(() => {
    api().awardStars('addition', false); // +1 → 50... wait, crosses!
  });
  // +1 also crosses 50 — drain the whole parade to reach quiet territory.
  // Step the clock so each auto-advance effect can arm the next timer
  // (a single big advance never runs timers armed by later effect passes).
  for (let i = 0; i < 40; i++) {
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(4000);
    });
    if (!api().currentCelebration) break;
  }
  expect(api().currentCelebration).toBeNull();

  await ReactTestRenderer.act(() => {
    api().awardStars('addition', false); // 51 → nothing new
  });
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(api().currentCelebration).toBeNull();
});
