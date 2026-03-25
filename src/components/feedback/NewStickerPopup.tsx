import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Emoji} from '../common/Emoji';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {ALL_STICKERS} from '../../utils/rewardData';

interface NewStickerPopupProps {
  stickerIds: string[];
  visible: boolean;
}

export function NewStickerPopup({stickerIds, visible}: NewStickerPopupProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && stickerIds.length > 0) {
      translateY.value = withSpring(0, {damping: 12});
      opacity.value = withTiming(1, {duration: 300});
    } else {
      translateY.value = withTiming(-100, {duration: 200});
      opacity.value = withTiming(0, {duration: 200});
    }
  }, [visible, stickerIds, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const {t} = useTranslation();

  if (!visible || stickerIds.length === 0) return null;

  const stickers = stickerIds
    .map(id => ALL_STICKERS.find(s => s.id === id))
    .filter(Boolean);

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={styles.label}>{t('rewards.newSticker')}</Text>
      <View style={styles.stickersRow}>
        {stickers.map(s =>
          s ? (
            <Text key={s.id} style={styles.emoji}>
              <Emoji>{s.emoji}</Emoji>
            </Text>
          ) : null,
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 90,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stickersRow: {
    flexDirection: 'row',
    gap: 4,
  },
  emoji: {
    fontSize: 24,
  },
});
