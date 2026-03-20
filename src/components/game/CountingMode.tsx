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
      <View style={styles.titleCard}>
        <Text style={[styles.semiTitle, {color: colors.accent}]}>
          Ten Frames
        </Text>
      </View>

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
        style={[styles.iconButton, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.iconButtonText}>🔄</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  titleCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
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
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  iconButtonText: {
    fontSize: 28,
  },
});
