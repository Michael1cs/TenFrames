import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Pressable, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {NumberPad} from './NumberPad';
import {PadHint} from '../feedback/PadHint';
import {Emoji} from '../common/Emoji';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {AgeGroup, AnswerProblem, CellState, ThemeColors} from '../../types/game';

interface NumberAnswerModeProps {
  cells: CellState[];
  onCellClick: (index: number) => void;
  onNumberPick: (n: number) => void;
  onReset: () => void;
  problem: AnswerProblem | null;
  isCorrect: boolean | null;
  hasSubmitted: boolean;
  feedback: string;
  wrongPick: number | null;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  level: number;
  ageGroup?: AgeGroup;
  ageProfile?: AgeProfile;
}

// "Name the number": the frame is a working space (num1 pre-placed, the
// child builds the rest), but the ANSWER is the tapped number bubble — the
// bridge from arranging quantities to reading an equation.
export function NumberAnswerMode({
  cells,
  onCellClick,
  onNumberPick,
  onReset,
  problem,
  isCorrect,
  hasSubmitted,
  wrongPick,
  colors,
  emoji,
  tokenImage,
  level,
  ageGroup = 'older',
  ageProfile,
}: NumberAnswerModeProps) {
  const {t} = useTranslation();
  const compact = ageProfile?.compact ?? false;

  // Once the frame holds the target quantity and the child pauses, bounce an
  // arrow at the pad — the board is built, the answer still needs naming.
  const [showPadHint, setShowPadHint] = useState(false);
  useEffect(() => {
    setShowPadHint(false);
    if (!problem || hasSubmitted) return;
    const filled = cells.filter(c => c !== 'empty').length;
    if (filled !== problem.answer) return;
    const timer = setTimeout(() => setShowPadHint(true), 1100);
    return () => clearTimeout(timer);
  }, [cells, problem, hasSubmitted]);

  const equation = problem
    ? problem.slot === 'sum'
      ? [
          {text: String(problem.num1), color: colors.cellColor1},
          {text: ' + ', color: '#FFFFFF'},
          {text: String(problem.num2), color: colors.cellColor2},
          {text: ' = ', color: '#FFFFFF'},
          {text: '?', color: '#FBBF24'},
        ]
      : [
          {text: String(problem.num1), color: colors.cellColor1},
          {text: ' + ', color: '#FFFFFF'},
          {text: '?', color: '#FBBF24'},
          {text: ' = ', color: '#FFFFFF'},
          {text: String(problem.answer), color: colors.cellColor2},
        ]
    : [];

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={[styles.levelBadge, {backgroundColor: colors.accent}]}>
          <Text style={styles.levelText}><Emoji>⭐</Emoji> Level {level} <Emoji>⭐</Emoji></Text>
        </View>
      )}

      {problem && (
        <View style={styles.problemContainer}>
          <Text style={styles.problem}>
            {equation.map((part, i) => (
              <Text key={i} style={{color: part.color}}>
                {part.text}
              </Text>
            ))}
          </Text>
          {!compact && (
            <Text style={styles.hint}>
              {t('game.answerHint')} <Emoji>👆</Emoji>
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
        ageGroup={ageGroup}
      />

      <PadHint visible={showPadHint} />
      <NumberPad
        onPick={n => {
          setShowPadHint(false);
          onNumberPick(n);
        }}
        colors={colors}
        highlight={hasSubmitted && isCorrect ? problem?.expected ?? null : null}
        wrongPick={wrongPick}
      />


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
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  hint: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    opacity: 0.7,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 22,
  },
});
