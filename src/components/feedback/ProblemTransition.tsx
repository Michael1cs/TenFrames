import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface ProblemTransitionProps {
  // Increments on each problem change. Used to retrigger the animation.
  trigger: number;
  current: number;
  total: number;
  colors: ThemeColors;
}

const CONFETTI = ['⭐', '✨', '🌟', '🎉', '💫'];

function ConfettiDrop({
  emoji,
  left,
  delay,
  trigger,
}: {
  emoji: string;
  left: string;
  delay: number;
  trigger: number;
}) {
  const ty = useSharedValue(-60);
  const op = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0) return;
    ty.value = -60;
    op.value = 0;
    rot.value = 0;
    ty.value = withDelay(
      delay,
      withTiming(280, {duration: 1100, easing: Easing.in(Easing.quad)}),
    );
    op.value = withDelay(
      delay,
      withSequence(
        withTiming(1, {duration: 120}),
        withDelay(700, withTiming(0, {duration: 250})),
      ),
    );
    rot.value = withDelay(delay, withTiming(360, {duration: 1100}));
  }, [trigger, delay, ty, op, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{translateY: ty.value}, {rotate: `${rot.value}deg`}],
    opacity: op.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.confettiDrop, {left: left as any}, style]}>
      <Text style={styles.confettiText}>
        <Emoji>{emoji}</Emoji>
      </Text>
    </Animated.View>
  );
}

// Splash Math / Khan Academy Kids pattern: when problemIndex advances, show
// a clear "between" beat — confetti falls from the top while a big centered
// card announces the new problem number. Total dwell ~1.3s so the child
// unambiguously registers a fresh attempt is starting.
export function ProblemTransition({
  trigger,
  current,
  total,
  colors,
}: ProblemTransitionProps) {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0) return;
    setVisible(true);
    scale.value = 0;
    opacity.value = 0;
    scale.value = withSequence(
      withSpring(1, {damping: 8, stiffness: 180}),
      withDelay(900, withTiming(0.9, {duration: 250})),
    );
    opacity.value = withSequence(
      withTiming(1, {duration: 200}),
      withDelay(950, withTiming(0, {duration: 250})),
    );
    // Hide pointer events / View after animation completes.
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, [trigger, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {CONFETTI.map((emoji, i) => (
        <ConfettiDrop
          key={`${trigger}-${i}`}
          emoji={emoji}
          left={`${12 + i * 18}%`}
          delay={i * 80}
          trigger={trigger}
        />
      ))}

      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {backgroundColor: colors.accent, borderColor: '#FFFFFF'},
        ]}>
        <Text style={styles.label}>
          {t('adventure.problemBadge', {defaultValue: 'Round'})}
        </Text>
        <View style={styles.numRow}>
          <Text style={styles.bigNum}>{current}</Text>
          <Text style={styles.smallTotal}> / {total}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  confettiDrop: {
    position: 'absolute',
    top: 0,
  },
  confettiText: {
    fontSize: 30,
  },
  card: {
    minWidth: 200,
    paddingHorizontal: 36,
    paddingVertical: 22,
    borderRadius: 26,
    borderWidth: 5,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNum: {
    fontSize: 82,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 86,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  smallTotal: {
    fontSize: 40,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 44,
    includeFontPadding: false,
  },
});
