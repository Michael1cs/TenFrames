import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberDisplay} from './NumberDisplay';
import {Emoji} from '../common/Emoji';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {CellState, Problem, ThemeColors} from '../../types/game';
import {STOP_JUDGE_MS} from '../../config/timing';
import {hasEngaged} from '../../utils/answerTiming';

interface SubtractionModeProps {
  // False while something covers the frame (the setup modal on first run):
  // the ghost-hand demo would play unseen and mark itself as shown.
  demoEnabled?: boolean;
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
  ageProfile?: AgeProfile;
}

export function SubtractionMode({
  demoEnabled,
  cells,
  onCellClick,
  onSubmit,
  onReset,
  currentProblem,
  userAnswer,
  hasSubmitted,
  colors,
  emoji,
  tokenImage,
  level,
  ageProfile,
}: SubtractionModeProps) {
  const {t} = useTranslation();
  const compact = ageProfile?.compact ?? false;
  const fontScale = ageProfile?.fontScale ?? 1;

  // Auto-submit for young profile:
  //   - exact answer        → submit immediately (fast positive feedback)
  //   - removed too many     → submit after 2s grace (wrong feedback)
  //   - hasn't removed enough → wait, child is still working
  // Reset the "already submitted" guard whenever the board is re-opened for
  // answering — a new problem, or the same problem coming back for retry
  // after a wrong answer (hasSubmitted drops to false but problemKey doesn't
  // change). Keying on problemKey alone left the retry locked: compact mode
  // hides the submit button and auto-submit bailed on the stale ref.
  const autoSubmittedRef = useRef(false);
  const problemKey = currentProblem
    ? `${currentProblem.num1}-${currentProblem.num2}`
    : null;
  useEffect(() => {
    if (!hasSubmitted) {
      autoSubmittedRef.current = false;
    }
  }, [problemKey, hasSubmitted]);
  // Judge where the child STOPS, not where the app catches them. This used to
  // submit 350ms after userAnswer MATCHED the answer, so a child removed
  // counters on the way to a larger, wrong number was stopped and congratulated
  // exactly as they passed through the right one — overshooting was impossible
  // and every such problem was recorded first-try correct. Now one debounce
  // re-arms on every change and judges whatever is on the board when the
  // tapping stops, right or wrong. Same rule as AdventureLevelScreen.
  useEffect(() => {
    if (!compact || !currentProblem || hasSubmitted) return;
    if (autoSubmittedRef.current) return;
    // "not null" is not the same as "answered" — see hasEngaged.
    if (!hasEngaged(userAnswer, currentProblem)) return;
    const t = setTimeout(() => {
      autoSubmittedRef.current = true;
      onSubmit();
    }, STOP_JUDGE_MS);
    return () => clearTimeout(t);
  }, [userAnswer, currentProblem, hasSubmitted, compact, onSubmit]);

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={[styles.levelBadge, {backgroundColor: colors.accent}]}>
          <Text style={styles.levelText}><Emoji>⭐</Emoji> Level {level} <Emoji>⭐</Emoji></Text>
        </View>
      )}

      {currentProblem && (
        <View style={styles.problemContainer}>
          <Text style={[styles.problem, {color: '#FFFFFF'}]}>
            {currentProblem.num1} - {currentProblem.num2} = ?
          </Text>
          {!compact && (
            <Text style={[styles.hint, {color: '#FFFFFF'}]}>
              {t('game.subtractionHint')} <Emoji>👆</Emoji>
            </Text>
          )}
        </View>
      )}

      <TenFrame
        cells={cells}
        onCellClick={onCellClick}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
        demo={demoEnabled === false ? undefined : 'subtraction'}
      />

      {userAnswer !== null && (
        <NumberDisplay number={userAnswer} colors={colors} emoji={emoji} scale={fontScale} />
      )}

      {!hasSubmitted && !compact && (
        <Pressable
          onPress={onSubmit}
          style={[styles.submitButton, {backgroundColor: '#16A34A'}]}>
          <Text style={styles.submitButtonText}>✓</Text>
        </Pressable>
      )}

      {/* Correct/wrong feedback lives in the FeedbackSheet overlay
          (GameShell) so this column never reflows mid-celebration. */}

      <Pressable
        onPress={onReset}
        style={[styles.resetButton, {backgroundColor: colors.primaryButton}]}>
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
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  problemContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: 4,
  },
  problem: {
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  hint: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  submitButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  submitButtonText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 62,
    includeFontPadding: false,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    opacity: 0.7,
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 22,
  },
  feedbackContainer: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  feedbackEmoji: {
    fontSize: 24,
  },
  feedbackText: {
    fontSize: 17,
    fontWeight: '700',
  },
  answerText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
