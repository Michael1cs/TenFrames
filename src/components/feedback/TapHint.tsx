import React, {useEffect} from 'react';
import {Text, StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface TapHintProps {
  visible: boolean;
}

// A pulsing 👆 hint that appears when a child hesitates. Caller controls
// visibility — typically: show after a few seconds of no interaction,
// hide on first tap. Designed to gently guide non-readers without nagging.
export function TapHint({visible}: TapHintProps) {
  const pulse = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fade.value = withTiming(1, {duration: 300});
      pulse.value = withRepeat(
        withTiming(1, {duration: 700, easing: Easing.inOut(Easing.quad)}),
        -1,
        true,
      );
    } else {
      fade.value = withTiming(0, {duration: 200});
      pulse.value = 0;
    }
  }, [visible, fade, pulse]);

  const containerStyle = useAnimatedStyle(() => ({opacity: fade.value}));
  const fingerStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: -pulse.value * 14},
      {scale: 1 + pulse.value * 0.15},
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, containerStyle]}>
      <Animated.View style={fingerStyle}>
        <Text style={styles.finger}>👆</Text>
      </Animated.View>
      <View style={styles.dot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    height: 60,
  },
  finger: {
    fontSize: 38,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  dot: {
    position: 'absolute',
    top: 48,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
