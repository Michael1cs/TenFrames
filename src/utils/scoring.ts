export function calculateLevel(score: number): number {
  return Math.floor(score / 5) + 1;
}

export function shouldLevelUp(
  score: number,
  currentLevel: number,
): boolean {
  return score > 0 && score % 5 === 0 && score / 5 === currentLevel;
}
