import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Pressable, StyleSheet, ImageSourcePropType} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Emoji} from '../common/Emoji';
import {TenFrame} from './TenFrame';
import {ShareProblem} from '../../utils/mathProblems';
import {AgeGroup, CellState, ThemeColors} from '../../types/game';

interface FarmShareModeProps {
  problem: ShareProblem | null;
  // Per-problem cosmetics — chosen by the parent so the world theme drives
  // which food + animal combos appear.
  foodEmoji: string;
  animalEmoji: string;
  colors: ThemeColors;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
  // Fires once the pool empties and every basket has the same count.
  onMatch?: () => void;
  // Fires when the pool empties but the split is unfair, so the parent can
  // play the "make it fair" voice cue.
  onUnfair?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Basket({
  animalEmoji,
  foodEmoji,
  count,
  active,
  onTap,
  onRemove,
  colors,
}: {
  animalEmoji: string;
  foodEmoji: string;
  count: number;
  active: boolean;
  onTap: () => void;
  onRemove: () => void;
  colors: ThemeColors;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.06, {duration: 120}),
      withSpring(1, {damping: 5, stiffness: 200}),
    );
  }, [count, scale]);
  const style = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  // Render food in a small horizontal row, wrapping if more than 5 items.
  const filled = Math.max(0, Math.min(10, count));
  return (
    <Pressable onPress={onTap} style={({pressed}) => [{opacity: pressed ? 0.85 : 1}]}>
      <Animated.View
        style={[
          styles.basket,
          style,
          {
            borderColor: active ? '#F59E0B' : colors.cellEmptyBorder,
            backgroundColor: active
              ? 'rgba(245,158,11,0.18)'
              : 'rgba(255,255,255,0.12)',
          },
        ]}>
        <Text style={styles.animal}>
          <Emoji>{animalEmoji}</Emoji>
        </Text>
        <View style={styles.basketContents}>
          {Array.from({length: filled}).map((_, i) => (
            <Pressable key={i} onPress={onRemove} hitSlop={6}>
              <Text style={styles.basketFood}>
                <Emoji>{foodEmoji}</Emoji>
              </Text>
            </Pressable>
          ))}
          {filled === 0 && (
            <Text style={styles.basketEmpty}>＋</Text>
          )}
        </View>
        <Text style={styles.basketCount}>{filled}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function FarmShareMode({
  problem,
  foodEmoji,
  animalEmoji,
  colors,
  tokenImage,
  ageGroup = 'young',
  onMatch,
  onUnfair,
}: FarmShareModeProps) {
  const [baskets, setBaskets] = useState<number[]>([]);
  const matchedRef = useRef(false);
  const onMatchRef = useRef(onMatch);
  const onUnfairRef = useRef(onUnfair);
  onMatchRef.current = onMatch;
  onUnfairRef.current = onUnfair;

  // Reset whenever the problem changes.
  useEffect(() => {
    if (!problem) return;
    setBaskets(Array(problem.buckets).fill(0));
    matchedRef.current = false;
  }, [problem]);

  if (!problem) return null;

  const distributed = baskets.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, problem.total - distributed);

  // Pool ten-frame cells: first `remaining` are color1, rest empty.
  const cells: CellState[] = Array(10)
    .fill('empty')
    .map((_, i) => (i < remaining ? 'color1' : 'empty')) as CellState[];

  const addTo = (i: number) => {
    if (remaining <= 0) return;
    setBaskets(prev => prev.map((c, j) => (j === i ? c + 1 : c)));
  };
  const removeFrom = (i: number) => {
    setBaskets(prev => prev.map((c, j) => (j === i && c > 0 ? c - 1 : c)));
  };

  // Auto-validate when pool empties. Equal split = onMatch; otherwise nudge.
  useEffect(() => {
    if (remaining > 0 || matchedRef.current) return;
    if (distributed !== problem.total) return; // nothing distributed yet
    const equal = baskets.every(c => c === problem.target);
    if (equal) {
      matchedRef.current = true;
      const t = setTimeout(() => onMatchRef.current?.(), 900);
      return () => clearTimeout(t);
    } else {
      onUnfairRef.current?.();
    }
  }, [remaining, distributed, baskets, problem]);

  return (
    <View style={styles.container}>
      {/* Pool — remaining food shown in ten frame */}
      <View style={styles.poolLabel}>
        <Text style={styles.poolEmoji}>
          <Emoji>{foodEmoji}</Emoji>
        </Text>
        <Text style={styles.poolText}>×{remaining}</Text>
      </View>
      <TenFrame
        cells={cells}
        onCellClick={() => {}}
        disabled
        colors={colors}
        emoji={foodEmoji}
        tokenImage={tokenImage}
        ageGroup={ageGroup}
      />

      {/* Arrow cue between pool and baskets */}
      <Text style={styles.arrow}>↓</Text>

      {/* Baskets — tap to add one from pool, tap a food item to take back */}
      <View style={styles.basketsRow}>
        {baskets.map((count, i) => (
          <Basket
            key={i}
            animalEmoji={animalEmoji}
            foodEmoji={foodEmoji}
            count={count}
            active={remaining > 0}
            onTap={() => addTo(i)}
            onRemove={() => removeFrom(i)}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  poolLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
  },
  poolEmoji: {
    fontSize: 28,
  },
  poolText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  arrow: {
    fontSize: 30,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  basketsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 380,
  },
  basket: {
    minWidth: 110,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    gap: 4,
  },
  animal: {
    fontSize: 38,
  },
  basketContents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 32,
    alignItems: 'center',
    gap: 2,
    maxWidth: 100,
  },
  basketFood: {
    fontSize: 22,
  },
  basketEmpty: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  basketCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
