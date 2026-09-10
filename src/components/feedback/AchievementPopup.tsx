import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '../common/AppText';
import {Emoji} from '../common/Emoji';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ALL_ACHIEVEMENTS} from '../../utils/rewardData';
import {ThemeColors} from '../../types/game';
import {TenFrameMotif} from './TenFrameMotif';

interface AchievementPopupProps {
  achievementId: string | null;
  visible: boolean;
  colors: ThemeColors;
}

// Shares the sticker toast's lane and card language (top-center, cream,
// theme border, ten-frame motif) — it used to sit at the bottom over the
// mode bar in its own amber style. One celebration language, one lane.
export function AchievementPopup({
  achievementId,
  visible,
  colors,
}: AchievementPopupProps) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievementId) {
      translateY.value = withSpring(0, {damping: 13});
      opacity.value = withTiming(1, {duration: 300});
    } else {
      translateY.value = withTiming(-120, {duration: 200});
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
    <Animated.View
      style={[styles.container, {borderColor: colors.accent}, animStyle]}>
      <TenFrameMotif
        filled={10}
        fillColor={colors.cellFilled}
        borderColor={colors.accent}
      />
      <View style={styles.body}>
        <Text style={styles.emoji}><Emoji>{achievement.emoji}</Emoji></Text>
        <View style={styles.texts}>
          <Text style={styles.label}>{t(achievement.nameKey)}</Text>
          <Text style={styles.desc}>{t(achievement.descKey)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 132,
    alignSelf: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    zIndex: 90,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 3,
    maxWidth: 300,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  texts: {
    flexShrink: 1,
  },
  emoji: {
    fontSize: 34,
  },
  label: {
    color: '#1E1B4B',
    fontWeight: 'bold',
    fontSize: 17,
  },
  desc: {
    color: '#1E1B4B',
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 17,
  },
});
