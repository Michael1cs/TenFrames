import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {Emoji} from '../common/Emoji';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {ThemeColors} from '../../types/game';

interface NumberDisplayProps {
  number: number;
  colors: ThemeColors;
  emoji: string;
  scale?: number;
}

export function NumberDisplay({number, colors, emoji, scale = 1}: NumberDisplayProps) {
  const popScale = useSharedValue(1);

  React.useEffect(() => {
    popScale.value = withSpring(1.1, {damping: 4}, () => {
      popScale.value = withSpring(1);
    });
  }, [number]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: popScale.value}],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderColor: colors.numberBorder,
        },
      ]}>
      <Text
        style={[
          styles.number,
          {
            color: colors.numberText,
            fontSize: 44 * scale,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: {width: 0, height: 1},
            textShadowRadius: 3,
          },
        ]}>
        {number}
      </Text>
      <Text style={[styles.emoji, {fontSize: 34 * scale}]}><Emoji>{emoji}</Emoji></Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    alignSelf: 'center',
    gap: 6,
  },
  number: {
    fontSize: 44,
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: 34,
  },
});
