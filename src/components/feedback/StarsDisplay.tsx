import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Emoji} from '../common/Emoji';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface StarsDisplayProps {
  stars: number; // 0-3
  visible: boolean;
}

export function StarsDisplay({stars, visible}: StarsDisplayProps) {
  const scale1 = useSharedValue(0);
  const scale2 = useSharedValue(0);
  const scale3 = useSharedValue(0);

  useEffect(() => {
    if (visible && stars > 0) {
      scale1.value = withSpring(1, {damping: 8, stiffness: 150});
      scale2.value =
        stars >= 2
          ? withDelay(300, withSpring(1, {damping: 8, stiffness: 150}))
          : 0;
      scale3.value =
        stars >= 3
          ? withDelay(600, withSpring(1, {damping: 8, stiffness: 150}))
          : 0;
    } else {
      scale1.value = 0;
      scale2.value = 0;
      scale3.value = 0;
    }
  }, [visible, stars, scale1, scale2, scale3]);

  const style1 = useAnimatedStyle(() => ({transform: [{scale: scale1.value}]}));
  const style2 = useAnimatedStyle(() => ({transform: [{scale: scale2.value}]}));
  const style3 = useAnimatedStyle(() => ({transform: [{scale: scale3.value}]}));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.star, style1]}>
        {stars >= 1 ? <Emoji>⭐</Emoji> : '☆'}
      </Animated.Text>
      <Animated.Text style={[styles.starBig, style2]}>
        {stars >= 2 ? <Emoji>⭐</Emoji> : '☆'}
      </Animated.Text>
      <Animated.Text style={[styles.star, style3]}>
        {stars >= 3 ? <Emoji>⭐</Emoji> : '☆'}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  star: {
    fontSize: 28,
  },
  starBig: {
    fontSize: 36,
  },
});
