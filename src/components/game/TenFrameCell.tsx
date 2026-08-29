import React, {useEffect} from 'react';
import {Pressable, Image, StyleSheet, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {Emoji} from '../common/Emoji';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useReduceMotion} from '../../hooks/useReduceMotion';
import {CellState, ThemeColors} from '../../types/game';

interface TenFrameCellProps {
  state: CellState;
  onPress: () => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
  cellSize: number;
  tokenImage?: ImageSourcePropType;
  // If set, this emoji is rendered for every filled cell regardless of
  // state (color1/color2/filled), overriding the theme's marble emoji.
  // Used in adventure levels so the cells match the level's icon.
  overrideEmoji?: string;
  // Hint ladder (second miss): hinted cells pulse an accent ring — these are
  // the ones that need changing; dimmed cells fade back so they read as
  // "already right, leave them".
  hinted?: boolean;
  dimmed?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The two operands must never be separated by hue alone. Measured across all
// ten themes, cellColor1 vs cellColor2 has a WCAG luminance ratio between 1.02
// and 1.97 — space and farm are 1.02, i.e. identical brightness — and in
// Adventure both operands render the SAME glyph via overrideEmoji. For a child
// with any red-green deficiency that turns every addition level into a
// counting level. `ring` is a second, non-colour channel that no theme can
// switch off.
function getCellColors(state: CellState, colors: ThemeColors) {
  switch (state) {
    case 'color1':
      return {
        bg: colors.cellColor1,
        border: colors.cellColor1Border,
        marble: colors.marbleColor1,
        emoji: colors.emojiColor1,
        ring: false,
      };
    case 'color2':
      return {
        bg: colors.cellColor2,
        border: colors.cellColor2Border,
        marble: colors.marbleColor2,
        emoji: colors.emojiColor2,
        ring: true,
      };
    case 'filled':
      return {
        bg: colors.cellFilled,
        border: colors.cellFilledBorder,
        marble: colors.marble,
        emoji: null, // use theme emoji
        ring: false,
      };
    default:
      return {
        bg: colors.cellEmpty,
        border: colors.cellEmptyBorder,
        marble: '',
        emoji: null,
        ring: false,
      };
  }
}

export function TenFrameCell({
  state,
  onPress,
  disabled = false,
  colors,
  emoji,
  cellSize,
  tokenImage,
  overrideEmoji,
  hinted = false,
  dimmed = false,
}: TenFrameCellProps) {
  const scale = useSharedValue(1);
  const isFilled = state !== 'empty';
  const marbleScale = useSharedValue(isFilled ? 1 : 0);

  React.useEffect(() => {
    marbleScale.value = withSpring(isFilled ? 1 : 0, {
      damping: 8,
      stiffness: 150,
    });
  }, [state, isFilled]);

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.9, {duration: 50}),
      withSpring(1, {damping: 4, stiffness: 200}),
    );
    onPress();
  };

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const marbleStyle = useAnimatedStyle(() => ({
    transform: [{scale: marbleScale.value}],
    opacity: marbleScale.value,
  }));

  // Hint ring: an accent overlay that breathes while this cell is the one to
  // fix. Opacity, not transform — the press animation already owns scale, and
  // two competing transforms on one node cancel each other. Under reduce
  // motion the ring holds steady instead of pulsing.
  const reduceMotion = useReduceMotion();
  const hintOpacity = useSharedValue(0);
  useEffect(() => {
    if (hinted) {
      hintOpacity.value = reduceMotion
        ? withTiming(1, {duration: 150})
        : withRepeat(
            withSequence(
              withTiming(1, {duration: 350}),
              withTiming(0.25, {duration: 350}),
            ),
            -1,
            true,
          );
    } else {
      hintOpacity.value = withTiming(0, {duration: 150});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hinted, reduceMotion]);
  const hintStyle = useAnimatedStyle(() => ({opacity: hintOpacity.value}));

  const tokenSize = cellSize * 0.75;
  const cellColors = getCellColors(state, colors);

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.cell,
        cellStyle,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: isFilled ? cellColors.bg : colors.cellEmpty,
          borderColor: isFilled ? cellColors.border : colors.cellEmptyBorder,
          opacity: dimmed ? 0.45 : disabled ? 0.75 : 1,
        },
      ]}>
      {hinted && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hintRing,
            hintStyle,
            {
              borderColor: colors.accent,
              borderWidth: Math.max(2.5, cellSize * 0.055),
            },
          ]}
        />
      )}
      {isFilled && cellColors.ring && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderRadius: 10 - RING_INSET,
              borderColor: cellColors.border,
              borderWidth: Math.max(1.5, cellSize * 0.035),
            },
          ]}
        />
      )}
      {isFilled ? (
        <Animated.View
          style={[
            marbleStyle,
            {
              width: tokenSize,
              height: tokenSize,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          {overrideEmoji ? (
            <Text style={{fontSize: cellSize * 0.5}}>
              <Emoji>{overrideEmoji}</Emoji>
            </Text>
          ) : tokenImage ? (
            <Image
              source={tokenImage}
              style={{width: tokenSize, height: tokenSize}}
              resizeMode="contain"
            />
          ) : (
            <Text style={{fontSize: cellSize * 0.4}}>
              <Emoji>{cellColors.emoji || emoji}</Emoji>
            </Text>
          )}
        </Animated.View>
      ) : (
        !disabled && (
          <Text style={{fontSize: cellSize * 0.3, color: colors.cellEmptyBorder, opacity: 0.5}}>
            +
          </Text>
        )
      )}
    </AnimatedPressable>
  );
}

// Inset of the second-channel ring, in points.
const RING_INSET = 3;

const styles = StyleSheet.create({
  hintRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 10,
  },
  ring: {
    position: 'absolute',
    top: RING_INSET,
    left: RING_INSET,
    right: RING_INSET,
    bottom: RING_INSET,
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
});
