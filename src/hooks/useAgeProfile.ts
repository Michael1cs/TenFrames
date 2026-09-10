import {useMemo} from 'react';
import {AgeGroup, GameMode} from '../types/game';

export interface AgeProfile {
  compact: boolean;
  autoVoice: boolean;
  showHints: boolean;
  availableModes: GameMode[];
  fontScale: number;
  cellMinSize: number;
}

export function useAgeProfile(ageGroup: AgeGroup): AgeProfile {
  return useMemo(() => {
    const isYoung = ageGroup === 'young';
    return {
      compact: isYoung,
      autoVoice: isYoung,
      showHints: !isYoung,
      // Compare ("which has more?") is pure subitizing, so even the young
      // profile gets it. Answer mode needs numeral recognition 0-10 — that is
      // the older band's bridge to written equations.
      availableModes: isYoung
        ? (['counting', 'addition', 'subtraction', 'compare', 'workshop'] as GameMode[])
        : (['counting', 'addition', 'subtraction', 'answer', 'puzzle', 'compare', 'workshop'] as GameMode[]),
      fontScale: isYoung ? 1.15 : 1.0,
      cellMinSize: isYoung ? 64 : 56,
    };
  }, [ageGroup]);
}
