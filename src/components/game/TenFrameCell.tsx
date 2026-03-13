import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {CellState, ThemeColors} from '../../types/game';

interface TenFrameCellProps {
  state: CellState;
  onPress: () => void;
  disabled?: boolean;
  colors: ThemeColors;
  emoji: string;
  cellSize: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getCellColors(state: CellState, colors: ThemeColors) {
  switch (state) {
    case 'color1':
      return {
        bg: colors.cellColor1,
        border: colors.cellColor1Border,
        marble: colors.marbleColor1,
        emoji: colors.emojiColor1,
      };
    case 'color2':
      return {
        bg: colors.cellColor2,
        border: colors.cellColor2Border,
        marble: colors.marbleColor2,
        emoji: colors.emojiColor2,
      };
    case 'filled':
      return {
        bg: colors.cellFilled,
        border: colors.cellFilledBorder,
        marble: colors.marble,
        emoji: null, // use theme emoji
      };
    default:
      return {
        bg: colors.cellEmpty,
        border: colors.cellEmptyBorder,
        marble: '',
        emoji: null,
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

  const marbleSize = cellSize * 0.7;
  const cellColors = getCellColors(state, colors);
  const displayEmoji = cellColors.emoji || emoji;

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
          opacity: disabled ? 0.75 : 1,
        },
      ]}>
      {isFilled ? (
        <Animated.View
          style={[
            marbleStyle,
            {
              width: marbleSize,
              height: marbleSize,
              borderRadius: marbleSize / 2,
              backgroundColor: cellColors.marble,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 2,
            },
          ]}>
          <Text style={{fontSize: cellSize * 0.4}}>{displayEmoji}</Text>
        </Animated.View>
      ) : (
        !disabled && (
          <Text style={{fontSize: cellSize * 0.35, color: 'rgba(255,255,255,0.3)'}}>
            +
          </Text>
        )
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
