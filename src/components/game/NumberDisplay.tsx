import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
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
}

export function NumberDisplay({number, colors, emoji}: NumberDisplayProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1.1, {damping: 4}, () => {
      scale.value = withSpring(1);
    });
  }, [number]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
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
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: {width: 0, height: 1},
            textShadowRadius: 3,
          },
        ]}>
        {number}
      </Text>
      <Text style={styles.emoji}><Emoji>{emoji}</Emoji></Text>
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
    fontSize: 36,
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: 28,
  },
});
