import React from 'react';
import {View, StyleSheet} from 'react-native';
import {GameMode, ThemeColors} from '../../types/game';

interface ModeIconProps {
  mode: GameMode | 'adventure';
  size: number; // square bounding box, icon scales inside
  colors: ThemeColors;
}

// The mode bar's icon family, drawn entirely from the app's own geometry —
// the rounded ten-frame cell and the dot — in the active theme's colors.
// No emoji, no font glyphs: pre-readers navigate by shape and color, and
// every shape here is one the child already knows from the game itself.
//   counting    → the 2×5 frame, three cells filled
//   addition    → a plus built from two rounded bars (the equation's green)
//   subtraction → one rounded bar (the equation's red)
//   answer      → the number-pad bubble holding three dots ("count, then name")
//   puzzle      → the frame with one missing, dashed cell ("complete it")
//   compare     → a big dot and a small dot
//   workshop    → a mini grid of differently-colored cells (free creation)
//   adventure   → three path nodes climbing, the top one gold
export function ModeIcon({mode, size, colors}: ModeIconProps) {
  const s = size;

  if (mode === 'counting' || mode === 'puzzle') {
    const cell = Math.floor(s / 6);
    const gap = Math.max(1, Math.floor(cell / 4));
    const isPuzzle = mode === 'puzzle';
    // counting: first 3 filled; puzzle: all but the last filled.
    const filledCount = isPuzzle ? 9 : 3;
    return (
      <View style={[styles.box, {width: s, height: s}]}>
        <View style={{gap}}>
          {[0, 1].map(row => (
            <View key={row} style={[styles.row, {gap}]}>
              {[0, 1, 2, 3, 4].map(col => {
                const i = row * 5 + col;
                const filled = i < filledCount;
                const missing = isPuzzle && i === 9;
                return (
                  <View
                    key={col}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: Math.max(2, cell / 4),
                      backgroundColor: filled
                        ? colors.cellFilled
                        : 'transparent',
                      borderWidth: 1.5,
                      borderColor: filled
                        ? colors.cellFilledBorder
                        : 'rgba(255,255,255,0.8)',
                      borderStyle: missing ? 'dashed' : 'solid',
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (mode === 'addition' || mode === 'subtraction') {
    const barLong = s * 0.72;
    const barThick = s * 0.22;
    const color = mode === 'addition' ? '#4ADE80' : '#F87171';
    return (
      <View style={[styles.box, {width: s, height: s}]}>
        <View
          style={{
            width: barLong,
            height: barThick,
            borderRadius: barThick / 2,
            backgroundColor: color,
          }}
        />
        {mode === 'addition' && (
          <View
            style={{
              position: 'absolute',
              width: barThick,
              height: barLong,
              borderRadius: barThick / 2,
              backgroundColor: color,
            }}
          />
        )}
      </View>
    );
  }

  if (mode === 'answer') {
    const dot = s * 0.13;
    return (
      <View style={[styles.box, {width: s, height: s}]}>
        <View
          style={[
            styles.box,
            {
              width: s * 0.8,
              height: s * 0.8,
              borderRadius: s * 0.4,
              borderWidth: 2.5,
              borderColor: '#FBBF24',
              backgroundColor: 'rgba(255,255,255,0.92)',
            },
          ]}>
          <View style={[styles.row, {gap: dot * 0.5}]}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: colors.cellFilled,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'compare') {
    return (
      <View style={[styles.box, styles.row, {width: s, height: s, gap: s * 0.1}]}>
        <View
          style={{
            width: s * 0.52,
            height: s * 0.52,
            borderRadius: s * 0.26,
            backgroundColor: colors.cellColor1,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.8)',
          }}
        />
        <View
          style={{
            width: s * 0.28,
            height: s * 0.28,
            borderRadius: s * 0.14,
            backgroundColor: colors.cellColor2,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.8)',
          }}
        />
      </View>
    );
  }

  if (mode === 'workshop') {
    const cell = Math.floor(s / 3.4);
    const gap = Math.max(1.5, cell / 5);
    const palette = [
      colors.cellColor1,
      '#FBBF24',
      colors.cellColor2,
      '#4ADE80',
      '#60A5FA',
      '#F472B6',
    ];
    return (
      <View style={[styles.box, {width: s, height: s}]}>
        <View style={{gap}}>
          {[0, 1].map(row => (
            <View key={row} style={[styles.row, {gap}]}>
              {[0, 1, 2].map(col => (
                <View
                  key={col}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: Math.max(2, cell / 4),
                    backgroundColor: palette[row * 3 + col],
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // adventure: three path nodes climbing to a gold summit
  const small = s * 0.26;
  const mid = s * 0.32;
  const big = s * 0.4;
  return (
    <View style={{width: s, height: s}}>
      <View
        style={[
          styles.node,
          {
            left: 0,
            bottom: 0,
            width: small,
            height: small,
            borderRadius: small / 2,
            backgroundColor: colors.cellColor2,
          },
        ]}
      />
      <View
        style={[
          styles.node,
          {
            left: s * 0.3,
            bottom: s * 0.28,
            width: mid,
            height: mid,
            borderRadius: mid / 2,
            backgroundColor: colors.cellColor1,
          },
        ]}
      />
      <View
        style={[
          styles.node,
          {
            right: 0,
            top: 0,
            width: big,
            height: big,
            borderRadius: big / 2,
            backgroundColor: '#FBBF24',
            borderColor: '#FCD34D',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  node: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
