import {useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PlayerData, Theme, Language} from '../types/game';

const STORAGE_KEY = '@tenframes_player';

const defaultPlayerData: PlayerData = {
  name: '',
  theme: 'space',
  language: 'ro',
  highScore: 0,
  level: 1,
};

export function usePersistence() {
  const loadPlayerData = useCallback(async (): Promise<PlayerData> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {...defaultPlayerData, ...parsed};
      }
    } catch {
      // Return defaults on error
    }
    return defaultPlayerData;
  }, []);

  const savePlayerData = useCallback(async (data: Partial<PlayerData>) => {
    try {
      const existing = await loadPlayerData();
      const updated = {...existing, ...data};
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail
    }
  }, [loadPlayerData]);

  return {loadPlayerData, savePlayerData};
}
