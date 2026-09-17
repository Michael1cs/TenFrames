import {useState, useCallback, useEffect, useRef} from 'react';
import {GameMode, RewardData} from '../types/game';
import {ALL_STICKERS, ALL_ACHIEVEMENTS} from '../utils/rewardData';

// One correct answer can unlock a milestone, an achievement AND stickers at
// the same instant — the star thresholds (10/25/50/100) deliberately overlap
// across the three systems. Shown together they buried each other (three
// popups on three parts of the screen at once), so celebrations now file
// through a queue: one on stage at a time, milestone first (it is the big
// moment), then achievements, then stickers.
export type Celebration =
  | {kind: 'milestone'; id: string}
  | {kind: 'achievement'; id: string}
  | {kind: 'sticker'; ids: string[]};

// A toast lives entirely inside the pause between problems (Free Play holds
// ~5s after a correct answer): a short beat for the stars burst, then a 3s
// card, done before the next problem appears. Anything still pending when a
// new problem starts is dropped — a celebration is about the moment, and
// once the next challenge is up the moment is over (milestones excepted).
const CELEBRATION_START_DELAY_MS = 1200;
// The milestone card has a Continue button; the timeout is only the escape
// hatch for a child who never taps.
const MILESTONE_AUTO_MS = 8000;
const TOAST_AUTO_MS = 3000;

const defaultRewardData: RewardData = {
  totalStars: 0,
  starsAvailable: 0,
  stickers: [],
  achievements: [],
  streak: {current: 0, lastPlayedDate: '', longest: 0},
  levelStars: {},
  stats: {
    totalProblems: 0,
    correctFirstTry: 0,
    byMode: {},
  },
  milestonesSeen: [],
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useRewards() {
  const [rewards, setRewards] = useState<RewardData>(defaultRewardData);
  const [celebrationQueue, setCelebrationQueue] = useState<Celebration[]>([]);
  const currentCelebration = celebrationQueue[0] ?? null;

  const rewardsRef = useRef(rewards);
  rewardsRef.current = rewards;

  const advanceCelebration = useCallback(() => {
    setCelebrationQueue(q => q.slice(1));
  }, []);

  // Called when a new problem takes the stage: whatever toast didn't get its
  // moment is dropped rather than shown over the next challenge. Milestones
  // survive — they are modal and rare.
  const clearTransientCelebrations = useCallback(() => {
    setCelebrationQueue(q => q.filter(c => c.kind === 'milestone'));
  }, []);

  // Auto-advance whatever is on stage; a tap (milestone Continue) advances
  // sooner via advanceCelebration.
  useEffect(() => {
    if (!currentCelebration) return;
    const ms =
      currentCelebration.kind === 'milestone' ? MILESTONE_AUTO_MS : TOAST_AUTO_MS;
    const t = setTimeout(advanceCelebration, ms);
    return () => clearTimeout(t);
  }, [currentCelebration, advanceCelebration]);

  // Load reward data (called from GameShell on mount)
  const loadRewards = useCallback((data: RewardData) => {
    const merged = {...defaultRewardData, ...data};
    // A former bug re-appended every reached milestone on every correct
    // answer, so long-time saves carry thousands of duplicates — dedupe once
    // on load and the next save persists the clean list.
    merged.milestonesSeen = Array.from(new Set(merged.milestonesSeen));
    setRewards(merged);
  }, []);

  // Update daily streak
  const updateDailyStreak = useCallback(() => {
    setRewards(prev => {
      const today = getToday();
      if (prev.streak.lastPlayedDate === today) {
        return prev; // Already updated today
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      let newCurrent: number;
      if (prev.streak.lastPlayedDate === yesterdayStr) {
        newCurrent = prev.streak.current + 1;
      } else {
        newCurrent = 1;
      }

      return {
        ...prev,
        streak: {
          current: newCurrent,
          lastPlayedDate: today,
          longest: Math.max(prev.streak.longest, newCurrent),
        },
      };
    });
  }, []);

  // Award stars after a correct answer
  // Returns number of stars awarded (1-3)
  const awardStars = useCallback(
    (mode: GameMode, wasFirstTry: boolean): number => {
      const stars = wasFirstTry ? 3 : 1;

      setRewards(prev => {
        const newTotalStars = prev.totalStars + stars;
        const newStarsAvailable = prev.starsAvailable + stars;

        // Update mode stats
        const modeStats = prev.stats.byMode[mode] || {attempted: 0, correct: 0};
        const newStats = {
          ...prev.stats,
          totalProblems: prev.stats.totalProblems + 1,
          correctFirstTry: wasFirstTry
            ? prev.stats.correctFirstTry + 1
            : prev.stats.correctFirstTry,
          byMode: {
            ...prev.stats.byMode,
            [mode]: {
              attempted: modeStats.attempted + 1,
              // Only a first-try success counts as correct. This used to
              // add one for every solved problem, however many tries it
              // took, so the paid parent dashboard reported 100% in every
              // mode and could never point at what needed practice.
              correct: modeStats.correct + (wasFirstTry ? 1 : 0),
            },
          },
        };

        // Check for new stickers
        const unlockedStickers = ALL_STICKERS.filter(
          s => s.requirement <= newTotalStars && !prev.stickers.includes(s.id),
        ).map(s => s.id);

        // Check for new achievements
        const allStickers = [...prev.stickers, ...unlockedStickers];
        const newlyUnlocked = checkAchievements(
          {
            ...prev,
            totalStars: newTotalStars,
            stickers: allStickers,
            stats: newStats,
          },
          prev.achievements,
        );

        // Check milestones (10, 25, 50, 100 stars)
        const milestones = [10, 25, 50, 100];
        let crossedMilestone: string | null = null;
        for (const m of milestones) {
          if (
            newTotalStars >= m &&
            prev.totalStars < m &&
            !prev.milestonesSeen.includes(`stars-${m}`)
          ) {
            crossedMilestone = `stars-${m}`;
            break;
          }
        }

        // At most ONE toast per answer — the milestone modal plus the single
        // most important unlock. An achievement outranks stickers; extra
        // unlocks land silently in the book/screen (early game unlocks
        // something on nearly every answer, and a parade per answer reads as
        // noise, not reward).
        const queued: Celebration[] = [];
        if (crossedMilestone) queued.push({kind: 'milestone', id: crossedMilestone});
        if (newlyUnlocked.length > 0) {
          queued.push({kind: 'achievement', id: newlyUnlocked[0]});
        } else if (unlockedStickers.length > 0) {
          queued.push({kind: 'sticker', ids: unlockedStickers});
        }
        if (queued.length > 0) {
          setTimeout(() => {
            setCelebrationQueue(q => {
              // Adventure awards a level's stars as one 5-call batch: merge
              // back-to-back sticker toasts into a single card instead of
              // parading five of them.
              const merged = [...q];
              for (const c of queued) {
                const last = merged[merged.length - 1];
                if (c.kind === 'sticker' && last?.kind === 'sticker') {
                  merged[merged.length - 1] = {
                    kind: 'sticker',
                    ids: [...last.ids, ...c.ids],
                  };
                } else {
                  merged.push(c);
                }
              }
              return merged;
            });
          }, CELEBRATION_START_DELAY_MS);
        }

        return {
          ...prev,
          totalStars: newTotalStars,
          starsAvailable: newStarsAvailable,
          stickers: allStickers,
          achievements: [...prev.achievements, ...newlyUnlocked],
          stats: newStats,
          milestonesSeen: crossedMilestone
            ? [...prev.milestonesSeen, crossedMilestone]
            : prev.milestonesSeen,
        };
      });

      return stars;
    },
    [],
  );

  // Record a wrong answer (for stats)
  const recordWrongAnswer = useCallback((mode: GameMode) => {
    setRewards(prev => {
      const modeStats = prev.stats.byMode[mode] || {attempted: 0, correct: 0};
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalProblems: prev.stats.totalProblems + 1,
          byMode: {
            ...prev.stats.byMode,
            [mode]: {
              attempted: modeStats.attempted + 1,
              correct: modeStats.correct,
            },
          },
        },
      };
    });
  }, []);


  // Get progress info
  const getStickerProgress = useCallback(() => {
    const r = rewardsRef.current;
    const total = ALL_STICKERS.length;
    const unlocked = r.stickers.length;
    const nextSticker = ALL_STICKERS.find(
      s => !r.stickers.includes(s.id),
    );
    return {total, unlocked, nextSticker};
  }, []);

  const getAchievementProgress = useCallback(() => {
    const r = rewardsRef.current;
    return {
      total: ALL_ACHIEVEMENTS.length,
      unlocked: r.achievements.length,
    };
  }, []);

  return {
    rewards,
    currentCelebration,
    advanceCelebration,
    clearTransientCelebrations,
    loadRewards,
    updateDailyStreak,
    awardStars,
    recordWrongAnswer,
    getStickerProgress,
    getAchievementProgress,
  };
}

// Check which achievements are newly unlocked
function checkAchievements(
  data: RewardData,
  alreadyUnlocked: string[],
): string[] {
  const newly: string[] = [];

  for (const ach of ALL_ACHIEVEMENTS) {
    if (alreadyUnlocked.includes(ach.id)) continue;

    const {type, value, mode} = ach.requirement;
    let met = false;

    switch (type) {
      case 'stars':
        met = data.totalStars >= value;
        break;
      case 'streak':
        met = data.streak.current >= value;
        break;
      case 'stickers':
        met = data.stickers.length >= value;
        break;
      case 'mode_complete':
        if (mode) {
          const modeStats = data.stats.byMode[mode];
          met = (modeStats?.correct || 0) >= value;
        }
        break;
      case 'perfect':
        // This is checked via streak in game state
        met = data.stats.correctFirstTry >= value;
        break;
    }

    if (met) {
      newly.push(ach.id);
    }
  }

  return newly;
}
