import React, {useEffect} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {BackgroundEmoji as BackgroundEmojiType} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface FloatingEmojiProps {
  config: BackgroundEmojiType;
}

function FloatingEmoji({config}: FloatingEmojiProps) {
  const {width, height} = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(-20, {duration: 3000, easing: Easing.inOut(Easing.ease)}),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  return (
    <Animated.View
      style={[
        styles.emoji,
        animStyle,
        {
          left: (config.left / 100) * width,
          top: (config.top / 100) * height,
        },
      ]}>
      <Emoji size={config.size}>{config.emoji}</Emoji>
    </Animated.View>
  );
}

interface BackgroundEmojisProps {
  emojis: BackgroundEmojiType[];
}

export function BackgroundEmojis({emojis}: BackgroundEmojisProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {emojis.map((config, index) => (
        <FloatingEmoji key={index} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  emoji: {
    position: 'absolute',
  },
});
