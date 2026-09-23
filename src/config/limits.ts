// Daily exercise limit for free users on limited modes
export const FREE_DAILY_LIMIT = 5;

// Modes that are always free (unlimited)
export const FREE_MODES = ['counting', 'workshop'] as const;

// Modes with daily limit for free users
// The race is billed once per run, at the start (see GameShell), not per
// problem — a run is the exercise there.
export const LIMITED_MODES = ['addition', 'subtraction', 'readAdd', 'readSub', 'race'] as const;

// Free themes (available without purchase)
export const FREE_THEMES = ['space', 'forest'] as const;
