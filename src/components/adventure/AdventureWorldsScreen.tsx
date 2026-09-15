import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  WorldId,
  ThemeConfig,
} from '../../types/game';
import {
  ADVENTURE_WORLDS,
  getWorldStars,
  getWorldMaxStars,
} from '../../config/adventureWorlds';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {Emoji} from '../common/Emoji';

// Grid geometry, shared between the container padding and the per-card
// width so the columns always add up to the available width exactly.
const GRID_PADDING = 16;
const GRID_GAP = 12;

interface Props {
  progress: AdventureProgress;
  onSelectWorld: (worldId: WorldId) => void;
  onClose: () => void;
}

export function AdventureWorldsScreen({progress, onSelectWorld, onClose}: Props) {
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(() => {
    const timer = setTimeout(() => voiceRef.current.play('choose_world'), 500);
    return () => clearTimeout(timer);
  }, []);

  // The cards used a flat 47% width, which is right on a phone (two columns)
  // but produced ~485pt squares on a 13" iPad — two and a half of them filled
  // the screen and the world list read as a stack of billboards rather than a
  // map.
  //
  // The width the math runs on is MEASURED from the grid itself (onLayout),
  // not read from useWindowDimensions: under iPadOS 26's resizable windows
  // the Dimensions module can keep reporting the window's old size after a
  // live resize, which left a two-column phone grid hugging the left edge of
  // a full-width iPad window. The measured width is ground truth no matter
  // how the window got its size; the window value only seeds the first frame.
  const {width: windowWidth} = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const width = measuredWidth ?? windowWidth;
  const isTablet = width >= 640;
  const columns = isTablet ? 3 : 2;
  const cardWidth =
    (width - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  const allThemes = getAllThemes();

  return (
    <ImageBackground
      source={require('../../../assets/backgrounds/pixel/pixel_portrait.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            <Emoji>🗺️</Emoji> {t('adventure.title')}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.worldsScroll}
          contentContainerStyle={styles.worldsGrid}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          onLayout={e => setMeasuredWidth(e.nativeEvent.layout.width)}>
          {ADVENTURE_WORLDS.map(w => {
            const isUnlocked = progress.worlds[w.id]?.unlocked;
            const stars = getWorldStars(w.id, progress);
            const maxStars = getWorldMaxStars(w.id);
            const wTheme = allThemes.find(
              (th: ThemeConfig) => th.id === w.theme,
            );
            const accent = wTheme?.colors?.accent ?? '#8B5CF6';
            return (
              <Pressable
                key={w.id}
                onPress={() => (!isUnlocked ? null : onSelectWorld(w.id))}
                disabled={!isUnlocked}
                style={[
                  styles.worldCard,
                  {width: cardWidth, borderColor: accent},
                  !isUnlocked && styles.worldCardLocked,
                ]}>
                <Text
                  style={[
                    styles.worldCardEmoji,
                    isTablet && styles.worldCardEmojiTablet,
                  ]}>
                  <Emoji>{isUnlocked ? w.emoji : '🔒'}</Emoji>
                </Text>
                <Text
                  style={[
                    styles.worldCardName,
                    isTablet && styles.worldCardNameTablet,
                  ]}
                  numberOfLines={2}>
                  {t(w.nameKey)}
                </Text>
                {isUnlocked && (
                  <Text
                    style={[
                      styles.worldCardStars,
                      isTablet && styles.worldCardStarsTablet,
                      {color: accent},
                    ]}>
                    ⭐ {stars}/{maxStars}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  titleTablet: {fontSize: 32},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  worldsScroll: {flex: 1},
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // flex-start, not space-between: the width is computed to fill the row
    // exactly, so space-between would only stretch a short final row.
    justifyContent: 'flex-start',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 96,
    gap: GRID_GAP,
  },
  worldCard: {
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  worldCardLocked: {
    opacity: 0.45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  worldCardEmoji: {fontSize: 56},
  worldCardEmojiTablet: {fontSize: 72},
  worldCardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  worldCardNameTablet: {fontSize: 21},
  worldCardStarsTablet: {fontSize: 18},
  worldCardStars: {
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
