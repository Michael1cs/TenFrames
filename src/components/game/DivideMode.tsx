import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {AgeGroup, CellState, Problem, ThemeColors} from '../../types/game';

interface DivideModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  currentProblem: Problem | null;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
  // Auto-submit when child reaches the target split exactly. Parent handles
  // advancing to the next problem.
  onMatch?: () => void;
}

export function DivideMode({
  cells,
  onCellClick,
  currentProblem,
  colors,
  emoji,
  tokenImage,
  ageGroup = 'young',
  onMatch,
}: DivideModeProps) {
  const {t} = useTranslation();

  const color1Count = cells.filter(c => c === 'color1').length;
  const color2Count = cells.filter(c => c === 'color2').length;

  // Fire onMatch once when the split matches the target. Latch via ref so we
  // don't double-fire on re-renders before the parent advances.
  const matchedRef = useRef(false);
  const onMatchRef = useRef(onMatch);
  onMatchRef.current = onMatch;
  useEffect(() => {
    matchedRef.current = false;
  }, [currentProblem]);
  useEffect(() => {
    if (!currentProblem || matchedRef.current) return;
    if (
      color1Count === currentProblem.num1 &&
      color2Count === currentProblem.num2
    ) {
      matchedRef.current = true;
      // Brief pause so child can see the final state before advancing.
      const timer = setTimeout(() => onMatchRef.current?.(), 900);
      return () => clearTimeout(timer);
    }
  }, [color1Count, color2Count, currentProblem]);

  if (!currentProblem) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, {backgroundColor: colors.accent}]}>
        <Text style={styles.bannerText}>
          {currentProblem.answer} = {currentProblem.num1} + {currentProblem.num2}
        </Text>
      </View>

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
        ageGroup={ageGroup}
      />

      <View style={styles.countsRow}>
        <View
          style={[
            styles.countBox,
            {backgroundColor: colors.cellColor1, borderColor: colors.cellColor1Border},
          ]}>
          <Text style={styles.countText}>{color1Count}</Text>
        </View>
        <Text style={styles.plus}>+</Text>
        <View
          style={[
            styles.countBox,
            {backgroundColor: colors.cellColor2, borderColor: colors.cellColor2Border},
          ]}>
          <Text style={styles.countText}>{color2Count}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  banner: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countBox: {
    minWidth: 72,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
  },
  countText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  plus: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
