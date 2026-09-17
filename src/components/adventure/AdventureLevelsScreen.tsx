import React, {useEffect, useRef} from 'react';
import {View, Pressable, StyleSheet, ImageBackground} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  WorldId,
  ThemeColors,
  ThemeConfig,
} from '../../types/game';
import {
  ADVENTURE_WORLDS,
  WORLD_VOICE_IDS,
} from '../../config/adventureWorlds';
import {AdventureMapPath} from './AdventureMapPath';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {WorldIcon} from './WorldIcon';

// Partial on purpose. Every world here has a recorded name clip; a world added
// without one simply isn't announced, because the call site below guards with
// `if (clip)`. That is the whole trade that lets a new world ship at zero voice
// cost — its levels are fully narrated, only its title is silent.

interface Props {
  worldId: WorldId;
  progress: AdventureProgress;
  fallbackColors: ThemeColors;
  onLevelPress: (levelId: string) => void;
  onBack: () => void;
  onClose: () => void;
  isPremium: boolean;
}

export function AdventureLevelsScreen({
  worldId,
  progress,
  fallbackColors,
  onLevelPress,
  onBack,
  onClose,
  isPremium,
}: Props) {
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const allThemes = getAllThemes();
  const world = ADVENTURE_WORLDS.find(w => w.id === worldId);
  const worldTheme = world
    ? allThemes.find((th: ThemeConfig) => th.id === world.theme)
    : null;
  const bgImage = worldTheme?.backgroundPortrait;
  const worldColors = worldTheme?.colors ?? fallbackColors;

  useEffect(() => {
    voiceRef.current.play(WORLD_VOICE_IDS[worldId]);
  }, [worldId]);

  if (!world) return null;

  return (
    <ImageBackground
      source={bgImage}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.titleRow}>
            <WorldIcon
              worldId={world.id}
              width={46}
              height={34}
              fallbackEmoji={world.emoji}
            />
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {t(world.nameKey)}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <AdventureMapPath
          world={world}
          progress={progress}
          colors={worldColors}
          onLevelPress={onLevelPress}
          isPremium={isPremium}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#1E1B4B'},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {color: '#FFFFFF', fontSize: 24, fontWeight: 'bold'},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {color: '#FFFFFF', fontSize: 18, fontWeight: 'bold'},
});
