import React, {useEffect} from 'react';
import {Text, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ALL_ACHIEVEMENTS} from '../../utils/rewardData';

interface AchievementPopupProps {
  achievementId: string | null;
  visible: boolean;
}

export function AchievementPopup({
  achievementId,
  visible,
}: AchievementPopupProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievementId) {
      translateY.value = withSpring(0, {damping: 12});
      opacity.value = withTiming(1, {duration: 300});
    } else {
      translateY.value = withTiming(100, {duration: 200});
      opacity.value = withTiming(0, {duration: 200});
    }
  }, [visible, achievementId, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const {t} = useTranslation();

  if (!visible || !achievementId) return null;

  const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={styles.emoji}>{achievement.emoji}</Text>
      <Text style={styles.label}>{t(achievement.nameKey)}</Text>
      <Text style={styles.desc}>{t(achievement.descKey)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 90,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FCD34D',
    maxWidth: 280,
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    color: '#1E1B4B',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  desc: {
    color: '#1E1B4B',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
});
