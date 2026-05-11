import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, ImageSourcePropType} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {TenFrame} from './TenFrame';
import {AgeGroup, CellState, Problem, ThemeColors} from '../../types/game';

interface DivideModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  currentProblem: Problem | null;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
  // Fires once child has split the total into two non-empty groups and lets
  // the state settle. Parent then advances to the next problem.
  onMatch?: () => void;
}

// 4-6 year olds don't read math notation (=, +). Mechanic is exploratory:
// child sees the total at top, taps cells to flip them between the two
// colors, and the two arrows-and-counters track each group in real time.
// Any non-empty split is valid — the screen auto-advances after the child
// stops tapping for a moment (i.e., they've decided on a split).
export function DivideMode({
  cells,
  onCellClick,
  currentProblem,
  colors,
  emoji,
  tokenImage,
  ageGroup = 'young',
  onMatch,
}: DivideModeProps) {
  const color1Count = cells.filter(c => c === 'color1').length;
  const color2Count = cells.filter(c => c === 'color2').length;
  const total = currentProblem?.answer ?? 0;

  // Wiggle the total when problem changes so the eye is drawn to it.
  const totalScale = useSharedValue(1);
  useEffect(() => {
    if (!currentProblem) return;
    totalScale.value = withSequence(
      withTiming(1.2, {duration: 220}),
      withSpring(1, {damping: 4, stiffness: 200}),
    );
  }, [currentProblem, totalScale]);
  const totalStyle = useAnimatedStyle(() => ({
    transform: [{scale: totalScale.value}],
  }));

  // Settle timer: once child has made a valid split (both groups > 0), wait
  // ~1.5s of no tapping before advancing. Resets on every tap.
  const matchedRef = useRef(false);
  const onMatchRef = useRef(onMatch);
  onMatchRef.current = onMatch;
  useEffect(() => {
    matchedRef.current = false;
  }, [currentProblem]);
  useEffect(() => {
    if (!currentProblem || matchedRef.current) return;
    if (color1Count === 0 || color2Count === 0) return;
    const timer = setTimeout(() => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      onMatchRef.current?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [color1Count, color2Count, currentProblem]);

  if (!currentProblem) return null;

  return (
    <View style={styles.container}>
      {/* Tap hint above the total — visual cue that the child should
          interact with the cells. Disappears once both groups are populated. */}
      <View style={styles.hintRow}>
        <Text style={styles.hintEmoji}>👆</Text>
        <Text style={styles.hintText}>?</Text>
        <Text style={styles.hintEmoji}>👆</Text>
      </View>

      {/* Big total at top */}
      <Animated.View
        style={[
          styles.totalBox,
          totalStyle,
          {backgroundColor: colors.accent, borderColor: '#FFFFFF'},
        ]}>
        <Text style={styles.totalText}>{total}</Text>
      </Animated.View>

      {/* Two arrows + counters */}
      <View style={styles.splitRow}>
        <View style={styles.armLeft}>
          <Text style={styles.arrow}>↙</Text>
          <View
            style={[
              styles.counter,
              {
                backgroundColor: colors.cellColor1,
                borderColor: colors.cellColor1Border,
              },
            ]}>
            <Text style={styles.counterText}>{color1Count}</Text>
          </View>
        </View>
        <View style={styles.armRight}>
          <Text style={styles.arrow}>↘</Text>
          <View
            style={[
              styles.counter,
              {
                backgroundColor: colors.cellColor2,
                borderColor: colors.cellColor2Border,
              },
            ]}>
            <Text style={styles.counterText}>{color2Count}</Text>
          </View>
        </View>
      </View>

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
        ageGroup={ageGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintEmoji: {
    fontSize: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  hintText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  totalBox: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  totalText: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 64,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 60,
    marginVertical: 2,
  },
  armLeft: {
    alignItems: 'center',
    gap: 2,
  },
  armRight: {
    alignItems: 'center',
    gap: 2,
  },
  arrow: {
    fontSize: 40,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  counter: {
    minWidth: 68,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
