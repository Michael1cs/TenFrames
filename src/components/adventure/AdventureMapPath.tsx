import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {
  AdventureWorld,
  AdventureProgress,
  ThemeColors,
} from '../../types/game';
import {MapNode} from './MapNode';
import {useLayout} from '../../hooks/useLayout';

interface AdventureMapPathProps {
  world: AdventureWorld;
  progress: AdventureProgress;
  colors: ThemeColors;
  onLevelPress: (levelId: string) => void;
}

const COLS = 3; // nodes per row

export function AdventureMapPath({
  world,
  progress,
  colors,
  onLevelPress,
}: AdventureMapPathProps) {
  const {isTablet} = useLayout();
  const nodeSize = isTablet ? 76 : 60;
  const gap = isTablet ? 20 : 14;
  const worldProgress = progress.worlds[world.id];

  // Find the next playable (unlocked + not completed) level
  const nextPlayableId = world.levels.find(l => {
    const lp = worldProgress?.levels[l.id];
    return lp?.unlocked && !lp?.completed;
  })?.id;

  // Group levels into rows of COLS, alternating direction (S-curve)
  const rows: typeof world.levels[] = [];
  for (let i = 0; i < world.levels.length; i += COLS) {
    rows.push(world.levels.slice(i, i + COLS));
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {rows.map((row, rowIndex) => {
        // Reverse every other row for S-curve
        const isReversed = rowIndex % 2 === 1;
        const orderedRow = isReversed ? [...row].reverse() : row;

        return (
          <View key={rowIndex}>
            <View
              style={[
                styles.row,
                {gap},
              ]}>
              {orderedRow.map(level => {
                const lp = worldProgress?.levels[level.id] ?? {
                  unlocked: false,
                  completed: false,
                  stars: 0,
                  bestFirstTry: 0,
                  attempts: 0,
                };
                const isCurrent = level.id === nextPlayableId;

                return (
                  <View key={level.id} style={{width: nodeSize, alignItems: 'center'}}>
                    <MapNode
                      level={level}
                      levelProgress={lp}
                      isCurrent={isCurrent}
                      colors={colors}
                      nodeSize={nodeSize}
                      onPress={() => onLevelPress(level.id)}
                    />
                  </View>
                );
              })}
            </View>

            {/* Connector line between rows */}
            {rowIndex < rows.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    alignSelf: isReversed ? 'flex-start' : 'flex-end',
                    marginHorizontal: nodeSize / 2 + gap,
                    borderColor: getConnectorColor(
                      row,
                      rows[rowIndex + 1],
                      worldProgress,
                      colors,
                    ),
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

function getConnectorColor(
  currentRow: any[],
  _nextRow: any[],
  worldProgress: any,
  colors: ThemeColors,
): string {
  // Check if last level in current row is completed
  const lastLevel = currentRow[currentRow.length - 1];
  const lp = worldProgress?.levels[lastLevel?.id];
  if (lp?.completed) {
    return colors.primaryButton;
  }
  return 'rgba(255,255,255,0.2)';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  connector: {
    width: 3,
    height: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
