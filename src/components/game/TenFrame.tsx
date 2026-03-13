import React from 'react';
import {View, StyleSheet} from 'react-native';
import {TenFrameCell} from './TenFrameCell';
import {CellState, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';

interface TenFrameProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
}

export function TenFrame({
  cells,
  onCellClick,
  disabled = false,
  colors,
  emoji,
}: TenFrameProps) {
  const {cellSize} = useLayout();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundFrom,
          borderColor: colors.accent,
        },
      ]}>
      <View style={styles.grid}>
        {cells.map((state, index) => (
          <TenFrameCell
            key={index}
            state={state}
            onPress={() => onCellClick(index)}
            disabled={disabled}
            colors={colors}
            emoji={emoji}
            cellSize={cellSize}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
