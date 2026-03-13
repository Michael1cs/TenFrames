import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
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
          backgroundColor: colors.numberBg,
          borderColor: colors.numberBorder,
        },
      ]}>
      <Text style={[styles.number, {color: colors.numberText}]}>
        {number}
      </Text>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignSelf: 'center',
    gap: 6,
  },
  number: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: 24,
  },
});
