import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {Text} from '../common/AppText';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface PadHintProps {
  visible: boolean;
}

// A bouncing 👇 that appears above the number pad once the child has built
// the answer on the frame — the board is done, the missing step is naming
// the number. Sibling of TapHint (which points at the frame); this one
// points at the pad.
export function PadHint({visible}: PadHintProps) {
  const bounce = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fade.value = withTiming(1, {duration: 300});
      bounce.value = withRepeat(
        withTiming(1, {duration: 600, easing: Easing.inOut(Easing.quad)}),
        -1,
        true,
      );
    } else {
      fade.value = withTiming(0, {duration: 200});
      bounce.value = 0;
    }
  }, [visible, fade, bounce]);

  const containerStyle = useAnimatedStyle(() => ({opacity: fade.value}));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{translateY: bounce.value * 12}],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, containerStyle]}>
      <Animated.View style={arrowStyle}>
        <Text style={styles.arrow}>👇</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'flex-start',
  },
  arrow: {
    fontSize: 34,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
});
