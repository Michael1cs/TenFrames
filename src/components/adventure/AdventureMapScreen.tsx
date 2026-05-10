import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ImageBackground,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  WorldId,
  ThemeColors,
  ThemeConfig,
} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {WorldSelector} from './WorldSelector';
import {AdventureMapPath} from './AdventureMapPath';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {Emoji} from '../common/Emoji';

// Map worldId → voice clip ID for narration.
const WORLD_VOICE: Record<WorldId, string> = {
  'counting-meadow': 'world_counting_meadow',
  'addition-island': 'world_addition_island',
  'subtraction-mountain': 'world_subtraction_mountain',
  'make-ten-beach': 'world_make_ten_beach',
  'doubles-castle': 'world_doubles_castle',
  'memory-garden': 'world_memory_garden',
};

interface AdventureMapScreenProps {
  visible: boolean;
  progress: AdventureProgress;
  selectedWorld: WorldId;
  colors: ThemeColors;
  isPremium: boolean;
  onSelectWorld: (worldId: WorldId) => void;
  onLevelPress: (levelId: string) => void;
  onClose: () => void;
}

export function AdventureMapScreen({
  visible,
  progress,
  selectedWorld,
  colors,
  isPremium,
  onSelectWorld,
  onLevelPress,
  onClose,
}: AdventureMapScreenProps) {
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // On modal open: play "Choose a world!" intro.
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(
      () => voiceRef.current.play('choose_world'),
      500,
    );
    return () => clearTimeout(timer);
  }, [visible]);

  // When user changes world (tab tap), narrate the world name.
  const prevWorld = useRef<WorldId | null>(null);
  useEffect(() => {
    if (!visible) return;
    if (prevWorld.current !== null && prevWorld.current !== selectedWorld) {
      const clip = WORLD_VOICE[selectedWorld];
      if (clip) voiceRef.current.play(clip);
    }
    prevWorld.current = selectedWorld;
  }, [selectedWorld, visible]);

  const world = ADVENTURE_WORLDS.find(w => w.id === selectedWorld);
  if (!world) return null;

  // Get the theme config for the selected world's background
  const allThemes = getAllThemes();
  const worldTheme = allThemes.find(
    (th: ThemeConfig) => th.id === world.theme,
  );
  const bgImage = worldTheme?.backgroundPortrait;

  const worldColors = worldTheme?.colors ?? colors;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <ImageBackground
        source={bgImage}
        style={styles.background}
        resizeMode="cover">
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              <Emoji>🗺️</Emoji> {t('adventure.title')}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* World Selector */}
          <WorldSelector
            selectedWorld={selectedWorld}
            progress={progress}
            colors={worldColors}
            isPremium={isPremium}
            onSelect={onSelectWorld}
          />

          {/* World title */}
          <Text style={styles.worldTitle}>
            <Emoji>{world.emoji}</Emoji> {t(world.nameKey)}
          </Text>

          {/* Map Path */}
          <AdventureMapPath
            world={world}
            progress={progress}
            colors={worldColors}
            onLevelPress={onLevelPress}
          />
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
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
  worldTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
});
