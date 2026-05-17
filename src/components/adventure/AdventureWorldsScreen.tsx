import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  ScrollView,
} from 'react-native';
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

  const allThemes = getAllThemes();

  return (
    <ImageBackground
      source={require('../../../assets/backgrounds/pixel/pixel_portrait.jpg')}
      style={styles.background}
      resizeMode="cover">
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
                onPress={() => (!isUnlocked ? null : onSelectWorld(w.id))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  worldCardEmoji: {fontSize: 56},
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
