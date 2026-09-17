/**
 * The help a stalled child gets in Free Play: the hand after 4s, the
 * instruction spoken again after 10s — and neither once the child acts.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  STALL_HINT_MS,
  STALL_REPLAY_MS,
  useStallNudge,
} from '../src/hooks/useStallNudge';

type Nudge = ReturnType<typeof useStallNudge>;

function setup(canReplay: () => boolean = () => true) {
  const ref: {current: Nudge | null} = {current: null};
  function Probe() {
    ref.current = useStallNudge({canReplay});
    return null;
  }
  let root!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<Probe />);
  });
  return {nudge: () => ref.current!, root};
}

const advance = (ms: number) =>
  ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('stall nudge', () => {
  it('shows the hand at 4s and replays the instruction once at 10s', () => {
    const {nudge} = setup();
    const replay = jest.fn();
    ReactTestRenderer.act(() => nudge().arm(replay));

    advance(STALL_HINT_MS - 1);
    expect(nudge().showHint).toBe(false);
    advance(1);
    expect(nudge().showHint).toBe(true);
    expect(replay).not.toHaveBeenCalled();

    advance(STALL_REPLAY_MS - STALL_HINT_MS);
    expect(replay).toHaveBeenCalledTimes(1);

    advance(60000);
    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('does nothing more once the child taps', () => {
    const {nudge} = setup();
    const replay = jest.fn();
    ReactTestRenderer.act(() => nudge().arm(replay));
    advance(STALL_HINT_MS);
    expect(nudge().showHint).toBe(true);

    ReactTestRenderer.act(() => nudge().cancel());
    expect(nudge().showHint).toBe(false);
    advance(STALL_REPLAY_MS);
    expect(replay).not.toHaveBeenCalled();
  });

  it('starts over on a new problem instead of stacking nudges', () => {
    const {nudge} = setup();
    const first = jest.fn();
    const second = jest.fn();
    ReactTestRenderer.act(() => nudge().arm(first));
    advance(STALL_HINT_MS + 1000);
    expect(nudge().showHint).toBe(true);

    ReactTestRenderer.act(() => nudge().arm(second));
    expect(nudge().showHint).toBe(false);
    advance(STALL_REPLAY_MS);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stays silent if the child has left the screen', () => {
    let onScreen = true;
    const {nudge} = setup(() => onScreen);
    const replay = jest.fn();
    ReactTestRenderer.act(() => nudge().arm(replay));
    onScreen = false;
    advance(STALL_REPLAY_MS);
    expect(replay).not.toHaveBeenCalled();
  });

  it('clears its timers when unmounted', () => {
    const {nudge, root} = setup();
    const replay = jest.fn();
    ReactTestRenderer.act(() => nudge().arm(replay));
    ReactTestRenderer.act(() => root.unmount());
    advance(STALL_REPLAY_MS);
    expect(replay).not.toHaveBeenCalled();
  });
});
