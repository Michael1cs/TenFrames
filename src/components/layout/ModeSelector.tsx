import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {GameMode, ThemeColors} from '../../types/game';

interface ModeSelectorProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  colors: ThemeColors;
  vertical?: boolean;
}

const modes: {id: GameMode; emoji: string; key: string}[] = [
  {id: 'counting', emoji: '🚀', key: 'modes.counting'},
  {id: 'addition', emoji: '🎈', key: 'modes.addition'},
  {id: 'subtraction', emoji: '💫', key: 'modes.subtraction'},
  {id: 'puzzle', emoji: '🧩', key: 'modes.puzzle'},
];

export function ModeSelector({
  activeMode,
  onModeChange,
  colors,
  vertical = false,
}: ModeSelectorProps) {
  const {t} = useTranslation();

  return (
    <View
      style={[
        styles.container,
        vertical && styles.containerVertical,
      ]}>
      {modes.map(mode => {
        const isActive = activeMode === mode.id;
        return (
          <Pressable
            key={mode.id}
            onPress={() => onModeChange(mode.id)}
            style={[
              styles.tab,
              vertical && styles.tabVertical,
              {
                backgroundColor: isActive
                  ? 'rgba(255,255,255,0.25)'
                  : 'rgba(255,255,255,0.08)',
                borderColor: isActive ? colors.accent : 'transparent',
              },
            ]}>
            <Text style={styles.emoji}>{mode.emoji}</Text>
            <Text
              style={[
                styles.label,
                vertical && styles.labelVertical,
                {
                  color: isActive ? '#FFFFFF' : colors.text,
                  fontWeight: isActive ? 'bold' : 'normal',
                },
              ]}
              numberOfLines={1}>
              {t(mode.key)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  containerVertical: {
    flexDirection: 'column',
    paddingHorizontal: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tabVertical: {
    flex: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  labelVertical: {
    fontSize: 13,
    marginTop: 0,
  },
});
