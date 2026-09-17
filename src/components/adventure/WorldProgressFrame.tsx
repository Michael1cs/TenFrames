import React from 'react';
import {View, StyleSheet} from 'react-native';

// The tray and slot colors the world illustrations are drawn with, so the
// progress frame under a card reads as part of the same picture.
const TRAY = '#FFF4DC';
const SLOT = '#22305A';
const GOLD = '#FFC93C';

interface WorldProgressFrameProps {
  completed: number; // levels finished in this world
  total: number; // levels in this world, bonus included
  cellSize: number;
  accent: string; // the world's theme accent fills the cells
}

// A world's progress as a miniature ten frame, filling the top row first,
// left to right, the way the child fills the real one. A pre-reader can't
// parse "12/30", but "the tray is nearly full" needs no reading. The tray
// only fills completely when every level is done — and then it turns gold,
// which is the badge for a finished world. One level done always shows at
// least one cell, so the first win is visible on the map right away.
export function WorldProgressFrame({
  completed,
  total,
  cellSize,
  accent,
}: WorldProgressFrameProps) {
  const done = total > 0 && completed >= total;
  const filled = done
    ? 10
    : completed <= 0
    ? 0
    : Math.min(9, Math.max(1, Math.round((completed / total) * 10)));
  const gap = Math.max(2, Math.round(cellSize / 4));
  const fill = done ? GOLD : accent;
  const cellRadius = Math.max(2, cellSize / 4);

  return (
    <View
      style={[
        styles.tray,
        {padding: gap, gap, borderRadius: gap * 2.5},
        done && styles.trayDone,
      ]}>
      {[0, 1].map(row => (
        <View key={row} style={[styles.row, {gap}]}>
          {[0, 1, 2, 3, 4].map(col => {
            const i = row * 5 + col;
            return (
              <View
                key={col}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellRadius,
                  backgroundColor: i < filled ? fill : SLOT,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: TRAY,
  },
  trayDone: {
    borderWidth: 2,
    borderColor: GOLD,
  },
  row: {
    flexDirection: 'row',
  },
});
