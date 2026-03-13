import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {CellState, Problem, ThemeColors} from '../../types/game';

interface AdditionModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  currentProblem: Problem | null;
  userAnswer: number | null;
  isCorrect: boolean | null;
  hasSubmitted: boolean;
  feedback: string;
  colors: ThemeColors;
  emoji: string;
}

export function AdditionMode({
  cells,
  onCellClick,
  onSubmit,
  onReset,
  currentProblem,
  userAnswer,
  isCorrect,
  hasSubmitted,
  feedback,
  colors,
  emoji,
}: AdditionModeProps) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: colors.accent}]}>
        🛸 {t('game.additionTitle')} 🌌
      </Text>

      {currentProblem && (
        <View style={styles.problemContainer}>
          <Text style={[styles.problem, {color: colors.text}]}>
            <Text style={{color: colors.cellColor1}}>{currentProblem.num1}</Text>
            {' + '}
            <Text style={{color: colors.cellColor2}}>{currentProblem.num2}</Text>
            {' = ?'}
          </Text>
          <Text style={[styles.hint, {color: colors.accent}]}>
            {t('game.additionDesc', {num1: currentProblem.num1, num2: currentProblem.num2})}
          </Text>
          <Text style={[styles.hint, {color: colors.text, opacity: 0.8, fontSize: 11}]}>
            {t('game.additionHint')} 👆
          </Text>
        </View>
      )}

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
      />

      {userAnswer !== null && (
        <NumberDisplay number={userAnswer} colors={colors} emoji={emoji} />
      )}

      {!hasSubmitted && (
        <Pressable
          onPress={onSubmit}
          style={[styles.submitButton, {backgroundColor: colors.accentButton}]}>
          <Text style={styles.buttonText}>🎯 {t('game.submit')}</Text>
        </Pressable>
      )}

      {feedback !== '' && (
        <View
          style={[
            styles.feedbackContainer,
            {
              backgroundColor:
                isCorrect === true
                  ? 'rgba(34,197,94,0.2)'
                  : isCorrect === false
                  ? 'rgba(239,68,68,0.2)'
                  : 'transparent',
              borderColor:
                isCorrect === true
                  ? '#22C55E'
                  : isCorrect === false
                  ? '#EF4444'
                  : 'transparent',
            },
          ]}>
          <Text style={styles.feedbackEmoji}>
            {isCorrect === true ? '✅' : '💡'}
          </Text>
          <Text
            style={[
              styles.feedbackText,
              {color: isCorrect === true ? '#4ADE80' : '#FBBF24'},
            ]}>
            {isCorrect === true
              ? t('feedback.correct')
              : t('feedback.wrong')}
          </Text>
          {currentProblem && (
            <Text style={[styles.answerText, {color: '#FFFFFF'}]}>
              {isCorrect === true
                ? t('feedback.correctAnswer', {answer: currentProblem.answer})
                : t('feedback.answerWas', {answer: currentProblem.answer})}
            </Text>
          )}
        </View>
      )}

      <Pressable
        onPress={onReset}
        style={[styles.button, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.buttonText}>🔄 {t('game.newProblem')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  problemContainer: {
    alignItems: 'center',
  },
  problem: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedbackContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  feedbackEmoji: {
    fontSize: 20,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
