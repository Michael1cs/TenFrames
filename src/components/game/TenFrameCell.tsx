import React from 'react';
import {Pressable, Image, Text, StyleSheet, ImageSourcePropType} from 'react-native';
import {Emoji} from '../common/Emoji';
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
  tokenImage?: ImageSourcePropType;
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
  tokenImage,
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
          opacity: disabled ? 0.75 : 1,
        },
      ]}>
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
          {tokenImage ? (
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

const styles = StyleSheet.create({
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
