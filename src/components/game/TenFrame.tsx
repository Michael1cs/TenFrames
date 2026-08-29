import React from 'react';
import {View, StyleSheet, ImageSourcePropType} from 'react-native';
import {TenFrameCell} from './TenFrameCell';
import {AgeGroup, CellState, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';

interface TenFrameProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
  // Override the per-cell emoji (used in adventure to make filled cells
  // show the level's icon instead of the theme's generic marble).
  overrideEmoji?: string;
  // Hint-ladder support: these cells pulse (they need changing); while any
  // hint is up, the other occupied cells dim so the eye lands on the fix.
  hintedCells?: number[];
}

export function TenFrame({
  cells,
  onCellClick,
  disabled = false,
  colors,
  emoji,
  tokenImage,
  ageGroup = 'older',
  overrideEmoji,
  hintedCells,
}: TenFrameProps) {
  const {cellSize} = useLayout(ageGroup);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderColor: colors.accent,
        },
      ]}>
      {/* Two explicit rows of five, not one wrapping row of ten. The whole
          point of a ten frame is the five-structure — that a full top row IS
          five and can be seen without recounting — and a uniform 4pt margin on
          a flexWrap row marks nothing. The gap plus the hairline is what makes
          "five and three more" visible. */}
      <View style={{width: 5 * (cellSize + 8)}}>
        {[0, 1].map(row => (
          <React.Fragment key={row}>
            {row === 1 && (
              <View
                style={[
                  styles.fiveRule,
                  {marginVertical: Math.max(3, cellSize * 0.09), backgroundColor: colors.accent},
                ]}
              />
            )}
            <View style={styles.row}>
              {cells.slice(row * 5, row * 5 + 5).map((state, i) => {
                const index = row * 5 + i;
                const hinted = hintedCells?.includes(index) ?? false;
                const dimmed =
                  !!hintedCells?.length && !hinted && state !== 'empty';
                return (
                  <TenFrameCell
                    key={index}
                    state={state}
                    onPress={() => onCellClick(index)}
                    disabled={disabled}
                    colors={colors}
                    emoji={emoji}
                    cellSize={cellSize}
                    tokenImage={tokenImage}
                    overrideEmoji={overrideEmoji}
                    hinted={hinted}
                    dimmed={dimmed}
                  />
                );
              })}
            </View>
          </React.Fragment>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fiveRule: {
    height: 1,
    opacity: 0.35,
    marginHorizontal: 4,
  },
});
