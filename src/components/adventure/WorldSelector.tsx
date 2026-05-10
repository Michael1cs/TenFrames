import React from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {WorldId, AdventureProgress, ThemeColors} from '../../types/game';
import {ADVENTURE_WORLDS, getWorldStars, getWorldMaxStars} from '../../config/adventureWorlds';
import {Emoji} from '../common/Emoji';

interface WorldSelectorProps {
  selectedWorld: WorldId;
  progress: AdventureProgress;
  colors: ThemeColors;
  isPremium: boolean;
  onSelect: (worldId: WorldId) => void;
}

export function WorldSelector({
  selectedWorld,
  progress,
  colors,
  isPremium,
  onSelect,
}: WorldSelectorProps) {
  const {t} = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}>
      {ADVENTURE_WORLDS.map(world => {
        const isSelected = world.id === selectedWorld;
        const isUnlocked = progress.worlds[world.id]?.unlocked;
        const isLocked = !isUnlocked;
        const stars = getWorldStars(world.id, progress);
        const maxStars = getWorldMaxStars(world.id);

        return (
          <Pressable
            key={world.id}
            onPress={() => !isLocked && onSelect(world.id)}
            style={[
              styles.worldButton,
              {
                backgroundColor: isSelected
                  ? colors.primaryButton
                  : isLocked
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.15)',
                borderColor: isSelected
                  ? colors.accent
                  : 'rgba(255,255,255,0.15)',
                opacity: isLocked ? 0.5 : 1,
              },
            ]}>
            <Text style={styles.worldEmoji}>
              <Emoji>{isLocked ? '🔒' : world.emoji}</Emoji>
            </Text>
            <Text style={[styles.worldName, {color: '#FFFFFF'}]} numberOfLines={1}>
              {t(world.nameKey)}
            </Text>
            {!isLocked && (
              <Text style={[styles.worldStars, {color: colors.accent}]}>
                ⭐ {stars}/{maxStars}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  worldButton: {
    width: 110,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
  },
  worldEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  worldName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  worldStars: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
