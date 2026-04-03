import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {
  AdventureWorld,
  AdventureProgress,
  ThemeColors,
} from '../../types/game';
import {MapNode} from './MapNode';
import {WorldProgressBar} from './WorldProgressBar';
import {useLayout} from '../../hooks/useLayout';
import {getWorldStars, getWorldMaxStars} from '../../config/adventureWorlds';

interface AdventureMapPathProps {
  world: AdventureWorld;
  progress: AdventureProgress;
  colors: ThemeColors;
  onLevelPress: (levelId: string) => void;
}

const COLS = 3;

export function AdventureMapPath({
  world,
  progress,
  colors,
  onLevelPress,
}: AdventureMapPathProps) {
  const {isTablet} = useLayout();
  const nodeSize = isTablet ? 76 : 60;
  const gap = isTablet ? 24 : 16;
  const worldProgress = progress.worlds[world.id];
  const scrollRef = useRef<ScrollView>(null);

  // Find the next playable level
  const nextPlayableIndex = world.levels.findIndex(l => {
    const lp = worldProgress?.levels[l.id];
    return lp?.unlocked && !lp?.completed;
  });
  const nextPlayableId = nextPlayableIndex >= 0
    ? world.levels[nextPlayableIndex]?.id
    : undefined;

  // Auto-scroll to current level
  useEffect(() => {
    if (nextPlayableIndex >= 0 && scrollRef.current) {
      const row = Math.floor(nextPlayableIndex / COLS);
      const rowHeight = nodeSize + 70 + 28; // node + stars + connector
      const scrollY = Math.max(0, row * rowHeight - 100);
      setTimeout(() => {
        scrollRef.current?.scrollTo({y: scrollY, animated: true});
      }, 500); // delay for entrance animations
    }
  }, [nextPlayableIndex, nodeSize]);

  // Group levels into rows
  const rows: typeof world.levels[] = [];
  for (let i = 0; i < world.levels.length; i += COLS) {
    rows.push(world.levels.slice(i, i + COLS));
  }

  const worldStars = getWorldStars(world.id, progress);
  const maxStars = getWorldMaxStars(world.id);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Progress bar */}
      <WorldProgressBar
        stars={worldStars}
        maxStars={maxStars}
        colors={colors}
      />

      {rows.map((row, rowIndex) => {
        const isReversed = rowIndex % 2 === 1;
        const orderedRow = isReversed ? [...row].reverse() : row;

        return (
          <View key={rowIndex}>
            <View style={[styles.row, {gap}]}>
              {orderedRow.map(level => {
                const globalIndex = world.levels.indexOf(level);
                const lp = worldProgress?.levels[level.id] ?? {
                  unlocked: false,
                  completed: false,
                  stars: 0,
                  bestFirstTry: 0,
                  attempts: 0,
                };
                const isCurrent = level.id === nextPlayableId;

                return (
                  <View key={level.id} style={{width: nodeSize + 16, alignItems: 'center'}}>
                    <MapNode
                      level={level}
                      levelProgress={lp}
                      isCurrent={isCurrent}
                      colors={colors}
                      nodeSize={nodeSize}
                      index={globalIndex}
                      onPress={() => onLevelPress(level.id)}
                    />
                  </View>
                );
              })}
            </View>

            {/* Connector between rows */}
            {rowIndex < rows.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    alignSelf: isReversed ? 'flex-start' : 'flex-end',
                    marginHorizontal: nodeSize / 2 + gap + 8,
                    backgroundColor: isRowCompleted(row, worldProgress)
                      ? colors.primaryButton
                      : 'rgba(255,255,255,0.15)',
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function isRowCompleted(row: any[], worldProgress: any): boolean {
  return row.every(level => worldProgress?.levels[level.id]?.completed);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
    alignItems: 'center',
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  connector: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
});
