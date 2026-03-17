import React from 'react';
import {View, Text, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
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
  tokenImage?: ImageSourcePropType;
}

export function CountingMode({
  cells,
  onCellClick,
  onReset,
  filledCount,
  colors,
  emoji,
  tokenImage,
}: CountingModeProps) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.semiTitle, {color: colors.accent}]}>
        Ten Frames
      </Text>

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
      />

      <NumberDisplay number={filledCount} colors={colors} emoji={emoji} />

      <Text style={[styles.feedback, {color: colors.accent}]}>
        {t('game.youHave', {count: filledCount})}
      </Text>

      <Pressable
        onPress={onReset}
        style={[styles.button, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.buttonText}>🔄 {t('game.reset')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  semiTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  feedback: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
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
