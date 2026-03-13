import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

interface MilestoneAnimationProps {
  visible: boolean;
  milestoneId: string | null;
  onDismiss: () => void;
}

const MILESTONE_EMOJIS: Record<string, string> = {
  'stars-10': '🌟',
  'stars-25': '✨',
  'stars-50': '🏆',
  'stars-100': '💫',
};

export function MilestoneAnimation({
  visible,
  milestoneId,
  onDismiss,
}: MilestoneAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {duration: 300});
      scale.value = withSequence(
        withSpring(1.2, {damping: 8}),
        withDelay(200, withSpring(1, {damping: 10})),
      );
    } else {
      opacity.value = withTiming(0, {duration: 200});
      scale.value = 0;
    }
  }, [visible, scale, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const {t} = useTranslation();

  if (!visible || !milestoneId) return null;

  const emoji = MILESTONE_EMOJIS[milestoneId] || '🎉';
  const starsCount = Number(milestoneId.replace('stars-', ''));

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{t('milestones.congratulations')}</Text>
        <Text style={styles.desc}>
          {t('milestones.starsReached', {count: starsCount})}
        </Text>
        <Text style={styles.sparkle}>🎉🎊🎉</Text>
        <Pressable style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>{t('milestones.continue')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    elevation: 10,
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  sparkle: {
    fontSize: 28,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#1E1B4B',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
