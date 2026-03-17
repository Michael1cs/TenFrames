// Daily exercise limit for free users on limited modes
export const FREE_DAILY_LIMIT = 5;

// Modes that are always free (unlimited)
export const FREE_MODES = ['counting'] as const;

// Modes with daily limit for free users
export const LIMITED_MODES = ['addition', 'subtraction', 'puzzle'] as const;

// Free themes (available without purchase)
export const FREE_THEMES = ['space', 'forest'] as const;
