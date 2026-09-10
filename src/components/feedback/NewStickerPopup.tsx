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
import {ALL_STICKERS} from '../../utils/rewardData';
import {ThemeColors} from '../../types/game';
import {TenFrameMotif} from './TenFrameMotif';

interface NewStickerPopupProps {
  stickerIds: string[];
  visible: boolean;
  colors: ThemeColors;
}

// Celebration toast, one lane for the whole app: top-center, BELOW the
// header row, so it never buries the stats or the mode bar. Cream card +
// theme-colored border + the ten-frame motif — the app's own celebration
// language rather than a generic notification pill.
export function NewStickerPopup({stickerIds, visible, colors}: NewStickerPopupProps) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && stickerIds.length > 0) {
      translateY.value = withSpring(0, {damping: 13});
      opacity.value = withTiming(1, {duration: 300});
    } else {
      translateY.value = withTiming(-120, {duration: 200});
      opacity.value = withTiming(0, {duration: 200});
    }
  }, [visible, stickerIds, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const {t} = useTranslation();

  if (!visible || stickerIds.length === 0) return null;

  // Adventure's level-complete batch can merge many unlocks into one card;
  // show a handful and count the rest.
  const shown = stickerIds.slice(0, 5);
  const extra = stickerIds.length - shown.length;
  const stickers = shown
    .map(id => ALL_STICKERS.find(s => s.id === id))
    .filter(Boolean);

  return (
    <Animated.View
      style={[styles.container, {borderColor: colors.accent}, animStyle]}>
      <TenFrameMotif
        filled={Math.min(5, stickerIds.length + 2)}
        fillColor={colors.cellFilled}
        borderColor={colors.accent}
      />
      <View style={styles.body}>
        <View style={styles.stickersRow}>
          {stickers.map(s =>
            s ? (
              <Text key={s.id} style={styles.emoji}>
                <Emoji>{s.emoji}</Emoji>
              </Text>
            ) : null,
          )}
          {extra > 0 && <Text style={styles.extraCount}>+{extra}</Text>}
        </View>
        <Text style={styles.label}>{t('rewards.newSticker')}</Text>
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
    paddingHorizontal: 22,
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
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: '#1E1B4B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stickersRow: {
    flexDirection: 'row',
    gap: 4,
  },
  emoji: {
    fontSize: 30,
  },
  extraCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1B4B',
    alignSelf: 'center',
    opacity: 0.7,
  },
});
