import {useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PlayerData, RewardData, PremiumData} from '../types/game';

const PLAYER_KEY = '@tenframes_player';
const REWARDS_KEY = '@tenframes_rewards';
const PREMIUM_KEY = '@tenframes_premium';

const defaultPlayerData: PlayerData = {
  name: '',
  theme: 'space',
  language: 'ro',
  highScore: 0,
  level: 1,
};

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

export function usePersistence() {
  const loadPlayerData = useCallback(async (): Promise<PlayerData> => {
    try {
      const data = await AsyncStorage.getItem(PLAYER_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {...defaultPlayerData, ...parsed};
      }
    } catch {
      // Return defaults on error
    }
    return defaultPlayerData;
  }, []);

  const savePlayerData = useCallback(
    async (data: Partial<PlayerData>) => {
      try {
        const existing = await loadPlayerData();
        const updated = {...existing, ...data};
        await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
      } catch {
        // Silently fail
      }
    },
    [loadPlayerData],
  );

  const loadRewardData = useCallback(async (): Promise<RewardData> => {
    try {
      const data = await AsyncStorage.getItem(REWARDS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {...defaultRewardData, ...parsed};
      }
    } catch {
      // Return defaults on error
    }
    return defaultRewardData;
  }, []);

  const saveRewardData = useCallback(async (data: RewardData) => {
    try {
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(data));
    } catch {
      // Silently fail
    }
  }, []);

  const loadPremiumData = useCallback(async (): Promise<PremiumData> => {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Return defaults on error
    }
    return {isPremium: false, dailyUsage: {date: '', counts: {}}};
  }, []);

  const savePremiumData = useCallback(async (data: PremiumData) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(data));
    } catch {
      // Silently fail
    }
  }, []);

  return {
    loadPlayerData,
    savePlayerData,
    loadRewardData,
    saveRewardData,
    loadPremiumData,
    savePremiumData,
  };
}
