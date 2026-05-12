import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ImageBackground,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  WorldId,
  ThemeColors,
  ThemeConfig,
} from '../../types/game';
import {
  ADVENTURE_WORLDS,
  getWorldStars,
  getWorldMaxStars,
} from '../../config/adventureWorlds';
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
  'farm-share': 'world_farm_share',
};

interface AdventureMapScreenProps {
  visible: boolean;
  progress: AdventureProgress;
  selectedWorld: WorldId;
  colors: ThemeColors;
  isPremium: boolean;
  // Incremented by the parent when the modal is being opened FRESH (from
  // ModeChoice or free play) — that triggers a reset to the worlds grid.
  // When returning from a level, the parent leaves this alone so the
  // already-open levels view persists ("back one step", not "back to top").
  resetVersion?: number;
  onSelectWorld: (worldId: WorldId) => void;
  onLevelPress: (levelId: string) => void;
  onClose: () => void;
}

type ScreenView = 'worlds' | 'levels';

export function AdventureMapScreen({
  visible,
  progress,
  selectedWorld,
  colors,
  isPremium,
  resetVersion = 0,
  onSelectWorld,
  onLevelPress,
  onClose,
}: AdventureMapScreenProps) {
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // 2-step navigation: worlds grid first, then levels for selected world.
  const [view, setView] = useState<ScreenView>('worlds');

  // Reset to worlds grid only when the parent signals a fresh open
  // (resetVersion bumps). Returning from a level keeps the levels view.
  useEffect(() => {
    setView('worlds');
  }, [resetVersion]);

  // Play "Choose a world!" intro when worlds grid appears.
  useEffect(() => {
    if (!visible || view !== 'worlds') return;
    const timer = setTimeout(() => voiceRef.current.play('choose_world'), 500);
    return () => clearTimeout(timer);
  }, [visible, view]);

  const handleWorldTap = (worldId: WorldId) => {
    onSelectWorld(worldId);
    setView('levels');
    const clip = WORLD_VOICE[worldId];
    if (clip) voiceRef.current.play(clip);
  };

  const allThemes = getAllThemes();
  const world = ADVENTURE_WORLDS.find(w => w.id === selectedWorld);
  const worldTheme = world
    ? allThemes.find((th: ThemeConfig) => th.id === world.theme)
    : null;
  const bgImage = worldTheme?.backgroundPortrait;
  const worldColors = worldTheme?.colors ?? colors;

  // ── WORLDS GRID ──
  if (view === 'worlds') {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.worldsBackground}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.title}>
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
              contentInsetAdjustmentBehavior="never">
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
                    onPress={() => !isUnlocked ? null : handleWorldTap(w.id)}
                    disabled={!isUnlocked}
                    style={[
                      styles.worldCard,
                      {borderColor: accent},
                      !isUnlocked && styles.worldCardLocked,
                    ]}>
                    <Text style={styles.worldCardEmoji}>
                      <Emoji>{isUnlocked ? w.emoji : '🔒'}</Emoji>
                    </Text>
                    <Text style={styles.worldCardName} numberOfLines={2}>
                      {t(w.nameKey)}
                    </Text>
                    {isUnlocked && (
                      <Text style={[styles.worldCardStars, {color: accent}]}>
                        ⭐ {stars}/{maxStars}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // ── LEVELS MAP for selected world ──
  if (!world) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <ImageBackground
          source={bgImage}
          style={styles.background}
          resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Pressable onPress={() => setView('worlds')} style={styles.backBtn}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  worldsBackground: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // ── World grid layout (like theme picker) ──
  worldsScroll: {
    flex: 1,
  },
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // Generous bottom padding so the orphan card on the last row clears
    // the home-indicator safe area and is comfortably tappable.
    paddingBottom: 96,
    gap: 12,
  },
  worldCard: {
    width: '47%',
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
  worldCardEmoji: {
    fontSize: 56,
  },
  worldCardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  worldCardStars: {
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
