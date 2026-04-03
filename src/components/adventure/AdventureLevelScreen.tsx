import React, {useState, useCallback, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, ImageBackground, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  AdventureLevel,
  ThemeColors,
  ThemeConfig,
  Problem,
  CellState,
  CountingChallenge,
} from '../../types/game';
import {
  generateProblem,
  generateCountingChallenge,
  generatePuzzleNumber,
  checkAnswer,
  checkPuzzleAnswer,
} from '../../utils/mathProblems';
import {TenFrame} from '../game/TenFrame';
import {NumberDisplay} from '../game/NumberDisplay';
import {LevelCompleteScreen} from './LevelCompleteScreen';
import {LevelPlayState} from '../../hooks/useAdventure';
import {getAllThemes} from '../../hooks/useTheme';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {Emoji} from '../common/Emoji';

interface AdventureLevelScreenProps {
  levelState: LevelPlayState;
  colors: ThemeColors;
  stars: number | null; // null = still playing, number = completed
  isNewBest: boolean;
  hasNextLevel: boolean;
  onRecordResult: (wasFirstTry: boolean) => void;
  onComplete: () => {stars: number; isNewBest: boolean};
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToMap: () => void;
}

export function AdventureLevelScreen({
  levelState,
  colors,
  stars,
  isNewBest,
  hasNextLevel,
  onRecordResult,
  onComplete,
  onNextLevel,
  onReplay,
  onBackToMap,
}: AdventureLevelScreenProps) {
  const {t} = useTranslation();
  const {level, problemIndex, problemCount, finished} = levelState;
  const [cells, setCells] = useState<CellState[]>(Array(10).fill('empty'));
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [countingChallenge, setCountingChallenge] =
    useState<CountingChallenge | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [completedStars, setCompletedStars] = useState<number | null>(stars);

  // Pre-generate ALL problems/challenges for the level to avoid repeats
  const pregenCountingRef = useRef<CountingChallenge[]>([]);
  const pregenProblemsRef = useRef<Problem[]>([]);
  useEffect(() => {
    if (level.gameMode === 'counting') {
      const challenges: CountingChallenge[] = [];
      const seen = new Set<string>();
      let tries = 0;
      while (challenges.length < problemCount && tries < 50) {
        const c = generateCountingChallenge(level.modeLevel);
        const key = `${c.instruction}-${c.targetNumber}`;
        if (!seen.has(key) || tries > 30) {
          seen.add(key);
          challenges.push(c);
        }
        tries++;
      }
      pregenCountingRef.current = challenges;
    } else {
      const problems: Problem[] = [];
      const seen = new Set<string>();
      let tries = 0;
      while (problems.length < problemCount && tries < 50) {
        const p = level.gameMode === 'puzzle'
          ? (() => { const n = generatePuzzleNumber(); return {num1: n, num2: 10 - n, answer: 10}; })()
          : generateProblem(level.gameMode, level.modeLevel);
        const key = `${p.num1}-${p.num2}`;
        if (!seen.has(key) || tries > 30) {
          seen.add(key);
          problems.push(p);
        }
        tries++;
      }
      pregenProblemsRef.current = problems;
    }
  }, [level, problemCount]);

  // Set up current problem from pre-generated list
  useEffect(() => {
    if (finished) return;
    setCells(Array(10).fill('empty'));
    setHasSubmitted(false);
    setIsCorrect(null);
    setAttempts(0);

    if (level.gameMode === 'counting') {
      const challenge = pregenCountingRef.current[problemIndex]
        ?? generateCountingChallenge(level.modeLevel);
      setCountingChallenge(challenge);
      setCurrentProblem(null);
    } else if (level.gameMode === 'puzzle') {
      const problem = pregenProblemsRef.current[problemIndex]
        ?? (() => { const n = generatePuzzleNumber(); return {num1: n, num2: 10 - n, answer: 10}; })();
      const prefilled = Array(10).fill('empty') as CellState[];
      for (let i = 0; i < problem.num1; i++) {
        prefilled[i] = 'color1';
      }
      setCells(prefilled);
      setCurrentProblem(problem);
      setCountingChallenge(null);
    } else {
      const problem = pregenProblemsRef.current[problemIndex]
        ?? generateProblem(level.gameMode, level.modeLevel);
      setCurrentProblem(problem);
      setCountingChallenge(null);
      // Pre-fill for addition/subtraction
      if (level.gameMode === 'addition') {
        const prefilled = Array(10).fill('empty') as CellState[];
        for (let i = 0; i < problem.num1; i++) {
          prefilled[i] = 'color1';
        }
        setCells(prefilled);
      } else if (level.gameMode === 'subtraction') {
        const prefilled = Array(10).fill('empty') as CellState[];
        for (let i = 0; i < problem.num1; i++) {
          prefilled[i] = 'color1';
        }
        setCells(prefilled);
      }
    }
  }, [problemIndex, finished, level]);

  const handleCellPress = useCallback(
    (index: number) => {
      if (hasSubmitted && isCorrect) return;

      setCells(prev => {
        const newCells = [...prev];
        const currentState = newCells[index];

        if (level.gameMode === 'counting') {
          newCells[index] = currentState === 'empty' ? 'filled' : 'empty';
        } else if (level.gameMode === 'addition' || level.gameMode === 'puzzle') {
          if (currentState === 'color1') return prev; // Can't change prefilled
          newCells[index] = currentState === 'empty' ? 'color2' : 'empty';
        } else if (level.gameMode === 'subtraction') {
          if (currentState === 'color1') {
            newCells[index] = 'empty';
          } else if (currentState === 'empty') {
            newCells[index] = 'color1';
          }
        }
        return newCells;
      });

      // Reset submission state for retry
      if (hasSubmitted && !isCorrect) {
        setHasSubmitted(false);
        setIsCorrect(null);
      }
    },
    [hasSubmitted, isCorrect, level.gameMode],
  );

  const handleSubmit = useCallback(() => {
    const filledCount = cells.filter(
      c => c === 'filled' || c === 'color1' || c === 'color2',
    ).length;

    let correct = false;

    if (level.gameMode === 'counting' && countingChallenge) {
      const {instruction, targetNumber} = countingChallenge;
      const topRow = cells.slice(0, 5);
      const bottomRow = cells.slice(5, 10);
      const topFilled = topRow.filter(c => c === 'filled').length;
      const bottomFilled = bottomRow.filter(c => c === 'filled').length;
      const totalFilled = topFilled + bottomFilled;

      if (instruction === 'fill_top_row') {
        correct = topFilled === 5 && bottomFilled === 0;
      } else if (instruction === 'fill_bottom_row') {
        correct = bottomFilled === 5 && topFilled === 0;
      } else if (instruction === 'fill_both_equal') {
        const perRow = targetNumber / 2;
        correct = topFilled === perRow && bottomFilled === perRow;
      } else {
        correct = totalFilled === targetNumber;
      }
    } else if (level.gameMode === 'puzzle' && currentProblem) {
      const color2Count = cells.filter(c => c === 'color2').length;
      correct = checkPuzzleAnswer(color2Count, currentProblem.num1);
    } else if (currentProblem) {
      if (level.gameMode === 'addition') {
        const color2Count = cells.filter(c => c === 'color2').length;
        correct = color2Count === currentProblem.num2;
      } else if (level.gameMode === 'subtraction') {
        const remainingColor1 = cells.filter(c => c === 'color1').length;
        correct = remainingColor1 === currentProblem.answer;
      } else {
        correct = checkAnswer(filledCount, currentProblem);
      }
    }

    setHasSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      const wasFirstTry = attempts === 0;
      onRecordResult(wasFirstTry);
    } else {
      setAttempts(prev => prev + 1);
    }
  }, [cells, currentProblem, countingChallenge, level, attempts, onRecordResult]);

  // Auto-complete level when finished
  useEffect(() => {
    if (finished && completedStars === null) {
      const result = onComplete();
      setCompletedStars(result.stars);
    }
  }, [finished, completedStars, onComplete]);

  // Get world theme background
  const world = ADVENTURE_WORLDS.find(w => w.id === level.worldId);
  const allThemes = getAllThemes();
  const worldTheme = allThemes.find(
    (th: ThemeConfig) => th.id === world?.theme,
  );
  const bgImage = worldTheme?.backgroundPortrait;
  const themeColors = worldTheme?.colors ?? colors;

  // Visual instruction: big emoji/number + small text
  const getInstruction = (): {visual: string; text: string} => {
    if (level.gameMode === 'counting' && countingChallenge) {
      const {instruction, targetNumber} = countingChallenge;
      if (instruction === 'fill_top_row') {
        return {visual: '⬆️ 5', text: t('adventure.fillTopRow')};
      }
      if (instruction === 'fill_bottom_row') {
        return {visual: '⬇️ 5', text: t('adventure.fillBottomRow')};
      }
      if (instruction === 'fill_both_equal') {
        const perRow = targetNumber / 2;
        return {visual: `⬆️ ${perRow}\n=\n⬇️ ${perRow}`, text: t('adventure.fillBothEqual')};
      }
      return {
        visual: `${targetNumber}`,
        text: t('adventure.fillExactly', {count: targetNumber}),
      };
    }
    if (level.gameMode === 'addition' && currentProblem) {
      return {
        visual: `${currentProblem.num1} + ${currentProblem.num2} = ?`,
        text: '',
      };
    }
    if (level.gameMode === 'subtraction' && currentProblem) {
      return {
        visual: `${currentProblem.num1} - ${currentProblem.num2} = ?`,
        text: '',
      };
    }
    if (level.gameMode === 'puzzle' && currentProblem) {
      const remaining = 10 - currentProblem.num1;
      return {
        visual: `${currentProblem.num1} + ? = 10`,
        text: t('adventure.fillExactly', {count: remaining}),
      };
    }
    return {visual: '', text: ''};
  };

  const filledCount = cells.filter(
    c => c === 'filled' || c === 'color2',
  ).length;

  return (
    <Modal visible animationType="fade" onRequestClose={onBackToMap}>
    <ImageBackground source={bgImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        {/* Progress header */}
        <View style={styles.header}>
          <Text style={styles.progressText}>
            {t('adventure.problemOf', {
              current: Math.min(problemIndex + 1, problemCount),
              total: problemCount,
            })}
          </Text>
          <View style={styles.dots}>
            {Array.from({length: problemCount}).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < problemIndex
                        ? levelState.results[i]
                          ? '#22C55E'
                          : '#EF4444'
                        : i === problemIndex
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.3)',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Instruction - visual for kids + text for readers */}
        {(() => {
          const instr = getInstruction();
          return (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionVisual}>{instr.visual}</Text>
              {instr.text ? (
                <Text style={styles.instructionText}>{instr.text}</Text>
              ) : null}
            </View>
          );
        })()}

        {/* Ten Frame */}
        <View style={styles.gameArea}>
          <TenFrame
            cells={cells}
            onCellClick={handleCellPress}
            colors={themeColors}
            emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
            tokenImage={worldTheme?.tokenImage}
          />
        </View>

        {/* Count display */}
        <NumberDisplay
          number={filledCount}
          colors={themeColors}
          emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
        />

        {/* Submit / Feedback */}
        {!finished && (
          <View style={styles.submitArea}>
            {hasSubmitted && isCorrect && (
              <Text style={styles.feedbackCorrect}>
                <Emoji>✅</Emoji> {t('feedback.correct')}
              </Text>
            )}
            {hasSubmitted && !isCorrect && (
              <Text style={styles.feedbackWrong}>
                <Emoji>❌</Emoji> {t('feedback.tryAgain')}
              </Text>
            )}
            {(!hasSubmitted || !isCorrect) && (
              <View
                style={[
                  styles.submitBtn,
                  {backgroundColor: themeColors.primaryButton},
                ]}>
                <Text
                  style={styles.submitText}
                  onPress={handleSubmit}>
                  <Emoji>✅</Emoji>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Level Complete overlay */}
        {completedStars !== null && (
          <LevelCompleteScreen
            stars={completedStars}
            isNewBest={isNewBest}
            colors={themeColors}
            hasNextLevel={hasNextLevel}
            onNextLevel={onNextLevel}
            onReplay={onReplay}
            onBackToMap={onBackToMap}
          />
        )}
      </View>
    </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  instructionBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  instructionVisual: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  gameArea: {
    marginBottom: 16,
  },
  submitArea: {
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 28,
  },
  feedbackCorrect: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 8,
  },
  feedbackWrong: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
});
