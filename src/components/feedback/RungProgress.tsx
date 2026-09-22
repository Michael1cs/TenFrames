import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Mascot} from '../common/Mascot';
import {ThemeColors} from '../../types/game';

export const STREAK_TO_CLIMB = 3;

// How many stars stand for a rung. Short ladders (four rungs) show one star
// per rung; the eleven-rung ones are folded onto five so a pre-reader still
// reads "more stars than before" without counting to eleven.
export function rungStars(level: number, cap: number): number {
  const stars = Math.min(5, cap);
  return Math.max(1, Math.ceil((level / cap) * stars));
}

interface RungProgressProps {
  streak: number; // correct in a row at this rung
  level: number;
  cap: number;
  colors: ThemeColors;
}

// The child's climb, made visible: three bubbles that fill with each correct
// answer in a row, and the rung itself as a row of stars. The ladder existed
// before this — it was just never shown, so a child worked their way up and
// saw nothing. When the rung changes the mascot jumps in for a moment.
export function RungProgress({streak, level, cap, colors}: RungProgressProps) {
  const prevLevel = useRef(level);
  const [cheer, setCheer] = useState(false);
  const pop = useSharedValue(0);
  useEffect(() => {
    if (level > prevLevel.current) {
      setCheer(true);
      pop.value = withSequence(withSpring(1, {damping: 9}), withTiming(1));
      const t = setTimeout(() => {
        pop.value = withTiming(0, {duration: 250});
        setTimeout(() => setCheer(false), 260);
      }, 1800);
      prevLevel.current = level;
      return () => clearTimeout(t);
    }
    prevLevel.current = level;
  }, [level, pop]);
  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{scale: 0.6 + 0.4 * pop.value}],
  }));

  const stars = rungStars(level, cap);
  const maxStars = Math.min(5, cap);
  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({length: maxStars}, (_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              i < stars
                ? {backgroundColor: '#FBBF24', borderColor: '#F59E0B'}
                : styles.starEmpty,
            ]}
          />
        ))}
      </View>
      <View style={styles.bubbles}>
        {Array.from({length: STREAK_TO_CLIMB}, (_, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              i < streak
                ? {backgroundColor: colors.accent, borderColor: '#FFFFFF'}
                : styles.bubbleEmpty,
            ]}
          />
        ))}
      </View>
      {cheer && (
        <Animated.View style={[styles.cheer, popStyle]} pointerEvents="none">
          <Mascot pose="jump" height={64} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  stars: {flexDirection: 'row', gap: 4},
  star: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  starEmpty: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  bubbles: {flexDirection: 'row', gap: 6},
  bubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  bubbleEmpty: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cheer: {
    position: 'absolute',
    right: 8,
    top: -40,
  },
});
