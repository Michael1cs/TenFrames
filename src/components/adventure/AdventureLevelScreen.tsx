import React, {useState, useCallback, useRef, useEffect} from 'react';
import {View, Text, Pressable, StyleSheet, ImageBackground, Modal} from 'react-native';
import Animated, {BounceIn, FadeIn} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {
  AdventureLevel,
  ThemeColors,
  ThemeConfig,
  Problem,
  CellState,
  CountingChallenge,
  MemoryChallenge,
} from '../../types/game';
import {
  generateProblem,
  generateCountingChallenge,
  generateMemoryChallenge,
  generatePuzzleNumber,
  generateDivideProblem,
  checkAnswer,
  checkPuzzleAnswer,
} from '../../utils/mathProblems';
import {TenFrame} from '../game/TenFrame';
import {NumberDisplay} from '../game/NumberDisplay';
import {MemoryMode} from '../game/MemoryMode';
import {DivideMode} from '../game/DivideMode';
import {useVoice, VOICE_GROUPS} from '../../hooks/useVoice';
import {LevelCompleteScreen} from './LevelCompleteScreen';
import {LevelPlayState} from '../../hooks/useAdventure';
import {getAllThemes} from '../../hooks/useTheme';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {Emoji} from '../common/Emoji';
import {WrongFlash} from '../feedback/WrongFlash';
import {TapHint} from '../feedback/TapHint';

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
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const {level, problemIndex, problemCount, finished} = levelState;
  const [cells, setCells] = useState<CellState[]>(Array(10).fill('empty'));
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [countingChallenge, setCountingChallenge] =
    useState<CountingChallenge | null>(null);
  const [memoryChallenge, setMemoryChallenge] =
    useState<MemoryChallenge | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [completedStars, setCompletedStars] = useState<number | null>(stars);
  // Hint when the child stalls. Shown after a few seconds of inactivity on a
  // new problem; auto-hides as soon as they tap any cell.
  const [showTapHint, setShowTapHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-generate ALL problems/challenges for the level to avoid repeats
  const pregenCountingRef = useRef<CountingChallenge[]>([]);
  const pregenProblemsRef = useRef<Problem[]>([]);
  const pregenMemoryRef = useRef<MemoryChallenge[]>([]);
  useEffect(() => {
    if (level.gameMode === 'memory') {
      const challenges: MemoryChallenge[] = [];
      for (let i = 0; i < problemCount; i++) {
        challenges.push(generateMemoryChallenge(level.modeLevel));
      }
      pregenMemoryRef.current = challenges;
    } else if (level.gameMode === 'counting') {
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
          ? (() => { const n = generatePuzzleNumber(level.modeLevel); return {num1: n, num2: 10 - n, answer: 10}; })()
          : level.gameMode === 'divide'
          ? generateDivideProblem(level.modeLevel)
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

    if (level.gameMode === 'memory') {
      const challenge = pregenMemoryRef.current[problemIndex]
        ?? generateMemoryChallenge(level.modeLevel);
      setMemoryChallenge(challenge);
      setCurrentProblem(null);
      setCountingChallenge(null);
    } else if (level.gameMode === 'counting') {
      const challenge = pregenCountingRef.current[problemIndex]
        ?? generateCountingChallenge(level.modeLevel);
      setCountingChallenge(challenge);
      setCurrentProblem(null);
      setMemoryChallenge(null);
    } else if (level.gameMode === 'puzzle') {
      const problem = pregenProblemsRef.current[problemIndex]
        ?? (() => { const n = generatePuzzleNumber(level.modeLevel); return {num1: n, num2: 10 - n, answer: 10}; })();
      const prefilled = Array(10).fill('empty') as CellState[];
      for (let i = 0; i < problem.num1; i++) {
        prefilled[i] = 'color1';
      }
      setCells(prefilled);
      setCurrentProblem(problem);
      setCountingChallenge(null);
    } else if (level.gameMode === 'divide') {
      const problem = pregenProblemsRef.current[problemIndex]
        ?? generateDivideProblem(level.modeLevel);
      // Pre-fill ALL `answer` cells in color1; child flips num2 of them to color2.
      const prefilled = Array(10).fill('empty') as CellState[];
      for (let i = 0; i < problem.answer; i++) {
        prefilled[i] = 'color1';
      }
      setCells(prefilled);
      setCurrentProblem(problem);
      setCountingChallenge(null);
      setMemoryChallenge(null);
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

  // Hint timer: arm on every new problem, fire after 4s if still untouched.
  // Memory mode runs its own state machine, so skip it there.
  useEffect(() => {
    if (level.gameMode === 'memory' || finished) {
      setShowTapHint(false);
      return;
    }
    setShowTapHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowTapHint(true), 4000);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [problemIndex, level.gameMode, finished]);

  const dismissHint = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setShowTapHint(false);
  }, []);

  const handleCellPress = useCallback(
    (index: number) => {
      if (hasSubmitted && isCorrect) return;
      dismissHint();

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
        } else if (level.gameMode === 'divide') {
          // Toggle between the two colors; empty cells stay empty (outside split).
          if (currentState === 'color1') newCells[index] = 'color2';
          else if (currentState === 'color2') newCells[index] = 'color1';
          else return prev;
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
      // Announce success with a random praise + result count narration.
      // For puzzle (Make 10), skip the count — visible total is always 10
      // and the visual is self-evident, so "ten!" feels redundant.
      if (level.gameMode !== 'memory') {
        const themeId = ADVENTURE_WORLDS.find(w => w.id === level.worldId)?.theme;
        const visible = cells.filter(c => c !== 'empty').length;
        const praiseId =
          VOICE_GROUPS.correct[
            Math.floor(Math.random() * VOICE_GROUPS.correct.length)
          ];
        if (level.gameMode === 'puzzle') {
          voiceRef.current.play(praiseId);
        } else {
          const resultId =
            visible >= 1 && visible <= 5 && themeId
              ? `post_great_${themeId}_${visible}`
              : visible >= 0 && visible <= 10
              ? `num_${visible}`
              : null;
          if (resultId) {
            voiceRef.current.playSequence([praiseId, resultId], 800);
          } else {
            voiceRef.current.play(praiseId);
          }
        }
      }
      onRecordResult(wasFirstTry);
    } else {
      setAttempts(prev => prev + 1);
      voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
    }
  }, [cells, currentProblem, countingChallenge, level, attempts, onRecordResult]);

  // Auto-complete level when finished
  useEffect(() => {
    if (finished && completedStars === null) {
      const result = onComplete();
      setCompletedStars(result.stars);
    }
  }, [finished, completedStars, onComplete]);

  // Auto-submit: when child reaches the correct answer, fire submit after
  // 350ms (positive). When they overshoot, fire after 1.8s grace (wrong).
  // This replaces the manual ✓ button — 4-6 ages don't need to confirm.
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    autoSubmitFiredRef.current = false;
  }, [problemIndex, level]);
  // Reset the latch when child unlocks for a retry by tapping a cell
  // (handleCellPress sets hasSubmitted=false on wrong answer retry).
  useEffect(() => {
    if (!hasSubmitted) autoSubmitFiredRef.current = false;
  }, [hasSubmitted]);
  useEffect(() => {
    if (finished || hasSubmitted || level.gameMode === 'memory') return;
    // Divide mode owns its own match detection in <DivideMode/> so we skip
    // the count-based auto-submit logic here.
    if (level.gameMode === 'divide') return;
    if (autoSubmitFiredRef.current) return;

    const topFilled = cells.slice(0, 5).filter(c => c !== 'empty').length;
    const bottomFilled = cells.slice(5, 10).filter(c => c !== 'empty').length;
    const totalFilled = topFilled + bottomFilled;

    let isMatch = false;
    let isOvershoot = false;

    if (level.gameMode === 'counting' && countingChallenge) {
      const {instruction, targetNumber} = countingChallenge;
      if (instruction === 'fill_top_row') {
        isMatch = topFilled === 5 && bottomFilled === 0;
        isOvershoot = bottomFilled > 0 || topFilled > 5;
      } else if (instruction === 'fill_bottom_row') {
        isMatch = bottomFilled === 5 && topFilled === 0;
        isOvershoot = topFilled > 0 || bottomFilled > 5;
      } else if (instruction === 'fill_both_equal') {
        const perRow = targetNumber / 2;
        isMatch = topFilled === perRow && bottomFilled === perRow;
        isOvershoot = topFilled > perRow || bottomFilled > perRow;
      } else {
        // fill_exactly
        isMatch = totalFilled === targetNumber;
        isOvershoot = totalFilled > targetNumber;
      }
    } else if (level.gameMode === 'puzzle' && currentProblem) {
      const color2Count = cells.filter(c => c === 'color2').length;
      isMatch = color2Count === 10 - currentProblem.num1;
      isOvershoot = color2Count > 10 - currentProblem.num1;
    } else if (currentProblem) {
      if (level.gameMode === 'addition') {
        const color2Count = cells.filter(c => c === 'color2').length;
        isMatch = color2Count === currentProblem.num2;
        isOvershoot = color2Count > currentProblem.num2;
      } else if (level.gameMode === 'subtraction') {
        const remainingColor1 = cells.filter(c => c === 'color1').length;
        isMatch = remainingColor1 === currentProblem.answer;
        isOvershoot = remainingColor1 < currentProblem.answer; // removed too many
      }
    }

    if (isMatch) {
      autoSubmitFiredRef.current = true;
      const t = setTimeout(() => handleSubmitRef.current(), 350);
      return () => clearTimeout(t);
    }
    if (isOvershoot) {
      const t = setTimeout(() => {
        if (autoSubmitFiredRef.current) return;
        autoSubmitFiredRef.current = true;
        handleSubmitRef.current();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [cells, currentProblem, countingChallenge, level, hasSubmitted, finished, problemIndex]);

  // Voice narration per problem. Memory mode handles its own voice via
  // onPhaseChange, so we skip it here.
  //
  // Deps include only the content of the problem (currentProblem / countingChallenge),
  // NOT problemIndex. Otherwise this fires once on problemIndex change with the
  // STALE problem (before the sibling useEffect updates state), then again with
  // fresh problem — resulting in two voices playing.
  //
  // Delay new-problem voice by ~1.6s so the "Great! You have N!" result voice
  // from the previous answer has time to finish.
  const prevVoiceKey = useRef<string | null>(null);
  const isFirstProblemRef = useRef(true);
  useEffect(() => {
    if (finished || level.gameMode === 'memory') return;
    // Divide mode is silent — banner "5 = 2 + 3" is unambiguous visually; per-
    // equation voice would balloon the audio bundle and add little for kids.
    if (level.gameMode === 'divide') return;
    const themeId = ADVENTURE_WORLDS.find(w => w.id === level.worldId)?.theme;

    let key = '';
    let action: (() => void) | null = null;

    if (level.gameMode === 'counting' && countingChallenge) {
      const {instruction, targetNumber} = countingChallenge;
      key = `c-${instruction}-${targetNumber}`;
      if (instruction === 'fill_top_row') {
        action = () => voiceRef.current.play('instr_top_row');
      } else if (instruction === 'fill_bottom_row') {
        action = () => voiceRef.current.play('instr_bottom_row');
      } else if (instruction === 'fill_both_equal') {
        action = () => voiceRef.current.play('instr_both_rows');
      } else {
        action = () => voiceRef.current.play(`num_${targetNumber}`);
      }
    } else if (level.gameMode === 'puzzle' && currentProblem) {
      key = `p-${currentProblem.num1}`;
      action = () => voiceRef.current.play('instr_make_ten');
    } else if (currentProblem && themeId) {
      const mode = level.gameMode;
      key = `${mode}-${currentProblem.num1}-${currentProblem.num2}`;
      const act = mode === 'addition' ? 'add' : 'sub';
      const ids: string[] = [];
      if (currentProblem.num1 <= 5) {
        ids.push(`pre_have_${themeId}_${currentProblem.num1}`);
      } else {
        ids.push(`num_${currentProblem.num1}`);
      }
      if (currentProblem.num2 <= 4) {
        ids.push(`instr_${act}_${themeId}_${currentProblem.num2}`);
      } else {
        ids.push(`num_${currentProblem.num2}`);
      }
      action = () => voiceRef.current.playSequence(ids);
    }

    if (!action || key === prevVoiceKey.current) return;
    prevVoiceKey.current = key;

    // Delay before narrating next problem so the previous "Awesome! You have N
    // rockets!" sequence (praise ~0.7s + 800ms gap + count narration ~1.5s
    // ≈ 3s total) can finish without being cut off mid-word.
    const delay = isFirstProblemRef.current ? 400 : 2800;
    isFirstProblemRef.current = false;
    const timer = setTimeout(action, delay);
    return () => clearTimeout(timer);
  }, [currentProblem, countingChallenge, level, finished]);

  // Reset first-problem flag when the level itself changes.
  useEffect(() => {
    isFirstProblemRef.current = true;
    prevVoiceKey.current = null;
  }, [level]);

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

  // Total non-empty cells = the visible count. For subtraction this is
  // num1 - (cells removed) = current remaining. For addition this is
  // num1 + (color2 added) = total so far. For puzzle: color1 + color2.
  const filledCount = cells.filter(c => c !== 'empty').length;

  return (
    <Modal visible animationType="fade" onRequestClose={onBackToMap}>
    <View style={styles.modalRoot}>
    <ImageBackground source={bgImage} style={styles.background} resizeMode="cover">
      <WrongFlash visible={hasSubmitted && isCorrect === false} />
      <View style={styles.overlay}>
        {/* Back button + Progress header */}
        <View style={styles.header}>
          <Pressable onPress={onBackToMap} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
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

        {level.gameMode === 'divide' ? (
          <DivideMode
            cells={cells}
            onCellClick={handleCellPress}
            currentProblem={currentProblem}
            colors={themeColors}
            emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
            tokenImage={worldTheme?.tokenImage}
            onMatch={() => onRecordResult(attempts === 0)}
          />
        ) : level.gameMode === 'memory' ? (
          memoryChallenge && (
            <MemoryMode
              challenge={memoryChallenge}
              colors={themeColors}
              emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
              tokenImage={worldTheme?.tokenImage}
              onCorrect={() => onRecordResult(attempts === 0)}
              onWrong={() => {
                setAttempts(prev => prev + 1);
                voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
              }}
              onPhaseChange={(phase, _targetCount) => {
                // Industry pattern (Khan Academy Kids, Toca Boca, Endless
                // Numbers): teach rules once, then trust the visual. Voice
                // only at first problem's intro and on correct praise.
                // Problems 2+ are completely silent during show/input — the
                // lit cells and the empty grid are unambiguous.
                if (phase === 'show' && problemIndex === 0) {
                  voiceRef.current.play('mem_intro');
                } else if (phase === 'reveal') {
                  voiceRef.current.playRandom(VOICE_GROUPS.correct);
                }
              }}
            />
          )
        ) : (
          <>
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
              <TapHint visible={showTapHint && !hasSubmitted} />
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
                  <Animated.View
                    entering={BounceIn.duration(400)}
                    style={styles.feedbackBox}>
                    <Text style={styles.feedbackEmoji}><Emoji>🎉</Emoji></Text>
                    <Text style={styles.feedbackCorrect}>{t('feedback.correct')}</Text>
                  </Animated.View>
                )}
                {hasSubmitted && !isCorrect && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.feedbackBox}>
                    <Text style={styles.feedbackEmoji}><Emoji>🤔</Emoji></Text>
                    <Text style={styles.feedbackWrong}>{t('feedback.tryAgain')}</Text>
                  </Animated.View>
                )}
                {/* Manual ✓ button removed — auto-submit handles it for 4-6 ages. */}
              </View>
            )}
          </>
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
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Opaque dark root so we never see the underlying free-play UI flash
  // while the theme ImageBackground is still loading on first entry.
  modalRoot: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
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
    width: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    fontWeight: '700',
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
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  submitText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 62,
    includeFontPadding: false,
  },
  feedbackBox: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackEmoji: {
    fontSize: 40,
  },
  feedbackCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  feedbackWrong: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
