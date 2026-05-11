import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Emoji} from '../common/Emoji';
import {AgeGroup, BackgroundEmoji, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';

interface WorkshopModeProps {
  paletteEmojis: BackgroundEmoji[];
  colors: ThemeColors;
  ageGroup?: AgeGroup;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PaletteButtonProps {
  emoji: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

function PaletteButton({emoji, active, onPress, colors}: PaletteButtonProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  const handle = () => {
    scale.value = withSequence(
      withTiming(0.85, {duration: 60}),
      withSpring(1, {damping: 5, stiffness: 220}),
    );
    onPress();
  };
  return (
    <AnimatedPressable
      onPress={handle}
      style={[
        styles.paletteBtn,
        style,
        {
          backgroundColor: active ? colors.accent : 'rgba(255,255,255,0.18)',
          borderColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
        },
      ]}>
      <Text style={styles.paletteEmoji}>
        <Emoji>{emoji}</Emoji>
      </Text>
    </AnimatedPressable>
  );
}

interface WorkshopCellProps {
  emoji: string | null;
  onPress: () => void;
  cellSize: number;
  colors: ThemeColors;
}

function WorkshopCell({emoji, onPress, cellSize, colors}: WorkshopCellProps) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(emoji ? 1 : 0);
  useEffect(() => {
    fill.value = withSpring(emoji ? 1 : 0, {damping: 8, stiffness: 150});
  }, [emoji, fill]);

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  const tokenStyle = useAnimatedStyle(() => ({
    transform: [{scale: fill.value}],
    opacity: fill.value,
  }));

  const handle = () => {
    scale.value = withSequence(
      withTiming(0.9, {duration: 50}),
      withSpring(1, {damping: 4, stiffness: 200}),
    );
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handle}
      style={[
        styles.cell,
        cellStyle,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: emoji ? 'rgba(255,255,255,0.25)' : colors.cellEmpty,
          borderColor: emoji ? colors.accent : colors.cellEmptyBorder,
        },
      ]}>
      {emoji ? (
        <Animated.View style={tokenStyle}>
          <Text style={{fontSize: cellSize * 0.55}}>
            <Emoji>{emoji}</Emoji>
          </Text>
        </Animated.View>
      ) : (
        <Text style={{fontSize: cellSize * 0.3, color: colors.cellEmptyBorder, opacity: 0.5}}>+</Text>
      )}
    </AnimatedPressable>
  );
}

export function WorkshopMode({
  paletteEmojis,
  colors,
  ageGroup = 'older',
}: WorkshopModeProps) {
  const {t} = useTranslation();
  const {cellSize} = useLayout(ageGroup);

  // Build a unique palette of up to 6 emojis from the theme's background set.
  const palette = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of paletteEmojis) {
      if (!seen.has(item.emoji)) {
        seen.add(item.emoji);
        out.push(item.emoji);
      }
    }
    return out.slice(0, 6);
  }, [paletteEmojis]);

  const [selected, setSelected] = useState<string>(palette[0] ?? '⭐');
  const [cells, setCells] = useState<(string | null)[]>(() =>
    Array(10).fill(null),
  );

  // Reset selection if theme palette changes (e.g., theme switch mid-session).
  const lastPaletteRef = useRef(palette);
  useEffect(() => {
    if (lastPaletteRef.current !== palette && !palette.includes(selected)) {
      setSelected(palette[0] ?? '⭐');
    }
    lastPaletteRef.current = palette;
  }, [palette, selected]);

  const filledCount = cells.filter(c => c !== null).length;

  const handleCellPress = (idx: number) => {
    setCells(prev => {
      const next = [...prev];
      // Tapping a cell with the same emoji clears it; otherwise stamp the
      // currently selected emoji (works for empty cells and overwrites).
      next[idx] = next[idx] === selected ? null : selected;
      return next;
    });
  };

  const handleClearAll = () => setCells(Array(10).fill(null));

  return (
    <View style={styles.container}>
      <View style={[styles.banner, {backgroundColor: colors.accent}]}>
        <Text style={styles.bannerText}>🎨 {t('workshop.title')}</Text>
      </View>

      <View
        style={[
          styles.frame,
          {borderColor: colors.accent},
        ]}>
        <View style={[styles.grid, {width: 5 * (cellSize + 8)}]}>
          {cells.map((emoji, i) => (
            <WorkshopCell
              key={i}
              emoji={emoji}
              onPress={() => handleCellPress(i)}
              cellSize={cellSize}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.paletteRow}>
        {palette.map(e => (
          <PaletteButton
            key={e}
            emoji={e}
            active={selected === e}
            onPress={() => setSelected(e)}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.counter, {borderColor: colors.accent}]}>
          <Text style={[styles.counterText, {color: colors.numberText}]}>
            {filledCount}/10
          </Text>
        </View>
        <Pressable
          onPress={handleClearAll}
          style={[styles.clearBtn, {backgroundColor: colors.primaryButton}]}>
          <Text style={styles.clearBtnText}>↻</Text>
        </Pressable>
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  frame: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  paletteBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  paletteEmoji: {
    fontSize: 32,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  counterText: {
    fontSize: 32,
    fontWeight: '900',
  },
  clearBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  clearBtnText: {
    fontSize: 38,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 42,
    includeFontPadding: false,
  },
});
