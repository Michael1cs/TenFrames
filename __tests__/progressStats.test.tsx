/**
 * The parent dashboard is a paid feature; it must report what actually
 * happened. Every solved problem used to count as "correct", however many
 * tries it took, so every mode read 100% and "practise more" could never
 * appear.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useRewards} from '../src/hooks/useRewards';

type Rewards = ReturnType<typeof useRewards>;

function renderRewards() {
  const ref: {current: Rewards | null} = {current: null};
  function Probe() {
    ref.current = useRewards();
    return null;
  }
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(React.createElement(Probe));
  });
  return () => ref.current!;
}
const act = ReactTestRenderer.act;

describe('per-mode accuracy', () => {
  it('counts a problem correct only when it was right first try', () => {
    const rewards = renderRewards();
    act(() => {
      rewards().awardStars('addition', true);
    });
    act(() => {
      rewards().awardStars('addition', false);
    });
    act(() => {
      rewards().awardStars('addition', false);
    });
    const stats = rewards().rewards.stats.byMode.addition;
    expect(stats.attempted).toBe(3);
    expect(stats.correct).toBe(1);
  });

  it('keeps modes apart', () => {
    const rewards = renderRewards();
    act(() => {
      rewards().awardStars('counting', true);
    });
    act(() => {
      rewards().awardStars('subtraction', false);
    });
    expect(rewards().rewards.stats.byMode.counting.correct).toBe(1);
    expect(rewards().rewards.stats.byMode.subtraction.correct).toBe(0);
  });
});

describe('daily streak', () => {
  const {nextStreak} = require('../src/hooks/useRewards');
  const fresh = {current: 0, lastPlayedDate: '', longest: 0};

  it('starts at one on the first day of practice', () => {
    expect(nextStreak(fresh, '2026-09-17')).toEqual({current: 1, lastPlayedDate: '2026-09-17', longest: 1});
  });

  it('grows on consecutive days and remembers the longest run', () => {
    let s = nextStreak(fresh, '2026-09-16');
    s = nextStreak(s, '2026-09-17');
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it('does not move twice in one day', () => {
    const s = nextStreak(fresh, '2026-09-17');
    expect(nextStreak(s, '2026-09-17')).toBe(s);
  });

  it('resets after a missed day, keeping the longest', () => {
    let s = nextStreak(fresh, '2026-09-10');
    s = nextStreak(s, '2026-09-11');
    s = nextStreak(s, '2026-09-13');
    expect(s.current).toBe(1);
    expect(s.longest).toBe(2);
  });

  it('crosses a month boundary', () => {
    let s = nextStreak(fresh, '2026-08-31');
    s = nextStreak(s, '2026-09-01');
    expect(s.current).toBe(2);
  });

  it('moves when a problem is answered, not when the app opens', () => {
    const rewards = renderRewards();
    expect(rewards().rewards.streak.current).toBe(0);
    act(() => {
      rewards().awardStars('counting', true);
    });
    expect(rewards().rewards.streak.current).toBe(1);
  });
});
