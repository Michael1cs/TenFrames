import {useMemo} from 'react';
import {GameMode} from '../types/game';

export interface AgeProfile {
  compact: boolean;
  autoVoice: boolean;
  showHints: boolean;
  availableModes: GameMode[];
  fontScale: number;
  cellMinSize: number;
}

// One experience for the whole 4-7 audience. Age turned out to be the wrong
// axis — a quick five-year-old runs ahead of a slow six-year-old — so every
// child gets every mode, and DIFFICULTY adapts through the per-mode level
// ladders (3 correct in a row moves you up). The interaction style keeps the
// former "young" tuning: auto-judged answers, big targets, voice always on.
export function useAgeProfile(): AgeProfile {
  return useMemo(
    () => ({
      compact: true,
      autoVoice: true,
      showHints: true,
      // Free Play stays a SHORT bar: four modes plus the Adventure tab, all
      // visible at once with no horizontal scrolling (a scrollable tab bar
      // reads as "that's everything" to a child, so anything past the fold
      // may as well not exist).
      //
      // Puzzle, Answer and Compare live in Adventure instead, where a guided
      // level sequence teaches them properly: Make 10! and Number Bubbles!
      // for puzzle, Number Town for answer.
      availableModes: [
        'counting',
        'addition',
        'subtraction',
        'workshop',
      ] as GameMode[],
      fontScale: 1.15,
      cellMinSize: 64,
    }),
    [],
  );
}
