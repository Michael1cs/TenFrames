import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface WrongFlashProps {
  visible: boolean;
}

// A brief red border-glow at the screen edges. Stronger sensory cue than the
// emoji popup alone — kids who can't read still get an unambiguous signal that
// something is wrong. Auto-fades; renders nothing when not active.
export function WrongFlash({visible}: WrongFlashProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, {duration: 80}),
        withTiming(0.6, {duration: 200}),
        withTiming(0, {duration: 400}),
      );
    }
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    borderColor: '#EF4444',
    borderWidth: 8,
    borderRadius: 4,
    zIndex: 35,
  },
});
