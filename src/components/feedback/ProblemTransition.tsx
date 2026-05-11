import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {ThemeColors} from '../../types/game';

interface ProblemTransitionProps {
  // Increments on each problem change. Used to retrigger the animation.
  trigger: number;
  current: number;
  total: number;
  colors: ThemeColors;
}

// Brief celebratory badge that flashes in the middle of the screen when the
// problem index advances. Patterned after Splash Math / Khan Academy Kids
// where a card with "Question N of M" slides in between problems so the
// child has an unambiguous beat between attempts. Skipped on the very first
// problem of a level (trigger === 0) since the level itself is the entry.
export function ProblemTransition({
  trigger,
  current,
  total,
  colors,
}: ProblemTransitionProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0) return;
    scale.value = 0;
    opacity.value = 0;
    // Pop in fast, hold briefly, fade out.
    scale.value = withSequence(
      withSpring(1, {damping: 7, stiffness: 200}),
      withDelay(550, withTiming(0.8, {duration: 250})),
    );
    opacity.value = withSequence(
      withTiming(1, {duration: 160}),
      withDelay(550, withTiming(0, {duration: 250})),
    );
  }, [trigger, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.card,
          style,
          {backgroundColor: colors.accent, borderColor: '#FFFFFF'},
        ]}>
        <Text style={styles.bigNum}>{current}</Text>
        <Text style={styles.smallTotal}>/ {total}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  card: {
    minWidth: 140,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 22,
    borderWidth: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  bigNum: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 76,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 3,
  },
  smallTotal: {
    fontSize: 36,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 40,
    includeFontPadding: false,
  },
});
