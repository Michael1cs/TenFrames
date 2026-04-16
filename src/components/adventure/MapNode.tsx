import React, {useEffect} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import {AdventureLevel, AdventureLevelProgress, ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface MapNodeProps {
  level: AdventureLevel;
  levelProgress: AdventureLevelProgress;
  isCurrent: boolean;
  colors: ThemeColors;
  nodeSize: number;
  index: number; // for staggered entrance
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MapNode({
  level,
  levelProgress,
  isCurrent,
  colors,
  nodeSize,
  index,
  onPress,
}: MapNodeProps) {
  const {unlocked, completed, stars} = levelProgress;

  // Entrance animation - staggered scale from 0
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withDelay(
      index * 80, // stagger 80ms per node
      withSpring(1, {damping: 12, stiffness: 120}),
    );
  }, [index, entrance]);

  // Pulse for current level
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isCurrent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, {duration: 700}),
          withTiming(1, {duration: 700}),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, {duration: 200});
    }
  }, [isCurrent, pulse]);

  // Glow for current level
  const glow = useSharedValue(0);
  useEffect(() => {
    if (isCurrent) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, {duration: 1000}),
          withTiming(0, {duration: 1000}),
        ),
        -1,
        true,
      );
    }
  }, [isCurrent, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: entrance.value * pulse.value},
    ],
    opacity: entrance.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{scale: 1 + glow.value * 0.3}],
  }));

  const nodeColor = !unlocked
    ? '#4B5563'
    : completed
    ? colors.primaryButton
    : isCurrent
    ? colors.accent
    : colors.accentButton;

  const borderColor = !unlocked
    ? '#374151'
    : completed
    ? colors.primaryButtonEnd || colors.primaryButton
    : isCurrent
    ? colors.primaryButton
    : 'rgba(255,255,255,0.3)';

  const renderStars = () => {
    if (!completed || stars === 0) return null;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3].map(i => (
          <Text
            key={i}
            style={[styles.starText, {opacity: i <= stars ? 1 : 0.2}]}>
            <Emoji>{i <= stars ? '⭐' : '☆'}</Emoji>
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[animatedStyle, {alignItems: 'center'}]}>
      {/* Glow ring behind current node */}
      {isCurrent && (
        <Animated.View
          style={[
            styles.glowRing,
            glowStyle,
            {
              width: nodeSize + 16,
              height: nodeSize + 16,
              borderRadius: (nodeSize + 16) / 2,
              backgroundColor: colors.accent,
            },
          ]}
        />
      )}
      <AnimatedPressable
        onPress={unlocked ? onPress : undefined}
        style={[
          styles.node,
          {
            width: nodeSize,
            height: nodeSize,
            borderRadius: level.isBonus ? nodeSize / 4 : nodeSize / 2,
            backgroundColor: nodeColor,
            borderColor,
            opacity: unlocked ? 1 : 0.55,
          },
        ]}>
        <Text style={[styles.nodeEmoji, {fontSize: nodeSize * 0.5}]}>
          <Emoji>{level.emoji}</Emoji>
        </Text>
        {!unlocked && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockBadgeText}>
              <Emoji>🔒</Emoji>
            </Text>
          </View>
        )}
        {completed && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </AnimatedPressable>
      {renderStars()}
      {isCurrent && (
        <Text style={[styles.playLabel, {color: colors.accent}]}>
          <Emoji>👆</Emoji>
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    top: -8,
    zIndex: 1,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  lockBadgeText: {
    fontSize: 11,
  },
  nodeEmoji: {
    fontSize: 24,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 3,
    gap: 1,
  },
  starText: {
    fontSize: 10,
  },
  playLabel: {
    fontSize: 16,
    marginTop: 2,
  },
});
