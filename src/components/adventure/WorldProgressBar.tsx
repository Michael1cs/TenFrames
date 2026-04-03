import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface WorldProgressBarProps {
  stars: number;
  maxStars: number;
  colors: ThemeColors;
}

export function WorldProgressBar({
  stars,
  maxStars,
  colors,
}: WorldProgressBarProps) {
  const progress = maxStars > 0 ? stars / maxStars : 0;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%` as any,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Emoji>⭐</Emoji> {stars} / {maxStars}
      </Text>
      <View style={styles.trackOuter}>
        <View style={[styles.track, {borderColor: colors.accent}]}>
          <Animated.View
            style={[
              styles.fill,
              {backgroundColor: colors.primaryButton},
              barStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  trackOuter: {
    width: '100%',
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
