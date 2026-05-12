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
  // Training-wheel hint: when true and the pool empties unfairly, the
  // baskets with too many items turn red so the child sees what to fix.
  // Off on harder levels so the child has to figure it out from voice alone.
  showOverflowHint?: boolean;
  // Fires once the pool empties and every basket has the same count.
  onMatch?: () => void;
  // Fires when the pool empties but the split is unfair, so the parent can
  // play the "make it fair" voice cue.
  onUnfair?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Density = 'roomy' | 'compact' | 'tiny';

function Basket({
  animalEmoji,
  foodEmoji,
  count,
  target,
  poolEmpty,
  showOverflowHint,
  density,
  onAdd,
  onRemove,
  colors,
}: {
  animalEmoji: string;
  foodEmoji: string;
  count: number;
  target: number;
  poolEmpty: boolean;
  showOverflowHint: boolean;
  // roomy = 2 baskets, compact = 3, tiny = 4+ (stacks the animal over the
  // + button vertically so each card stays narrow enough to fit on one row).
  density: Density;
  onAdd: () => void;
  onRemove: () => void;
  colors: ThemeColors;
}) {
  const compact = density !== 'roomy';
  const tiny = density === 'tiny';
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.06, {duration: 120}),
      withSpring(1, {damping: 5, stiffness: 200}),
    );
  }, [count, scale]);
  const style = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  const filled = Math.max(0, Math.min(10, count));
  // Three visual states once the pool empties: correct (green); too many
  // with overflow hint on (red — "this one has too much, remove some");
  // otherwise amber. Baskets with too few stay amber so the child reads
  // them as "still hungry" rather than "wrong".
  let borderColor = '#F59E0B';
  let bgColor = 'rgba(245,158,11,0.18)';
  if (poolEmpty) {
    if (count === target) {
      borderColor = '#22C55E';
      bgColor = 'rgba(34,197,94,0.22)';
    } else if (showOverflowHint && count > target) {
      borderColor = '#EF4444';
      bgColor = 'rgba(239,68,68,0.22)';
    }
  }
  return (
    <View style={styles.basketWrap}>
      <Animated.View
        style={[
          styles.basket,
          style,
          {borderColor, backgroundColor: bgColor},
        ]}>
        {/* Add (＋) sits with the animal at the top. At "tiny" density (4+
            baskets) it stacks underneath the animal so each card is narrow
            enough to fit on one row. */}
        <View style={[styles.basketHeader, tiny && styles.basketHeaderTiny]}>
          <Text
            style={[
              styles.animal,
              compact && styles.animalCompact,
              tiny && styles.animalTiny,
            ]}>
            <Emoji>{animalEmoji}</Emoji>
          </Text>
          {!poolEmpty && (
            <Pressable
              onPress={onAdd}
              style={({pressed}) => [
                styles.ctrlBtn,
                compact && styles.ctrlBtnCompact,
                tiny && styles.ctrlBtnTiny,
                styles.addBtn,
                {opacity: pressed ? 0.7 : 1},
              ]}>
              <Text
                style={[
                  styles.ctrlBtnText,
                  compact && styles.ctrlBtnTextCompact,
                  tiny && styles.ctrlBtnTextTiny,
                ]}>
                ＋
              </Text>
            </Pressable>
          )}
        </View>
        <View style={[styles.basketContents, tiny && styles.basketContentsTiny]}>
          {Array.from({length: filled}).map((_, i) => (
            <Text
              key={i}
              style={[
                styles.basketFood,
                compact && styles.basketFoodCompact,
                tiny && styles.basketFoodTiny,
              ]}>
              <Emoji>{foodEmoji}</Emoji>
            </Text>
          ))}
        </View>
        <Text
          style={[
            styles.basketCount,
            compact && styles.basketCountCompact,
            tiny && styles.basketCountTiny,
          ]}>
          {filled}
        </Text>
      </Animated.View>
      {/* Remove (−) lives BELOW the basket so add and remove read as
          distinct gestures (give above, take below). Hidden when empty. */}
      {count > 0 ? (
        <Pressable
          onPress={onRemove}
          style={({pressed}) => [
            styles.ctrlBtn,
            compact && styles.ctrlBtnCompact,
            tiny && styles.ctrlBtnTiny,
            styles.removeBtnBelow,
            {opacity: pressed ? 0.7 : 1},
          ]}>
          <Text
            style={[
              styles.ctrlBtnText,
              compact && styles.ctrlBtnTextCompact,
              tiny && styles.ctrlBtnTextTiny,
            ]}>
            −
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.removeBtnSpacer,
            compact && styles.removeBtnSpacerCompact,
            tiny && styles.removeBtnSpacerTiny,
          ]}
        />
      )}
    </View>
  );
}

export function FarmShareMode({
  problem,
  foodEmoji,
  animalEmoji,
  colors,
  tokenImage,
  ageGroup = 'young',
  showOverflowHint = false,
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

  // Derived values — safe to compute even when `problem` is null so all hooks
  // below run in the same order on every render (React's hooks rules).
  const distributed = baskets.reduce((a, b) => a + b, 0);
  const remaining = problem ? Math.max(0, problem.total - distributed) : 0;

  // Auto-validate when pool empties. Equal split = onMatch; otherwise nudge.
  useEffect(() => {
    if (!problem) return;
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

  if (!problem) return null;

  // Pool ten-frame cells: first `remaining` are 'filled' (so the cell falls
  // through to rendering the food emoji we pass below, instead of the
  // theme's color1 marble like the red dot).
  const cells: CellState[] = Array(10)
    .fill('empty')
    .map((_, i) => (i < remaining ? 'filled' : 'empty')) as CellState[];

  const addTo = (i: number) => {
    if (remaining <= 0) return;
    setBaskets(prev => prev.map((c, j) => (j === i ? c + 1 : c)));
  };
  const removeFrom = (i: number) => {
    setBaskets(prev => prev.map((c, j) => (j === i && c > 0 ? c - 1 : c)));
  };
  // Tap on a food cell in the ten frame: route it to the basket with the
  // fewest items so the child can blast through with one-finger taps.
  const sendToBalancedBasket = () => {
    if (remaining <= 0) return;
    setBaskets(prev => {
      const minVal = Math.min(...prev);
      const target = prev.indexOf(minVal);
      return prev.map((c, j) => (j === target ? c + 1 : c));
    });
  };

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
        onCellClick={(i) => {
          // Only food cells respond — empty cells (already shared) do nothing.
          if (cells[i] === 'filled') sendToBalancedBasket();
        }}
        colors={colors}
        emoji={foodEmoji}
        ageGroup={ageGroup}
      />

      {/* Arrow cue between pool and baskets */}
      <Text style={styles.arrow}>↓</Text>

      {/* Baskets — tap to add one from pool, tap a food item to take back */}
      <View style={styles.basketsRow}>
        {baskets.map((count, i) => {
          const density: Density =
            baskets.length >= 4 ? 'tiny' : baskets.length === 3 ? 'compact' : 'roomy';
          return (
            <Basket
              key={i}
              animalEmoji={animalEmoji}
              foodEmoji={foodEmoji}
              count={count}
              target={problem.target}
              poolEmpty={remaining <= 0}
              showOverflowHint={showOverflowHint}
              density={density}
              onAdd={() => addTo(i)}
              onRemove={() => removeFrom(i)}
              colors={colors}
            />
          );
        })}
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
    gap: 6,
    justifyContent: 'center',
    alignItems: 'flex-start',
    // No wrap — for 3+ baskets the basket width shrinks via minWidth=0
    // below so they always sit on one row.
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  basketWrap: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  basket: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  basketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  basketHeaderTiny: {
    // Stack vertically when 4+ baskets so the card stays narrow.
    flexDirection: 'column',
    gap: 2,
  },
  animal: {
    fontSize: 38,
  },
  animalCompact: {
    fontSize: 26,
  },
  animalTiny: {
    fontSize: 22,
  },
  ctrlBtn: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  ctrlBtnCompact: {
    width: 32,
    height: 28,
    borderRadius: 9,
  },
  ctrlBtnTiny: {
    width: 28,
    height: 24,
    borderRadius: 8,
  },
  addBtn: {
    backgroundColor: '#22C55E',
  },
  removeBtnBelow: {
    backgroundColor: '#EF4444',
    marginTop: 2,
  },
  removeBtnSpacer: {
    height: 36,
    marginTop: 2,
  },
  removeBtnSpacerCompact: {
    height: 28,
  },
  removeBtnSpacerTiny: {
    height: 24,
  },
  ctrlBtnText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 30,
    includeFontPadding: false,
  },
  ctrlBtnTextCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  ctrlBtnTextTiny: {
    fontSize: 15,
    lineHeight: 18,
  },
  basketContents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 28,
    alignItems: 'center',
    gap: 2,
    maxWidth: 90,
  },
  basketFood: {
    fontSize: 22,
  },
  basketFoodCompact: {
    fontSize: 16,
  },
  basketFoodTiny: {
    fontSize: 14,
  },
  basketContentsTiny: {
    maxWidth: 56,
    minHeight: 22,
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
  basketCountCompact: {
    fontSize: 18,
  },
  basketCountTiny: {
    fontSize: 15,
  },
});
