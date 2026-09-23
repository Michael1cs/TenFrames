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
import {Text} from '../common/AppText';
import {ThemeColors} from '../../types/game';

export const STREAK_TO_CLIMB = 3;

// One colour per rung, cycling — the bar comes back a new colour after every
// climb, so "I went up" is visible even between problems.
export const RUNG_COLORS = [
  '#4ADE80', // green
  '#38BDF8', // sky
  '#A78BFA', // violet
  '#F472B6', // pink
  '#FB923C', // orange
  '#FACC15', // yellow
  '#2DD4BF', // teal
  '#F87171', // red
  '#818CF8', // indigo
  '#A3E635', // lime
  '#E879F9', // fuchsia
];
export const rungColor = (level: number) =>
  RUNG_COLORS[(Math.max(1, level) - 1) % RUNG_COLORS.length];

interface RungProgressProps {
  streak: number; // correct in a row at this rung
  level: number;
  cap: number;
  colors: ThemeColors;
}

// The child's climb, made visible: a bar that fills with each correct answer
// in a row and a star holding the rung. Deliberately not dots — in a game
// about counting, a row of dots reads as a quantity (Mihai spotted it at
// once). The ladder existed before this; it was just never shown. When the
// rung changes the mascot jumps in for a moment.
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

  // Fill follows the streak with a spring, so a correct answer is seen as
  // the bar growing, not as a new mark to count.
  const fill = useSharedValue(streak / STREAK_TO_CLIMB);
  useEffect(() => {
    fill.value = withSpring(streak / STREAK_TO_CLIMB, {damping: 14});
  }, [streak, fill]);
  const tint = rungColor(level);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(fill.value * 100)}%`,
  }));

  return (
    <View style={styles.row}>
      <View style={[styles.track, {borderColor: tint}]}>
        <Animated.View style={[styles.fill, {backgroundColor: tint}, fillStyle]}>
          <View style={styles.gloss} />
        </Animated.View>
      </View>
      <View style={[styles.star, {backgroundColor: tint}]}>
        <Text style={styles.starText}>{level}</Text>
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
    gap: 8,
    paddingVertical: 4,
    width: 270,
    alignSelf: 'center',
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  // The rung: one star, the digit inside. Digits are what the child reads
  // everywhere else in the app, so this is not text to them.
  star: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    color: '#1E1B4B',
    fontSize: 16,
    fontWeight: '800',
  },
  cheer: {
    position: 'absolute',
    right: -50,
    top: -40,
  },
});
