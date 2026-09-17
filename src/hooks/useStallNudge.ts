import {useCallback, useEffect, useRef, useState} from 'react';

export const STALL_HINT_MS = 4000;
export const STALL_REPLAY_MS = 10000;

interface StallNudgeOptions {
  // Checked when the replay is due: a nudge armed on a screen the child has
  // since left must stay silent.
  canReplay: () => boolean;
}

// Help for a child who stalls on a problem: a pulsing hand after 4s, and
// the instruction spoken once more after 10s. `arm` starts both for a new
// problem (re-arming replaces the previous pair); `cancel` ends them — on a
// tap, when the answer lands, or when the child leaves the mode. The replay
// runs at most once per arm, so a child who walks away doesn't come back
// to an app repeating itself.
export function useStallNudge({canReplay}: StallNudgeOptions) {
  const [showHint, setShowHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canReplayRef = useRef(canReplay);
  canReplayRef.current = canReplay;

  const cancel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (replayTimer.current) clearTimeout(replayTimer.current);
    hintTimer.current = null;
    replayTimer.current = null;
    setShowHint(false);
  }, []);

  const arm = useCallback(
    (replay: () => void) => {
      cancel();
      hintTimer.current = setTimeout(() => {
        hintTimer.current = null;
        setShowHint(true);
      }, STALL_HINT_MS);
      replayTimer.current = setTimeout(() => {
        replayTimer.current = null;
        if (canReplayRef.current()) replay();
      }, STALL_REPLAY_MS);
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return {showHint, arm, cancel};
}
