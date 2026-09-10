import React, {useEffect} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Text} from '../common/AppText';
import {Emoji} from '../common/Emoji';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {TenFrameMotif} from './TenFrameMotif';

interface MilestoneAnimationProps {
  visible: boolean;
  milestoneId: string | null;
  onDismiss: () => void;
  colors: ThemeColors;
}

export function MilestoneAnimation({
  visible,
  milestoneId,
  onDismiss,
  colors,
}: MilestoneAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {duration: 300});
      scale.value = withSequence(
        withSpring(1.15, {damping: 8}),
        withDelay(150, withSpring(1, {damping: 10})),
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

  const starsCount = Number(milestoneId.replace('stars-', ''));

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <Animated.View
        style={[styles.card, {borderColor: colors.accent}, cardStyle]}>
        {/* A math app celebrates with the NUMBER — the count is the hero,
            over the app's own frame, not a stock trophy. */}
        <View style={styles.hero}>
          <Text style={[styles.count, {color: colors.accent}]}>
            {starsCount}
          </Text>
          <Text style={styles.heroStar}><Emoji>⭐</Emoji></Text>
        </View>
        <TenFrameMotif
          filled={10}
          fillColor={colors.cellFilled}
          borderColor={colors.accent}
        />
        <Text style={styles.title}>{t('milestones.congratulations')}</Text>
        <Text style={styles.desc}>
          {t('milestones.starsReached', {count: starsCount})}
        </Text>
        <Pressable
          style={[styles.button, {backgroundColor: colors.accent}]}
          onPress={onDismiss}>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    backgroundColor: '#FFF9F0',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 10,
    borderWidth: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    maxWidth: 310,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    fontSize: 64,
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  heroStar: {
    fontSize: 42,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1E1B4B',
    textAlign: 'center',
    marginTop: 4,
  },
  desc: {
    fontSize: 15,
    color: '#1E1B4B',
    opacity: 0.75,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
