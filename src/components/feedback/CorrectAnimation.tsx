import React, {useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import {Emoji} from '../common/Emoji';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

interface ConfettiPieceProps {
  index: number;
}

function ConfettiPiece({index}: ConfettiPieceProps) {
  const {width, height} = useWindowDimensions();
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const colors = ['#8B5CF6', '#6366F1', '#A855F7', '#F59E0B', '#EF4444', '#10B981'];
  const color = colors[index % colors.length];
  const config = useMemo(() => ({
    startX: Math.random() * width,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 800,
    duration: 1400 + Math.random() * 400,
    drift: (Math.random() - 0.5) * 100,
    rotDir: Math.random() > 0.5 ? 1 : -1,
    round: Math.random() > 0.5,
  }), [width]);

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withTiming(height + 50, {duration: config.duration}),
    );
    translateX.value = withDelay(
      config.delay,
      withTiming(config.drift, {duration: 1400}),
    );
    rotate.value = withDelay(
      config.delay,
      withTiming(360 * config.rotDir, {duration: 1400}),
    );
    opacity.value = withDelay(config.delay + 1100, withTiming(0, {duration: 300}));
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
        {
          position: 'absolute',
          left: config.startX,
          top: 0,
          width: config.size,
          height: config.size,
          backgroundColor: color,
          borderRadius: config.round ? config.size / 2 : 0,
        },
        style,
      ]}
    />
  );
}

interface CorrectAnimationProps {
  visible: boolean;
}

export function CorrectAnimation({visible}: CorrectAnimationProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {damping: 6, stiffness: 100});
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: scale.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({length: 20}).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
      <Animated.View style={[styles.emojiContainer, emojiStyle]}>
        <Text style={styles.emoji}><Emoji>🎉</Emoji></Text>
        <Text style={styles.text}><Emoji>🌟</Emoji></Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  text: {
    fontSize: 24,
    color: '#4ADE80',
    fontWeight: 'bold',
    marginTop: 8,
  },
});
