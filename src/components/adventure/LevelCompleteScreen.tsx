import React, {useEffect} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Animated, {
  FadeIn,
  BounceIn,
  ZoomIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
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

// Floating confetti particle
function ConfettiParticle({emoji, delay, left}: {emoji: string; delay: number; left: number}) {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(500, {duration: 3000}),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, {duration: 2000}), -1),
    );
    opacity.value = withDelay(
      delay + 2000,
      withTiming(0, {duration: 1000}),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${rotate.value}deg`},
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[{position: 'absolute', top: 0, left: `${left}%` as any, fontSize: 24}, style]}>
      <Emoji>{emoji}</Emoji>
    </Animated.Text>
  );
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

  const messageEmoji = stars === 3 ? '🎉' : stars === 2 ? '👏' : '👍';

  const confettiEmojis = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🏆', '🎯'];

  return (
    <View style={styles.overlay}>
      {/* Confetti particles */}
      {stars >= 2 && confettiEmojis.map((emoji, i) => (
        <ConfettiParticle
          key={i}
          emoji={emoji}
          delay={i * 150}
          left={10 + (i * 11) % 80}
        />
      ))}

      <Animated.View
        entering={ZoomIn.springify().damping(12)}
        style={[styles.card, {borderColor: colors.accent}]}>
        {/* Big emoji reaction */}
        <Animated.Text
          entering={BounceIn.delay(300)}
          style={styles.bigEmoji}>
          <Emoji>{messageEmoji}</Emoji>
        </Animated.Text>

        {/* Title */}
        <Animated.Text
          entering={FadeIn.delay(400)}
          style={styles.title}>
          {t('adventure.levelComplete')}
        </Animated.Text>

        {/* Stars - big and bouncy */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map(i => (
            <Animated.View
              key={i}
              entering={BounceIn.delay(500 + i * 250).springify()}>
              <Text style={[styles.starBig, {opacity: i <= stars ? 1 : 0.15}]}>
                <Emoji>{i <= stars ? '⭐' : '☆'}</Emoji>
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Message */}
        <Animated.Text
          entering={FadeIn.delay(1200)}
          style={[styles.message, {color: colors.accent}]}>
          {message}
        </Animated.Text>

        {isNewBest && (
          <Animated.Text
            entering={BounceIn.delay(1400)}
            style={styles.newBest}>
            <Emoji>🏆</Emoji> New Best!
          </Animated.Text>
        )}

        {/* Buttons */}
        <Animated.View
          entering={SlideInDown.delay(1500).springify()}
          style={styles.buttons}>
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
            <Text style={[styles.secondaryBtnText, {color: 'rgba(255,255,255,0.6)'}]}>
              <Emoji>🗺️</Emoji> {t('adventure.backToMap')}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  bigEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  starBig: {
    fontSize: 52,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  newBest: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  buttons: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
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
