import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Animated, {
  FadeIn,
  BounceIn,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface LevelCompleteScreenProps {
  stars: number;
  isNewBest: boolean;
  colors: ThemeColors;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToMap: () => void;
}

export function LevelCompleteScreen({
  stars,
  isNewBest,
  colors,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onBackToMap,
}: LevelCompleteScreenProps) {
  const {t} = useTranslation();

  const message =
    stars === 3
      ? t('adventure.perfect')
      : stars === 2
      ? t('adventure.great')
      : t('adventure.good');

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.card, {borderColor: colors.accent}]}>
        {/* Title */}
        <Animated.Text
          entering={BounceIn.delay(200)}
          style={styles.title}>
          {t('adventure.levelComplete')}
        </Animated.Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map(i => (
            <Animated.Text
              key={i}
              entering={BounceIn.delay(400 + i * 200)}
              style={styles.starBig}>
              <Emoji>{i <= stars ? '⭐' : '☆'}</Emoji>
            </Animated.Text>
          ))}
        </View>

        {/* Message */}
        <Text style={[styles.message, {color: colors.accent}]}>
          {message}
        </Text>
        <Text style={styles.starsText}>
          {t('adventure.newStars', {count: stars})}
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          {hasNextLevel && (
            <Pressable
              onPress={onNextLevel}
              style={[styles.primaryBtn, {backgroundColor: colors.primaryButton}]}>
              <Text style={styles.primaryBtnText}>
                {t('adventure.nextLevel')} <Emoji>➡️</Emoji>
              </Text>
            </Pressable>
          )}

          <Pressable onPress={onReplay} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryBtnText, {color: colors.accent}]}>
              <Emoji>🔄</Emoji> {t('adventure.replay')}
            </Text>
          </Pressable>

          <Pressable onPress={onBackToMap} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryBtnText, {color: colors.accent}]}>
              <Emoji>🗺️</Emoji> {t('adventure.backToMap')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 28,
    borderWidth: 3,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starBig: {
    fontSize: 48,
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  starsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
