import {useState, useCallback} from 'react';
import {GameMode, DailyUsage, PremiumData} from '../types/game';
import {FREE_DAILY_LIMIT, LIMITED_MODES} from '../config/limits';

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const freshDailyUsage = (): DailyUsage => ({
  date: getToday(),
  counts: {},
});

export function usePremium() {
  const [isPremium, setIsPremium] = useState(__DEV__ ? true : false);
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>();
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(freshDailyUsage());

  const loadPremiumData = useCallback((data: PremiumData) => {
    setIsPremium(data.isPremium);
    setPurchaseDate(data.purchaseDate);
    // Reset counts if stored date is not today
    if (data.dailyUsage?.date === getToday()) {
      setDailyUsage(data.dailyUsage);
    } else {
      setDailyUsage(freshDailyUsage());
    }
  }, []);

  const isModeLimited = useCallback(
    (mode: GameMode): boolean => {
      if (isPremium) {
        return false;
      }
      return (LIMITED_MODES as readonly string[]).includes(mode);
    },
    [isPremium],
  );

  const getRemainingExercises = useCallback(
    (mode: GameMode): number => {
      if (isPremium || !isModeLimited(mode)) {
        return Infinity;
      }
      const today = getToday();
      const usage = dailyUsage.date === today ? dailyUsage : freshDailyUsage();
      const used = usage.counts[mode] || 0;
      return Math.max(0, FREE_DAILY_LIMIT - used);
    },
    [isPremium, isModeLimited, dailyUsage],
  );

  const canPlayMode = useCallback(
    (mode: GameMode): boolean => {
      return getRemainingExercises(mode) > 0;
    },
    [getRemainingExercises],
  );

  const recordExercise = useCallback(
    (mode: GameMode): DailyUsage => {
      if (isPremium || !isModeLimited(mode)) {
        return dailyUsage;
      }
      const today = getToday();
      const current =
        dailyUsage.date === today ? dailyUsage : freshDailyUsage();
      const updated: DailyUsage = {
        date: today,
        counts: {
          ...current.counts,
          [mode]: (current.counts[mode] || 0) + 1,
        },
      };
      setDailyUsage(updated);
      return updated;
    },
    [isPremium, isModeLimited, dailyUsage],
  );

  const upgradeToPremium = useCallback(() => {
    setIsPremium(true);
    setPurchaseDate(new Date().toISOString());
  }, []);

  const getPremiumData = useCallback(
    (): PremiumData => ({
      isPremium,
      purchaseDate,
      dailyUsage,
    }),
    [isPremium, purchaseDate, dailyUsage],
  );

  return {
    isPremium,
    dailyUsage,
    loadPremiumData,
    isModeLimited,
    getRemainingExercises,
    canPlayMode,
    recordExercise,
    upgradeToPremium,
    getPremiumData,
  };
}
