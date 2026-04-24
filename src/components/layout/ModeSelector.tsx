import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {GameMode, ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface ModeSelectorProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  colors: ThemeColors;
  vertical?: boolean;
  getRemainingExercises?: (mode: GameMode) => number;
  isPremium?: boolean;
  onAdventurePress?: () => void;
}

const modes: {id: GameMode; emoji: string; key: string; emojiColor?: string}[] = [
  {id: 'counting', emoji: '🔢', key: 'modes.counting'},
  {id: 'addition', emoji: '+', key: 'modes.addition', emojiColor: '#4ADE80'},
  {id: 'subtraction', emoji: '−', key: 'modes.subtraction', emojiColor: '#F87171'},
  {id: 'puzzle', emoji: '🧩', key: 'modes.puzzle'},
];

export function ModeSelector({
  activeMode,
  onModeChange,
  colors,
  vertical = false,
  getRemainingExercises,
  isPremium = false,
  onAdventurePress,
}: ModeSelectorProps) {
  const {t} = useTranslation();

  if (vertical) {
    // Landscape sidebar mode
    return (
      <View style={styles.containerVertical}>
        {modes.map(mode => {
          const isActive = activeMode === mode.id;
          const isLimited = !isPremium && mode.id !== 'counting';
          const remaining = getRemainingExercises
            ? getRemainingExercises(mode.id)
            : Infinity;
          const isExhausted = isLimited && remaining <= 0;

          return (
            <Pressable
              key={mode.id}
              onPress={() => onModeChange(mode.id)}
              style={[
                styles.tabVertical,
                {
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: isActive ? colors.accent : 'transparent',
                  opacity: isExhausted ? 0.5 : 1,
                },
              ]}>
              <View style={styles.emojiVerticalContainer}>
                <Text style={[styles.emojiVertical, mode.emojiColor ? {color: mode.emojiColor, fontWeight: 'bold', fontSize: 20} : undefined]}><Emoji>{mode.emoji}</Emoji></Text>
              </View>
              <Text
                style={[
                  styles.labelVertical,
                  {
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontWeight: isActive ? 'bold' : 'normal',
                  },
                ]}
                numberOfLines={1}>
                {t(mode.key)}
              </Text>
              {isLimited && remaining < Infinity && (
                <Text
                  style={[
                    styles.remainingVertical,
                    {color: remaining <= 0 ? '#EF4444' : '#F59E0B'},
                  ]}>
                  {remaining}/5
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Portrait bottom tab bar
  return (
    <View style={styles.bottomBar}>
      {modes.map(mode => {
        const isActive = activeMode === mode.id;
        const isLimited = !isPremium && mode.id !== 'counting';
        const remaining = getRemainingExercises
          ? getRemainingExercises(mode.id)
          : Infinity;
        const isExhausted = isLimited && remaining <= 0;

        return (
          <Pressable
            key={mode.id}
            onPress={() => onModeChange(mode.id)}
            style={[
              styles.bottomTab,
              {opacity: isExhausted ? 0.5 : 1},
            ]}>
            <View
              style={[
                styles.bottomTabInner,
                isActive && {
                  backgroundColor: 'rgba(255,255,255,0.35)',
                  borderColor: colors.accent,
                },
              ]}>
              <View style={styles.bottomEmojiContainer}>
                <Text style={[styles.bottomEmoji, mode.emojiColor ? {color: mode.emojiColor, fontWeight: 'bold', fontSize: 26} : undefined]}><Emoji>{mode.emoji}</Emoji></Text>
              </View>
              <Text
                style={[
                  styles.bottomLabel,
                  {
                    color: '#FFFFFF',
                    fontWeight: isActive ? 'bold' : '600',
                  },
                ]}
                numberOfLines={1}>
                {t(mode.key)}
              </Text>
              {isLimited && remaining < Infinity ? (
                <Text
                  style={[
                    styles.remainingBottom,
                    {color: remaining <= 0 ? '#EF4444' : '#F59E0B'},
                  ]}>
                  {remaining}/5
                </Text>
              ) : (
                <Text style={styles.remainingPlaceholder}>{' '}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
      {onAdventurePress && (
        <Pressable onPress={onAdventurePress} style={styles.bottomTab}>
          <View
            style={[
              styles.bottomTabInner,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.25)',
              },
            ]}>
            <View style={styles.bottomEmojiContainer}>
              <Text style={styles.bottomEmoji}><Emoji>🗺️</Emoji></Text>
            </View>
            <Text
              style={[
                styles.bottomLabel,
                {color: '#FFFFFF', fontWeight: '600'},
              ]}
              numberOfLines={1}>
              {t('adventure.title')}
            </Text>
            <Text style={styles.remainingPlaceholder}>{' '}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Bottom tab bar (portrait) */
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
  },
  bottomTabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: '100%',
    minHeight: 64,
  },
  bottomEmojiContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEmoji: {
    fontSize: 22,
  },
  bottomLabel: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  remainingBottom: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  remainingPlaceholder: {
    fontSize: 12,
    marginTop: 1,
    color: 'transparent',
  },
  /* Vertical sidebar (landscape) */
  containerVertical: {
    gap: 4,
  },
  tabVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  emojiVerticalContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiVertical: {
    fontSize: 18,
  },
  labelVertical: {
    fontSize: 15,
    flex: 1,
  },
  remainingVertical: {
    fontSize: 12,
    fontWeight: '700',
  },
});
