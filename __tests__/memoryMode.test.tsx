/**
 * Memory Garden: a child who is only thinking must not be treated as wrong,
 * and the app must not keep calling after a child who has walked away.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {MemoryMode} from '../src/components/game/MemoryMode';
import {MemoryChallenge, CellState} from '../src/types/game';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

const challenge: MemoryChallenge = {
  targetCells: ['color1', 'color1', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'] as CellState[],
  targetCount: 2,
  showDurationMs: 2000,
};

function mount(props: Partial<React.ComponentProps<typeof MemoryMode>> = {}) {
  const onWrong = jest.fn();
  const onCorrect = jest.fn();
  const onPhaseChange = jest.fn();
  let root!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(
      <MemoryMode
        challenge={challenge}
        colors={{} as any}
        emoji="🍄"
        onCorrect={onCorrect}
        onWrong={onWrong}
        onPhaseChange={onPhaseChange}
        {...props}
      />,
    );
  });
  return {root, onWrong, onCorrect, onPhaseChange};
}

const advance = (ms: number) =>
  ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('memory mode', () => {
  it('does not count doing nothing as a wrong answer', () => {
    const {onWrong, onPhaseChange} = mount();
    advance(challenge.showDurationMs + 100); // show → input
    advance(9000); // the child stares at the frame without tapping
    expect(onWrong).not.toHaveBeenCalled();
    // It does help: the pattern is shown again.
    expect(onPhaseChange.mock.calls.map(c => c[0])).toContain('show');
  });

  it('shows the pattern again only once, instead of every ten seconds forever', () => {
    const {onPhaseChange} = mount();
    advance(challenge.showDurationMs + 100);
    const showsAtStart = onPhaseChange.mock.calls.filter(c => c[0] === 'show').length;
    advance(60000); // a child who wandered off
    const shows = onPhaseChange.mock.calls.filter(c => c[0] === 'show').length;
    expect(shows - showsAtStart).toBe(1);
  });

  it('stops its timers when the level is closed', () => {
    const {root, onPhaseChange} = mount();
    advance(challenge.showDurationMs + 100);
    advance(7000);
    ReactTestRenderer.act(() => root.unmount());
    const before = onPhaseChange.mock.calls.length;
    advance(30000);
    expect(onPhaseChange.mock.calls.length).toBe(before);
  });
});
