import {useState, useCallback, useEffect, useRef} from 'react';
import {
  AdventureProgress,
  AdventureLevel,
  WorldId,
} from '../types/game';
import {
  ADVENTURE_WORLDS,
  getDefaultAdventureProgress,
  getWorldStars,
} from '../config/adventureWorlds';
import {usePersistence} from './usePersistence';

export interface LevelPlayState {
  level: AdventureLevel;
  problemIndex: number;
  problemCount: number;
  results: boolean[]; // true = correct first try for each problem
  finished: boolean;
}

export function useAdventure() {
  const [progress, setProgress] = useState<AdventureProgress>(
    getDefaultAdventureProgress,
  );
  const [activeLevel, setActiveLevel] = useState<LevelPlayState | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<WorldId>('counting-meadow');
  const [loaded, setLoaded] = useState(false);
  const {loadAdventureData, saveAdventureData} = usePersistence();
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Load on mount
  useEffect(() => {
    loadAdventureData().then(data => {
      // In debug mode, force unlock all worlds and levels on every load
      if (__DEV__) {
        const unlocked = JSON.parse(JSON.stringify(data)) as AdventureProgress;
        for (const worldId of Object.keys(unlocked.worlds) as WorldId[]) {
          unlocked.worlds[worldId].unlocked = true;
          for (const levelId of Object.keys(unlocked.worlds[worldId].levels)) {
            unlocked.worlds[worldId].levels[levelId].unlocked = true;
          }
        }
        setProgress(unlocked);
      } else {
        setProgress(data);
      }
      setSelectedWorld(data.currentWorld);
      setLoaded(true);
    });
  }, [loadAdventureData]);

  // Save whenever progress changes
  useEffect(() => {
    if (loaded) {
      saveAdventureData(progress);
    }
  }, [progress, loaded, saveAdventureData]);

  const isLevelUnlocked = useCallback(
    (level: AdventureLevel): boolean => {
      const worldProgress = progressRef.current.worlds[level.worldId];
      if (!worldProgress?.unlocked) return false;
      const levelProgress = worldProgress.levels[level.id];
      return levelProgress?.unlocked ?? false;
    },
    [],
  );

  const startLevel = useCallback((level: AdventureLevel) => {
    setActiveLevel({
      level,
      problemIndex: 0,
      problemCount: level.problemCount,
      results: [],
      finished: false,
    });
  }, []);

  const recordProblemResult = useCallback((wasFirstTry: boolean) => {
    setActiveLevel(prev => {
      if (!prev || prev.finished) return prev;
      const newResults = [...prev.results, wasFirstTry];
      const newIndex = prev.problemIndex + 1;
      const finished = newIndex >= prev.problemCount;
      return {
        ...prev,
        results: newResults,
        problemIndex: newIndex,
        finished,
      };
    });
  }, []);

  const calculateStars = useCallback((results: boolean[]): number => {
    const firstTryCount = results.filter(r => r).length;
    const total = results.length;
    if (firstTryCount === total) return 3;
    if (firstTryCount >= total - 1) return 2;
    return 1;
  }, []);

  const completeLevel = useCallback((): {
    stars: number;
    isNewBest: boolean;
  } => {
    if (!activeLevel?.finished) return {stars: 0, isNewBest: false};

    const {level, results} = activeLevel;
    const stars = calculateStars(results);
    const firstTryCount = results.filter(r => r).length;

    setProgress(prev => {
      const newProgress = JSON.parse(JSON.stringify(prev)) as AdventureProgress;
      const worldProgress = newProgress.worlds[level.worldId];

      // Update level progress
      const levelProgress = worldProgress.levels[level.id];
      levelProgress.completed = true;
      levelProgress.attempts += 1;
      const isNewBest = stars > levelProgress.stars;
      if (isNewBest) {
        levelProgress.stars = stars;
        levelProgress.bestFirstTry = firstTryCount;
      }

      // Unlock next levels
      const world = ADVENTURE_WORLDS.find(w => w.id === level.worldId);
      if (world) {
        for (const nextLevel of world.levels) {
          const nextLevelProgress = worldProgress.levels[nextLevel.id];
          if (nextLevelProgress.unlocked) continue;

          const cond = nextLevel.unlockCondition;
          if (
            cond.type === 'previous' &&
            cond.levelId === level.id
          ) {
            nextLevelProgress.unlocked = true;
          } else if (cond.type === 'stars') {
            const worldStarsNow = getWorldStars(cond.worldId, newProgress);
            if (worldStarsNow >= cond.count) {
              nextLevelProgress.unlocked = true;
            }
          }
        }
      }

      // Unlock next world if all non-bonus levels completed
      if (world) {
        const nonBonusLevels = world.levels.filter(l => !l.isBonus);
        const allComplete = nonBonusLevels.every(
          l => worldProgress.levels[l.id]?.completed,
        );
        if (allComplete) {
          const worldIndex = ADVENTURE_WORLDS.findIndex(
            w => w.id === level.worldId,
          );
          const nextWorld = ADVENTURE_WORLDS[worldIndex + 1];
          if (nextWorld) {
            const nextWorldProgress = newProgress.worlds[nextWorld.id];
            if (!nextWorldProgress.unlocked) {
              nextWorldProgress.unlocked = true;
              // Unlock first level of next world
              const firstLevel = nextWorld.levels.find(
                l => l.unlockCondition.type === 'first',
              );
              if (firstLevel && nextWorldProgress.levels[firstLevel.id]) {
                nextWorldProgress.levels[firstLevel.id].unlocked = true;
              }
            }
          }
        }
      }

      return newProgress;
    });

    const currentLevelProgress =
      progressRef.current.worlds[level.worldId]?.levels[level.id];
    const isNewBest = stars > (currentLevelProgress?.stars ?? 0);

    return {stars, isNewBest};
  }, [activeLevel, calculateStars]);

  const exitLevel = useCallback(() => {
    setActiveLevel(null);
  }, []);

  const getNextPlayableLevel = useCallback(
    (worldId: WorldId): AdventureLevel | null => {
      const world = ADVENTURE_WORLDS.find(w => w.id === worldId);
      if (!world) return null;
      const worldProgress = progressRef.current.worlds[worldId];
      if (!worldProgress?.unlocked) return null;

      for (const level of world.levels) {
        const lp = worldProgress.levels[level.id];
        if (lp?.unlocked && !lp?.completed) return level;
      }
      return null;
    },
    [],
  );

  return {
    progress,
    activeLevel,
    selectedWorld,
    setSelectedWorld,
    loaded,
    isLevelUnlocked,
    startLevel,
    recordProblemResult,
    completeLevel,
    exitLevel,
    getNextPlayableLevel,
    calculateStars,
  };
}
