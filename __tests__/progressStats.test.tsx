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
