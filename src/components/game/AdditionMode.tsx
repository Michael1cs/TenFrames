import React from 'react';
import {View, Text, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
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
  tokenImage?: ImageSourcePropType;
  level: number;
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
  tokenImage,
  level,
}: AdditionModeProps) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.levelBadge, {backgroundColor: colors.accent}]}>
        <Text style={styles.levelText}>⭐ Level {level} ⭐</Text>
      </View>

      {currentProblem && (
        <View style={styles.problemContainer}>
          <Text style={[styles.problem, {color: colors.text}]}>
            <Text style={{color: colors.cellColor1}}>{currentProblem.num1}</Text>
            {' + '}
            <Text style={{color: colors.cellColor2}}>{currentProblem.num2}</Text>
            {' = ?'}
          </Text>
          <Text style={[styles.hint, {color: '#FFFFFF'}]}>
            {t('game.additionHint')} 👆
          </Text>
        </View>
      )}

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
      />

      {userAnswer !== null && (
        <NumberDisplay number={userAnswer} colors={colors} emoji={emoji} />
      )}

      {!hasSubmitted && (
        <Pressable
          onPress={onSubmit}
          style={[styles.submitButton, {backgroundColor: '#16A34A'}]}>
          <Text style={styles.submitButtonText}>✅</Text>
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
        style={[styles.resetButton, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.resetButtonText}>🔄</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  problemContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 4,
  },
  problem: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  hint: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
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
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 20,
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
