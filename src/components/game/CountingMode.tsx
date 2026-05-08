import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {AgeGroup, CellState, ThemeColors} from '../../types/game';

interface CountingModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  onReset: () => void;
  filledCount: number;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
  ageProfile?: AgeProfile;
  onCelebrate?: () => void;
}

export function CountingMode({
  cells,
  onCellClick,
  onReset,
  filledCount,
  colors,
  emoji,
  tokenImage,
  ageGroup = 'older',
  ageProfile,
  onCelebrate,
}: CountingModeProps) {
  const {t} = useTranslation();
  const compact = ageProfile?.compact ?? false;
  const fontScale = ageProfile?.fontScale ?? 1;

  // Auto-reset for young profile when frame fills up: celebrate, then reset.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (!compact) {
      celebratedRef.current = false;
      return;
    }
    if (filledCount === 10 && !celebratedRef.current) {
      celebratedRef.current = true;
      onCelebrate?.();
      const timer = setTimeout(() => {
        onReset();
        celebratedRef.current = false;
      }, 1800);
      return () => clearTimeout(timer);
    }
    if (filledCount < 10) {
      celebratedRef.current = false;
    }
  }, [filledCount, compact, onCelebrate, onReset]);

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={styles.titleCard}>
          <Text style={[styles.semiTitle, {color: colors.accent}]}>
            Ten Frames
          </Text>
        </View>
      )}

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
        ageGroup={ageGroup}
      />

      <NumberDisplay
        number={filledCount}
        colors={colors}
        emoji={emoji}
        scale={fontScale}
      />

      {!compact && (
        <Text style={[styles.feedback, {color: colors.accent}]}>
          {t('game.youHave', {count: filledCount})}
        </Text>
      )}

      <Pressable
        onPress={onReset}
        style={[styles.iconButton, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.iconButtonText}>↻</Text>
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
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  feedback: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  iconButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  iconButtonText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 62,
    includeFontPadding: false,
  },
});
