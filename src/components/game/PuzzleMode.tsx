import React from 'react';
import {View, Text, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {CellState, ThemeColors} from '../../types/game';

interface PuzzleModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  onSubmit: () => void;
  onNewPuzzle: () => void;
  puzzleAnswer: number;
  filledCount: number;
  showPuzzleAnswer: boolean;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
}

export function PuzzleMode({
  cells,
  onCellClick,
  onSubmit,
  onNewPuzzle,
  puzzleAnswer,
  filledCount,
  showPuzzleAnswer,
  colors,
  emoji,
  tokenImage,
}: PuzzleModeProps) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.questionBox}>
        <Text style={[styles.question, {color: colors.text}]}>
          {t('game.puzzleDesc', {number: puzzleAnswer})}
        </Text>
        <Text style={[styles.hint, {color: '#FFFFFF'}]}>
          {t('game.puzzleHint')} 👆
        </Text>
      </View>

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
      />

      <NumberDisplay number={filledCount} colors={colors} emoji={emoji} />

      {showPuzzleAnswer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerEmoji}>✅</Text>
          <Text style={styles.answerText}>
            {t('feedback.correctAnswer', {answer: 10 - puzzleAnswer})}
          </Text>
        </View>
      )}

      <View style={styles.buttonsRow}>
        <Pressable
          onPress={onNewPuzzle}
          style={[styles.button, {backgroundColor: '#7C3AED'}]}>
          <Text style={styles.buttonText}>🔄 {t('game.newPuzzle')}</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          style={[styles.button, {backgroundColor: '#16A34A'}]}>
          <Text style={styles.buttonText}>🎯 {t('game.send')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  question: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  hint: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    gap: 8,
  },
  answerEmoji: {
    fontSize: 20,
  },
  answerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
