import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {useReduceMotion} from '../../hooks/useReduceMotion';
import {ThemeColors} from '../../types/game';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface ConfettiPieceProps {
  index: number;
  palette: string[];
}

// One cohesive burst, not a drizzle: pieces spawn together (0-350ms), fall
// through the play area only (never over the bottom bar), and are gone in
// under two seconds. Colors come from the active theme so the confetti
// belongs to the scene instead of sitting on top of it.
function ConfettiPiece({index, palette}: ConfettiPieceProps) {
  const {width, height} = useWindowDimensions();
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const color = palette[index % palette.length];
  const config = useMemo(
    () => ({
      // Central band of the screen, clear of the edges.
      startX: width * (0.18 + Math.random() * 0.64),
      size: 6 + Math.random() * 5,
      delay: Math.random() * 350,
      duration: 1400 + Math.random() * 500,
      drift: (Math.random() - 0.5) * 90,
      rotDir: Math.random() > 0.5 ? 1 : -1,
    }),
    [width],
  );

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withTiming(height * 0.62, {duration: config.duration}),
    );
    translateX.value = withDelay(
      config.delay,
      withTiming(config.drift, {duration: config.duration}),
    );
    rotate.value = withDelay(
      config.delay,
      withTiming(280 * config.rotDir, {duration: config.duration}),
    );
    opacity.value = withDelay(
      config.delay + 900,
      withTiming(0, {duration: 450}),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {translateX: translateX.value},
      {rotate: `${rotate.value}deg`},
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        // Rectangular chips tumble like real confetti; squares read as noise.
        {
          position: 'absolute',
          left: config.startX,
          top: 0,
          width: config.size,
          height: config.size * 0.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

interface CorrectAnimationProps {
  visible: boolean;
  colors: ThemeColors;
}

export function CorrectAnimation({visible, colors}: CorrectAnimationProps) {
  const reduceMotion = useReduceMotion();

  const palette = useMemo(
    () => [colors.cellColor1, colors.cellColor2, colors.accent, '#FFFFFF'],
    [colors],
  );

  if (!visible || reduceMotion) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({length: 14}).map((_, i) => (
        <ConfettiPiece key={i} index={i} palette={palette} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
});
