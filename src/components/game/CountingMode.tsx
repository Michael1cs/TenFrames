import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {CellState, ThemeColors} from '../../types/game';

interface CountingModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  onReset: () => void;
  filledCount: number;
  colors: ThemeColors;
  emoji: string;
}

export function CountingMode({
  cells,
  onCellClick,
  onReset,
  filledCount,
  colors,
  emoji,
}: CountingModeProps) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: colors.accent}]}>
        🚀 {t('game.countingTitle')} 🪐
      </Text>
      <Text style={[styles.description, {color: colors.text}]}>
        {t('game.countingDesc')} 💎
      </Text>

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
      />

      <NumberDisplay number={filledCount} colors={colors} emoji={emoji} />

      <Text style={[styles.feedback, {color: colors.accent}]}>
        {t('game.youHave', {count: filledCount})}
      </Text>

      <Pressable
        onPress={onReset}
        style={[
          styles.button,
          {backgroundColor: colors.primaryButton},
        ]}>
        <Text style={styles.buttonText}>🔄 {t('game.reset')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  feedback: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
