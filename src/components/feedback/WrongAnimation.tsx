import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface WrongAnimationProps {
  visible: boolean;
}

export function WrongAnimation({visible}: WrongAnimationProps) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {damping: 6});
      translateX.value = withSequence(
        withTiming(-10, {duration: 50}),
        withTiming(10, {duration: 100}),
        withTiming(-10, {duration: 100}),
        withTiming(10, {duration: 100}),
        withTiming(0, {duration: 50}),
      );
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {translateX: translateX.value}],
    opacity: scale.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.content, animStyle]}>
        <Text style={styles.emoji}>🤔</Text>
        <Text style={styles.text}>💪</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  text: {
    fontSize: 20,
    color: '#FBBF24',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
