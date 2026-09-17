import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ImageSourcePropType} from 'react-native';
import {TenFrameCell} from './TenFrameCell';
import {CellState, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';
import {GhostHandDemo, DemoPoint} from './GhostHandDemo';
import {
  DemoMode,
  hasSeenDemo,
  markDemoSeen,
  pickDemoTargets,
} from '../../utils/firstTimeDemo';

// Long enough for the frame to fade in and the instruction to start.
const DEMO_START_MS = 900;

interface TenFrameProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  // Override the per-cell emoji (used in adventure to make filled cells
  // show the level's icon instead of the theme's generic marble).
  overrideEmoji?: string;
  // Hint-ladder support: these cells pulse (they need changing); while any
  // hint is up, the other occupied cells dim so the eye lands on the fix.
  hintedCells?: number[];
  // The mode being played, for the one-time ghost-hand demonstration of
  // how to use the frame. Omit on frames the child doesn't tap to answer.
  demo?: DemoMode;
}

export function TenFrame({
  cells,
  onCellClick,
  disabled = false,
  colors,
  emoji,
  tokenImage,
  overrideEmoji,
  hintedCells,
  demo,
}: TenFrameProps) {
  const {cellSize} = useLayout();

  // First visit to a tap-the-frame mode: show the gesture once. The board is
  // read when the demo starts (it may have been pre-filled after mount), and
  // the demo is marked seen then — or at the child's first tap, whichever
  // comes first.
  const [demoTargets, setDemoTargets] = useState<number[] | null>(null);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  useEffect(() => {
    if (!demo || disabled) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || (await hasSeenDemo(demo)) || cancelled) return;
      const targets = pickDemoTargets(demo, cellsRef.current);
      if (!targets.length) return;
      markDemoSeen(demo);
      setDemoTargets(targets);
    }, DEMO_START_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [demo, disabled]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (demo) {
        markDemoSeen(demo);
        setDemoTargets(null);
      }
      onCellClick(index);
    },
    [demo, onCellClick],
  );

  // Cell centers in the grid's own coordinates: every cell is cellSize plus
  // a 4pt margin on each side, and the second row sits below the five-rule.
  const ruleMargin = Math.max(3, cellSize * 0.09);
  const cellCenter = (index: number): DemoPoint => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const step = cellSize + 8;
    return {
      x: col * step + 4 + cellSize / 2,
      y: row * step + row * (1 + ruleMargin * 2) + 4 + cellSize / 2,
    };
  };

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
                    onPress={() => handleCellClick(index)}
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
        {demo && demoTargets && (
          <GhostHandDemo
            targets={demoTargets.map(cellCenter)}
            kind={demo === 'subtraction' ? 'remove' : 'add'}
            cellSize={cellSize}
            colors={colors}
            onDone={() => setDemoTargets(null)}
          />
        )}
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
