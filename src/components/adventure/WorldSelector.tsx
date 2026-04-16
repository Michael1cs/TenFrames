import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  worldButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
  },
  worldEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  worldName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  worldStars: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
