import React from 'react';
import {View, Text, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {Emoji} from '../common/Emoji';
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
        <Text style={[styles.question, {color: '#FFFFFF'}]}>
          {t('game.puzzleDesc', {number: puzzleAnswer})}
        </Text>
        <Text style={[styles.hint, {color: '#FFFFFF'}]}>
          {t('game.puzzleHint')} <Emoji>👆</Emoji>
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
          <Text style={styles.answerEmoji}><Emoji>✅</Emoji></Text>
          <Text style={styles.answerText}>
            {t('feedback.correctAnswer', {answer: 10 - puzzleAnswer})}
          </Text>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        style={[styles.submitButton, {backgroundColor: '#16A34A'}]}>
        <Text style={styles.submitButtonText}><Emoji>✅</Emoji></Text>
      </Pressable>

      <Pressable
        onPress={onNewPuzzle}
        style={[styles.resetButton, {backgroundColor: '#7C3AED'}]}>
        <Text style={styles.resetButtonText}><Emoji>🔄</Emoji></Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  questionBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
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
  submitButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 36,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 20,
  },
});
