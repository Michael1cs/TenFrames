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
      availableModes: isYoung
        ? (['counting', 'addition', 'subtraction', 'workshop'] as GameMode[])
        : (['counting', 'addition', 'subtraction', 'puzzle', 'workshop'] as GameMode[]),
      fontScale: isYoung ? 1.15 : 1.0,
      cellMinSize: isYoung ? 64 : 56,
    };
  }, [ageGroup]);
}
