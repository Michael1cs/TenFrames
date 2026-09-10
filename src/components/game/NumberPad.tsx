import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {Text} from '../common/AppText';
import {ThemeColors} from '../../types/game';

interface NumberPadProps {
  onPick: (n: number) => void;
  colors: ThemeColors;
  disabled?: boolean;
  // Bubble to light up green — the correct answer (praise or reveal assist).
  highlight?: number | null;
  // Bubble the child just picked wrongly — tinted red until the next attempt.
  wrongPick?: number | null;
}

// Two rows (0-5, 6-10) of tap bubbles. The child answers by NAMING the
// number, so the bubbles are the submit button — big targets, high contrast
// on every theme background.
export function NumberPad({
  onPick,
  colors,
  disabled = false,
  highlight = null,
  wrongPick = null,
}: NumberPadProps) {
  const renderRow = (numbers: number[]) => (
    <View style={styles.row}>
      {numbers.map(n => {
        const isHighlight = highlight === n;
        const isWrong = wrongPick === n;
        return (
          <Pressable
            key={n}
            disabled={disabled}
            onPress={() => onPick(n)}
            style={({pressed}) => [
              styles.bubble,
              {borderColor: colors.numberBorder},
              isHighlight && styles.bubbleCorrect,
              isWrong && styles.bubbleWrong,
              pressed && !disabled && styles.bubblePressed,
            ]}>
            <Text
              style={[
                styles.bubbleText,
                (isHighlight || isWrong) && styles.bubbleTextOnColor,
              ]}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderRow([0, 1, 2, 3, 4, 5])}
      {renderRow([6, 7, 8, 9, 10])}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  bubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  bubblePressed: {
    transform: [{scale: 0.92}],
  },
  bubbleCorrect: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  bubbleWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  bubbleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  bubbleTextOnColor: {
    color: '#FFFFFF',
  },
});
