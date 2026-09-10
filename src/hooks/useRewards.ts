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

// Give the immediate answer feedback (stars burst ~3s) the stage first.
const CELEBRATION_START_DELAY_MS = 2400;
// The milestone card has a Continue button; the timeout is only the escape
// hatch for a child who never taps.
const MILESTONE_AUTO_MS = 8000;
const TOAST_AUTO_MS = 4000;

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
              correct: modeStats.correct + 1,
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

        // Everything unlocked by this answer files into the celebration
        // queue in order of weight; the delay lets the stars burst finish.
        const queued: Celebration[] = [];
        if (crossedMilestone) queued.push({kind: 'milestone', id: crossedMilestone});
        for (const achId of newlyUnlocked) {
          queued.push({kind: 'achievement', id: achId});
        }
        if (unlockedStickers.length > 0) {
          queued.push({kind: 'sticker', ids: unlockedStickers});
        }
        if (queued.length > 0) {
          setTimeout(() => {
            setCelebrationQueue(q => [...q, ...queued]);
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
