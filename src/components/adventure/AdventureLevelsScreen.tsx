import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, StyleSheet, ImageBackground} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  WorldId,
  ThemeColors,
  ThemeConfig,
} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {AdventureMapPath} from './AdventureMapPath';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {Emoji} from '../common/Emoji';

const WORLD_VOICE: Record<WorldId, string> = {
  'counting-meadow': 'world_counting_meadow',
  'addition-island': 'world_addition_island',
  'subtraction-mountain': 'world_subtraction_mountain',
  'make-ten-beach': 'world_make_ten_beach',
  'doubles-castle': 'world_doubles_castle',
  'memory-garden': 'world_memory_garden',
  'farm-share': 'world_farm_share',
};

interface Props {
  worldId: WorldId;
  progress: AdventureProgress;
  fallbackColors: ThemeColors;
  onLevelPress: (levelId: string) => void;
  onBack: () => void;
  onClose: () => void;
}

export function AdventureLevelsScreen({
  worldId,
  progress,
  fallbackColors,
  onLevelPress,
  onBack,
  onClose,
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
    const clip = WORLD_VOICE[worldId];
    if (clip) voiceRef.current.play(clip);
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
          <Text style={styles.title}>
            <Emoji>{world.emoji}</Emoji> {t(world.nameKey)}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <AdventureMapPath
          world={world}
          progress={progress}
          colors={worldColors}
          onLevelPress={onLevelPress}
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
