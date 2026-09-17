import React, {useEffect, useRef} from 'react';
import {useVoice} from '../../hooks/useVoice';
import {View, Pressable, StyleSheet} from 'react-native';
import {Text} from '../common/AppText';
import {FREDOKA_FAMILY} from '../../utils/fonts';
import Animated, {
  FadeIn,
  BounceIn,
  ZoomIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';
import {Mascot} from '../common/Mascot';
import {useReduceMotion} from '../../hooks/useReduceMotion';

interface LevelCompleteScreenProps {
  stars: number;
  isNewBest: boolean;
  colors: ThemeColors;
  hasNextLevel: boolean;
  // Every level of the world finished — as opposed to a free child who has
  // simply reached the crowned ones.
  worldComplete?: boolean;
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
    // A one-shot burst on mount; shared values are stable and `delay` is
    // fixed per particle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  worldComplete = false,
  onNextLevel,
  onReplay,
  onBackToMap,
}: LevelCompleteScreenProps) {
  const reduceMotion = useReduceMotion();
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // One line, spoken shortly after the screen appears. The queue in useVoice
  // keeps it behind whatever praise is still finishing, so nothing is cut.
  useEffect(() => {
    // How it went, and nothing else. Up to five lines used to land here —
    // the star verdict, the reward toasts, and a transition cue that cut
    // whatever was speaking to say "Let's go to the next level!", including
    // to a free child whose next level is crowned. The world line is kept
    // for a world that is really finished, and says "this world", not
    // "the island".
    const verdict =
      stars === 3
        ? 'reward_level_perfect'
        : stars === 2
        ? 'reward_level_great'
        : 'reward_level_good';
    const id = worldComplete && !hasNextLevel ? 'lvl_world_done_any' : verdict;
    const t = setTimeout(() => voiceRef.current.play(id), 900);
    return () => clearTimeout(t);
  }, [hasNextLevel, worldComplete, stars]);

  const message =
    stars === 3
      ? t('adventure.perfect')
      : stars === 2
      ? t('adventure.great')
      : t('adventure.good');

  // Three stars get the jump for joy; any finished level gets a thumbs up.
  const mascotPose = stars === 3 ? 'jump' : 'wink';

  const confettiEmojis = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🏆', '🎯'];

  return (
    <View style={styles.overlay}>
      {/* Confetti particles */}
      {stars >= 2 && !reduceMotion && confettiEmojis.map((emoji, i) => (
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
        <Animated.View entering={BounceIn.delay(300)} style={styles.mascot}>
          <Mascot pose={mascotPose} height={110} />
        </Animated.View>

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
            <Emoji>🏆</Emoji> {t('adventure.newBest')}
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
  mascot: {
    marginTop: -64,
    marginBottom: 4,
  },
  title: {
    fontFamily: FREDOKA_FAMILY,
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
    fontFamily: FREDOKA_FAMILY,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  newBest: {
    fontFamily: FREDOKA_FAMILY,
    fontSize: 16,
    fontWeight: '800',
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
    fontSize: 16,
    fontWeight: '700',
  },
});
