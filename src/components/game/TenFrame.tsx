import React from 'react';
import {View, StyleSheet, ImageSourcePropType} from 'react-native';
import {TenFrameCell} from './TenFrameCell';
import {CellState, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';

interface TenFrameProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
}

export function TenFrame({
  cells,
  onCellClick,
  disabled = false,
  colors,
  emoji,
  tokenImage,
}: TenFrameProps) {
  const {cellSize} = useLayout();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderColor: colors.accent,
        },
      ]}>
      <View style={[styles.grid, {width: 5 * (cellSize + 8)}]}>
        {cells.map((state, index) => (
          <TenFrameCell
            key={index}
            state={state}
            onPress={() => onCellClick(index)}
            disabled={disabled}
            colors={colors}
            emoji={emoji}
            cellSize={cellSize}
            tokenImage={tokenImage}
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
