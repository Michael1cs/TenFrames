import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import {useEffect} from 'react';
import {AdventureLevel, AdventureLevelProgress, ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface MapNodeProps {
  level: AdventureLevel;
  levelProgress: AdventureLevelProgress;
  isCurrent: boolean;
  colors: ThemeColors;
  nodeSize: number;
  onPress: () => void;
}

export function MapNode({
  level,
  levelProgress,
  isCurrent,
  colors,
  nodeSize,
  onPress,
}: MapNodeProps) {
  const scale = useSharedValue(1);
  const {unlocked, completed, stars} = levelProgress;

  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, {duration: 600}),
          withTiming(1, {duration: 600}),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, {duration: 200});
    }
  }, [isCurrent, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const nodeColor = !unlocked
    ? '#6B7280'
    : completed
    ? colors.primaryButton
    : isCurrent
    ? colors.accent
    : colors.accentButton;

  const borderColor = !unlocked
    ? '#4B5563'
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
            style={[styles.starText, {opacity: i <= stars ? 1 : 0.25}]}>
            <Emoji>{i <= stars ? '⭐' : '☆'}</Emoji>
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[animatedStyle, {alignItems: 'center'}]}>
      <Pressable
        onPress={unlocked ? onPress : undefined}
        style={[
          styles.node,
          level.isBonus ? styles.bonusNode : null,
          {
            width: nodeSize,
            height: nodeSize,
            borderRadius: level.isBonus ? nodeSize / 4 : nodeSize / 2,
            backgroundColor: nodeColor,
            borderColor,
          },
        ]}>
        {!unlocked ? (
          <Text style={styles.lockEmoji}><Emoji>🔒</Emoji></Text>
        ) : (
          <Text style={[styles.nodeEmoji, {fontSize: nodeSize * 0.4}]}>
            <Emoji>{level.emoji}</Emoji>
          </Text>
        )}
        {completed && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </Pressable>
      {renderStars()}
      <Text
        style={[
          styles.levelLabel,
          {color: unlocked ? '#FFFFFF' : 'rgba(255,255,255,0.4)'},
        ]}
        numberOfLines={1}>
        {level.order}
      </Text>
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
  },
  bonusNode: {
    transform: [{rotate: '45deg'}],
  },
  lockEmoji: {
    fontSize: 20,
    opacity: 0.6,
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
    marginTop: 2,
    gap: 1,
  },
  starText: {
    fontSize: 10,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
