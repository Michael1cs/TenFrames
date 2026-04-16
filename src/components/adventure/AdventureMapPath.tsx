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

export function AdventureMapPath({
  world,
  progress,
  colors,
  onLevelPress,
}: AdventureMapPathProps) {
  const {isTablet, width: screenWidth} = useLayout();
  const nodeSize = isTablet ? 90 : 72;
  const worldProgress = progress.worlds[world.id];
  const scrollRef = useRef<ScrollView>(null);

  // Levels reversed so first level is at the bottom (climb up!)
  const levelsBottomUp = [...world.levels].reverse();

  // Find next playable level
  const nextPlayableId = world.levels.find(l => {
    const lp = worldProgress?.levels[l.id];
    return lp?.unlocked && !lp?.completed;
  })?.id;

  // Auto-scroll to current level (near bottom since reversed)
  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to bottom on mount (where level 1 is)
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      }, 400);
    }
  }, [world.id]);

  const worldStars = getWorldStars(world.id, progress);
  const maxStars = getWorldMaxStars(world.id);

  // Winding path: each node offset left/right in a wave pattern
  const getNodeX = (index: number): number => {
    const amplitude = isTablet ? 120 : 80;
    const centerX = (screenWidth - nodeSize) / 2;
    // Sine wave for S-curve
    const wave = Math.sin((index / (levelsBottomUp.length - 1)) * Math.PI * 2.5);
    return centerX + wave * amplitude;
  };

  const verticalSpacing = isTablet ? 130 : 110;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {paddingBottom: 60, paddingTop: 20},
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Progress bar at top */}
      <WorldProgressBar
        stars={worldStars}
        maxStars={maxStars}
        colors={colors}
      />

      {/* Path with nodes */}
      <View style={[styles.pathContainer, {height: levelsBottomUp.length * verticalSpacing + 40}]}>
        {levelsBottomUp.map((level, i) => {
          const lp = worldProgress?.levels[level.id] ?? {
            unlocked: false,
            completed: false,
            stars: 0,
            bestFirstTry: 0,
            attempts: 0,
          };
          const isCurrent = level.id === nextPlayableId;
          const nodeX = getNodeX(i);
          const nodeY = i * verticalSpacing;

          // Draw connector line to next node
          const hasNext = i < levelsBottomUp.length - 1;
          const nextX = hasNext ? getNodeX(i + 1) : nodeX;
          const isSegmentCompleted = lp?.completed;

          return (
            <React.Fragment key={level.id}>
              {/* Path dots between nodes */}
              {hasNext && (() => {
                const startX = nodeX + nodeSize / 2;
                const startY = nodeY + nodeSize / 2;
                const endX = nextX + nodeSize / 2;
                const endY = (i + 1) * verticalSpacing + nodeSize / 2;
                const dotCount = 4;
                const dotColor = isSegmentCompleted
                  ? colors.primaryButton
                  : 'rgba(255,255,255,0.25)';
                const dotSize = isSegmentCompleted ? 8 : 6;

                return Array.from({length: dotCount}).map((_, d) => {
                  const t = (d + 1) / (dotCount + 1);
                  const dx = startX + (endX - startX) * t;
                  const dy = startY + (endY - startY) * t;
                  return (
                    <View
                      key={`dot-${i}-${d}`}
                      style={{
                        position: 'absolute',
                        left: dx - dotSize / 2,
                        top: dy - dotSize / 2,
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: dotColor,
                        zIndex: 0,
                      }}
                    />
                  );
                });
              })()}

              {/* Node */}
              <View
                style={[
                  styles.nodeWrapper,
                  {
                    position: 'absolute',
                    left: nodeX,
                    top: nodeY,
                  },
                ]}>
                <MapNode
                  level={level}
                  levelProgress={lp}
                  isCurrent={isCurrent}
                  colors={colors}
                  nodeSize={nodeSize}
                  index={levelsBottomUp.length - 1 - i} // stagger from bottom
                  onPress={() => onLevelPress(level.id)}
                />
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  pathContainer: {
    width: '100%',
    position: 'relative',
  },
  nodeWrapper: {
    zIndex: 2,
  },
  connectorLine: {
    zIndex: 1,
    backgroundColor: 'transparent',
  },
});
