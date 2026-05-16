import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, StyleSheet, Pressable, Modal, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Emoji} from '../common/Emoji';
import {AgeGroup, BackgroundEmoji, ThemeColors} from '../../types/game';
import {useLayout} from '../../hooks/useLayout';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice, VOICE_GROUPS} from '../../hooks/useVoice';
import {useSound} from '../../hooks/useSound';

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

// Tag each emoji with a category so the entry animation can feel right —
// rockets "lift off", stars sparkle-rotate, hearts/candies pop, rest bounce.
function emojiCategory(e: string | null): 'space' | 'star' | 'pop' | 'default' {
  if (!e) return 'default';
  if (['🚀', '🛸', '☄️', '👽', '🌠'].includes(e)) return 'space';
  if (['⭐', '🌟', '✨', '💫', '🌈'].includes(e)) return 'star';
  if (['❤️', '💖', '🍬', '🍭', '🧁', '🦄', '👑', '💎', '🎉'].includes(e)) return 'pop';
  return 'default';
}

function WorkshopCell({emoji, onPress, cellSize, colors}: WorkshopCellProps) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(emoji ? 1 : 0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    const cat = emojiCategory(emoji);
    if (emoji) {
      fill.value = withSpring(1, {damping: 8, stiffness: 150});
      if (cat === 'space') {
        // "Lift off" — start from below, settle up
        ty.value = 12;
        ty.value = withSpring(0, {damping: 6, stiffness: 220});
      } else if (cat === 'star') {
        // Sparkle: small rotation + scale pulse
        rot.value = -25;
        rot.value = withSequence(
          withTiming(15, {duration: 200}),
          withSpring(0, {damping: 5, stiffness: 180}),
        );
      } else if (cat === 'pop') {
        // Big pop using scale only — handled by fill spring being bouncier
        fill.value = withSequence(
          withTiming(1.25, {duration: 140}),
          withSpring(1, {damping: 4, stiffness: 200}),
        );
      }
    } else {
      fill.value = withSpring(0, {damping: 8, stiffness: 150});
      ty.value = 0;
      rot.value = 0;
    }
  }, [emoji, fill, ty, rot]);

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  const tokenStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: fill.value},
      {translateY: ty.value},
      {rotate: `${rot.value}deg`},
    ],
    opacity: Math.min(1, fill.value),
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
  const [showAllEmoji, setShowAllEmoji] = useState(false);

  // All unique emojis across every theme — used by the "More" modal so the
  // child isn't locked to the current theme's palette.
  const allEmojis = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const th of getAllThemes()) {
      for (const item of th.backgroundEmojis) {
        if (!seen.has(item.emoji)) {
          seen.add(item.emoji);
          out.push(item.emoji);
        }
      }
    }
    return out;
  }, []);

  // Reset selection if theme palette changes (e.g., theme switch mid-session).
  const lastPaletteRef = useRef(palette);
  useEffect(() => {
    if (lastPaletteRef.current !== palette && !palette.includes(selected)) {
      setSelected(palette[0] ?? '⭐');
    }
    lastPaletteRef.current = palette;
  }, [palette, selected]);

  const filledCount = cells.filter(c => c !== null).length;

  // Speak the number every time the count changes (paint-and-count) so
  // Workshop doubles as a counting reinforcement instead of being silent.
  // Praise milestones at 5 and 10 (filling half / filling full).
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const {play: playSound} = useSound();
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;
  const prevCountRef = useRef(filledCount);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (filledCount !== prev) {
      if (filledCount > prev) playSoundRef.current('tap');
      if (filledCount >= 1 && filledCount <= 10) {
        voiceRef.current.play(`num_${filledCount}`);
      }
      if (filledCount > prev && (filledCount === 5 || filledCount === 10)) {
        // Brief celebratory praise on milestones; star sound for full.
        setTimeout(() => {
          voiceRef.current.playRandom(VOICE_GROUPS.correct);
          if (filledCount === 10) playSoundRef.current('star');
        }, 700);
      }
    }
    prevCountRef.current = filledCount;
  }, [filledCount]);

  const handleCellPress = (idx: number) => {
    setCells(prev => {
      const next = [...prev];
      // Tap on a filled cell always clears it (regardless of what emoji is
      // selected) — simpler mental model than the previous "tap same to
      // clear, tap different to overwrite". Tap empty stamps the selected.
      next[idx] = next[idx] === null ? selected : null;
      return next;
    });
  };

  const handleClearAll = () => setCells(Array(10).fill(null));

  const isFull = filledCount === 10;

  return (
    <View style={styles.container}>
      {/* Header: title + live count + reset button inline. Cleaner than the
          previous "counter+button footer block" that competed visually with
          the palette and celebration banner. */}
      <View style={styles.headerRow}>
        <View style={[styles.banner, {backgroundColor: colors.accent}]}>
          <Text style={styles.bannerText}>
            🎨 {filledCount}/10
          </Text>
        </View>
        <Pressable
          onPress={handleClearAll}
          style={[styles.headerResetBtn, {backgroundColor: colors.primaryButton}]}>
          <Text style={styles.headerResetText}>↻</Text>
        </Pressable>
      </View>

      {/* Mini celebration when the child fills the whole ten frame. */}
      {isFull && (
        <Animated.View
          entering={BounceIn.duration(500)}
          style={[styles.celebration, {backgroundColor: colors.accent}]}>
          <Text style={styles.celebrationText}>🎉 🌟 🎉</Text>
        </Animated.View>
      )}

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
        <PaletteButton
          emoji="🌈"
          active={false}
          onPress={() => setShowAllEmoji(true)}
          colors={colors}
        />
      </View>

      {/* "All emojis" picker — pulls one of every emoji used by every theme,
          so the child isn't locked to the current theme's tiny palette. */}
      <Modal
        visible={showAllEmoji}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllEmoji(false)}>
        <View style={styles.allEmojiBackdrop}>
          <View style={[styles.allEmojiSheet, {backgroundColor: colors.accent}]}>
            <View style={styles.allEmojiHeader}>
              <Text style={styles.allEmojiTitle}>🌈</Text>
              <Pressable
                onPress={() => setShowAllEmoji(false)}
                style={styles.allEmojiClose}>
                <Text style={styles.allEmojiCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.allEmojiGrid}>
              {allEmojis.map(e => (
                <Pressable
                  key={e}
                  onPress={() => {
                    setSelected(e);
                    setShowAllEmoji(false);
                  }}
                  style={[
                    styles.allEmojiCell,
                    selected === e && {
                      backgroundColor: 'rgba(255,255,255,0.35)',
                    },
                  ]}>
                  <Text style={styles.allEmojiText}>
                    <Emoji>{e}</Emoji>
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerResetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerResetText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 30,
    includeFontPadding: false,
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
  celebration: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  celebrationText: {
    fontSize: 28,
    textAlign: 'center',
  },
  allEmojiBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  allEmojiSheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  allEmojiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  allEmojiTitle: {
    fontSize: 32,
  },
  allEmojiClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allEmojiCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  allEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 32,
  },
  allEmojiCell: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  allEmojiText: {
    fontSize: 32,
  },
});
