import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {GameMode, ThemeColors} from '../../types/game';

// Hand-made icon set (glossy clay style, one visual family) for the modes
// that have one; the remaining modes fall back to the drawn shapes below
// until their images join the set.
const ICON_IMAGES: Partial<Record<GameMode | 'adventure', any>> = {
  counting: require('../../../assets/icons/mode_counting.png'),
  addition: require('../../../assets/icons/mode_addition.png'),
  subtraction: require('../../../assets/icons/mode_subtraction.png'),
  compare: require('../../../assets/icons/mode_compare.png'),
  workshop: require('../../../assets/icons/mode_workshop.png'),
  adventure: require('../../../assets/icons/mode_adventure.png'),
};

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

  const image = ICON_IMAGES[mode];
  if (image) {
    return (
      <Image
        source={image}
        style={{width: s, height: s}}
        resizeMode="contain"
      />
    );
  }

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

  // adventure: a folded map — parchment with two fold lines and a dotted
  // route climbing to a gold destination. Still only cells and dots.
  const mapW = s * 0.92;
  const mapH = s * 0.68;
  const dot = s * 0.09;
  const dest = s * 0.16;
  return (
    <View style={[styles.box, {width: s, height: s}]}>
      <View
        style={{
          width: mapW,
          height: mapH,
          borderRadius: s * 0.12,
          backgroundColor: 'rgba(255,252,242,0.95)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.9)',
          overflow: 'hidden',
        }}>
        {/* fold lines */}
        {[1, 2].map(i => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (mapW / 3) * i,
              top: 0,
              bottom: 0,
              width: 1.2,
              backgroundColor: 'rgba(30,27,75,0.16)',
            }}
          />
        ))}
        {/* dotted route, lower-left to upper-right */}
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: mapW * (0.12 + i * 0.22),
              top: mapH * (0.62 - i * 0.18),
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: i % 2 === 0 ? colors.cellColor1 : colors.cellColor2,
            }}
          />
        ))}
        {/* gold destination */}
        <View
          style={{
            position: 'absolute',
            right: mapW * 0.08,
            top: mapH * 0.1,
            width: dest,
            height: dest,
            borderRadius: dest / 2,
            backgroundColor: '#FBBF24',
            borderWidth: 1.2,
            borderColor: '#B45309',
          }}
        />
      </View>
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
});
