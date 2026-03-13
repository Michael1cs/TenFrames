import {useState, useCallback, useRef} from 'react';
import {GameMode, RewardData} from '../types/game';
import {ALL_STICKERS, ALL_ACHIEVEMENTS} from '../utils/rewardData';

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
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [newStickers, setNewStickers] = useState<string[]>([]);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);

  const rewardsRef = useRef(rewards);
  rewardsRef.current = rewards;

  // Load reward data (called from GameShell on mount)
  const loadRewards = useCallback((data: RewardData) => {
    setRewards({...defaultRewardData, ...data});
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

        if (unlockedStickers.length > 0) {
          setNewStickers(unlockedStickers);
          // Auto-clear after 4 seconds
          setTimeout(() => setNewStickers([]), 4000);
        }

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

        if (newlyUnlocked.length > 0) {
          setNewAchievement(newlyUnlocked[0]);
          setTimeout(() => setNewAchievement(null), 4000);
        }

        // Check milestones (10, 25, 50, 100 stars)
        const milestones = [10, 25, 50, 100];
        for (const m of milestones) {
          if (
            newTotalStars >= m &&
            prev.totalStars < m &&
            !prev.milestonesSeen.includes(`stars-${m}`)
          ) {
            setShowMilestone(`stars-${m}`);
            setTimeout(() => setShowMilestone(null), 5000);
            break;
          }
        }

        return {
          ...prev,
          totalStars: newTotalStars,
          starsAvailable: newStarsAvailable,
          stickers: allStickers,
          achievements: [...prev.achievements, ...newlyUnlocked],
          stats: newStats,
          milestonesSeen: newTotalStars >= 10
            ? [...prev.milestonesSeen, ...milestones.filter(m => newTotalStars >= m).map(m => `stars-${m}`)]
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

  // Dismiss milestone/achievement popups
  const dismissMilestone = useCallback(() => setShowMilestone(null), []);
  const dismissAchievement = useCallback(() => setNewAchievement(null), []);
  const dismissNewStickers = useCallback(() => setNewStickers([]), []);

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
    newAchievement,
    newStickers,
    showMilestone,
    loadRewards,
    updateDailyStreak,
    awardStars,
    recordWrongAnswer,
    dismissMilestone,
    dismissAchievement,
    dismissNewStickers,
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
