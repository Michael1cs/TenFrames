import React from 'react';
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BouncyProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  // How far the element squashes while the finger is down.
  pressScale?: number;
  children?: React.ReactNode;
}

// A Pressable that squashes under the finger and springs back on release.
// Every big tappable thing a child touches — cards, tabs, map nodes — uses
// this, so the whole app answers a touch the same way the ten-frame cells
// already do. The response is on the UI thread (reanimated), so it never
// waits for JS.
export function Bouncy({
  style,
  pressScale = 0.94,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: BouncyProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={e => {
        scale.value = withSpring(pressScale, {damping: 15, stiffness: 400});
        onPressIn?.(e);
      }}
      onPressOut={e => {
        scale.value = withSpring(1, {damping: 12, stiffness: 300});
        onPressOut?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
