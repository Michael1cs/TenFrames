import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {Text} from '../common/AppText';
import Animated, {BounceIn, FadeIn} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {
  AnswerProblem,
  CompareProblem,
  ThemeColors,
  ThemeConfig,
  Problem,
  CellState,
  CountingChallenge,
  MemoryChallenge,
} from '../../types/game';
import {
  generateProblem,
  generateAnswerProblem,
  generateCompareProblem,
  generateCountingChallenge,
  generateMemoryChallenge,
  generatePuzzleNumber,
  generateShareProblem,
  ShareProblem,
  checkAnswer,
} from '../../utils/mathProblems';
import {TenFrame} from '../game/TenFrame';
import {NumberDisplay} from '../game/NumberDisplay';
import {NumberPad} from '../game/NumberPad';
import {MemoryMode} from '../game/MemoryMode';
import {FarmShareMode} from '../game/FarmShareMode';
import {CompareMode} from '../game/CompareMode';
import {useVoice, VOICE_GROUPS, clearPendingVoiceQueue} from '../../hooks/useVoice';
import {LevelCompleteScreen} from './LevelCompleteScreen';
import {LevelPlayState} from '../../hooks/useAdventure';
import {getAllThemes} from '../../hooks/useTheme';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {
  puzzleInstructionIds,
  puzzlePraisePool,
  puzzleRetryIds,
} from '../../voice/puzzleNarration';
import {
  answerInstructionIds,
  compareAskIds,
  countingInstructionIds,
  padNudgeId,
} from '../../voice/adventureNarration';
import {WrongFlash} from '../feedback/WrongFlash';
import {TapHint} from '../feedback/TapHint';
import {Mascot} from '../common/Mascot';
import {PadHint} from '../feedback/PadHint';
import {useReduceMotion} from '../../hooks/useReduceMotion';
import {buildAssistPlan, cellsToChange} from '../../utils/hintLadder';
import {STOP_JUDGE_MS} from '../../config/timing';
import {ProblemTransition} from '../feedback/ProblemTransition';

// Per-level noun for voice narration. When set, the addition/subtraction
// voice uses have_<noun>_<N> / add_more_<noun>_<N> / take_<noun>_<N> so the
// spoken phrase matches the level's emoji ("3 octopuses", "5 stars") instead
// of the generic world-theme noun. Unmapped levels fall back to world-themed
// clips.
const LEVEL_NOUN: Record<string, string> = {
  // High Five! — all five nouns have complete have_/add_more_/post_great_
  // coverage for 1-10, which is what keeps this world at zero voice cost.
  'hf-1': 'star', 'hf-2': 'moon', 'hf-3': 'star', 'hf-4': 'moon',
  'hf-5': 'comet', 'hf-6': 'galaxy', 'hf-7': 'star', 'hf-8': 'comet',
  'hf-bonus-a': 'star', 'hf-bonus-b': 'trophy',
  // Addition Island
  'ai-1': 'shell',
  'ai-2': 'fish',
  'ai-3': 'crab',
  'ai-4': 'fish',
  'ai-5': 'octopus',
  'ai-6': 'lobster',
  'ai-7': 'dolphin',
  'ai-8': 'whale',
  'ai-9': 'squid',
  'ai-10': 'island',
  'ai-bonus-a': 'star',
  'ai-bonus-b': 'trophy',
  // Subtraction Mountain
  'sm-1': 'moon',
  'sm-2': 'rocket',
  'sm-3': 'planet',
  'sm-4': 'comet',
  'sm-5': 'ufo',
  'sm-6': 'planet',
  'sm-7': 'alien',
  'sm-8': 'telescope',
  'sm-9': 'galaxy',
  'sm-10': 'star',
  'sm-bonus-a': 'star',
  'sm-bonus-b': 'trophy',
  // Counting Meadow
  'cm-1': 'mushroom',
  'cm-2': 'butterfly',
  'cm-3': 'flower',
  'cm-4': 'caterpillar',
  'cm-5': 'sunflower',
  'cm-6': 'fox',
  'cm-7': 'owl',
  'cm-8': 'tree',
  'cm-bonus-a': 'star',
  'cm-bonus-b': 'trophy',
  // Doubles Castle (post-correct only — instruction voice is doubles_N)
  'dc-1': 'sparkle',
  'dc-2': 'rainbow',
  'dc-3': 'unicorn',
  'dc-4': 'crown',
  'dc-5': 'gem',
  'dc-bonus-a': 'star',
  'dc-bonus-b': 'trophy',
  // Number Town — space nouns with complete have_/add_more_ coverage; level
  // emojis match, so "3 stars" narrates the stars the child actually sees.
  'nt-1': 'star',
  'nt-2': 'rocket',
  'nt-3': 'moon',
  'nt-4': 'comet',
  'nt-5': 'galaxy',
  'nt-6': 'ufo',
  'nt-bonus-a': 'star',
  'nt-bonus-b': 'trophy',
};

interface AdventureLevelScreenProps {
  levelState: LevelPlayState;
  colors: ThemeColors;
  stars: number | null; // null = still playing, number = completed
  isNewBest: boolean;
  hasNextLevel: boolean;
  worldComplete?: boolean;
  onRecordResult: (wasFirstTry: boolean) => void;
  onComplete: () => {stars: number; isNewBest: boolean};
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToMap: () => void;
}

// A 'mixed' puzzle target picks a fresh target per problem. modeLevel biases
// the band: >= 8 draws only from the hard end, which is what separates a
// world's second boss from its first. Below that it is the full 3..9 spread.
function pickMixedTarget(modeLevel: number): number {
  return modeLevel >= 8
    ? 7 + Math.floor(Math.random() * 3)
    : 3 + Math.floor(Math.random() * 7);
}

export function AdventureLevelScreen({
  levelState,
  colors,
  stars,
  isNewBest,
  hasNextLevel,
  worldComplete,
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
  const [shareProblem, setShareProblem] = useState<ShareProblem | null>(null);
  const [compareProblem, setCompareProblem] = useState<CompareProblem | null>(
    null,
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Answer mode (Number Town): the number pad is the submit button.
  const [padWrongPick, setPadWrongPick] = useState<number | null>(null);
  const [padReveal, setPadReveal] = useState(false);
  // Shown once the child has built the answer on the frame but hasn't named
  // it yet — the board is done, the missing step is the pad.
  const [showPadHint, setShowPadHint] = useState(false);
  // Hint ladder state. hintCells pulse (they need changing); everything else
  // dims while a hint is up. assisting locks input while the third-attempt
  // walkthrough builds the answer cell by cell.
  const [hintCells, setHintCells] = useState<number[]>([]);
  const [assisting, setAssisting] = useState(false);
  // The success moment must last even when the voice is off: useVoice calls
  // the completion callback at once then, and the level jumped straight to
  // the next problem — the child never saw that they were right. With the
  // voice on, the praise itself is longer than the beat, so nothing changes.
  const afterBeat = useCallback((fn: () => void, ms = 1100) => {
    const at = Date.now();
    return () => {
      const wait = Math.max(0, ms - (Date.now() - at));
      const t = setTimeout(fn, wait);
      assistTimersRef.current.push(t);
    };
  }, []);

  const assistTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Identifies the current walkthrough. A voice callback that arrives after
  // the child has moved on (next problem, level closed) must do nothing.
  const assistRunRef = useRef(0);
  const hintFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReduceMotion();
  const [completedStars, setCompletedStars] = useState<number | null>(stars);
  // Sync with parent: when Replay zeroes the stars prop, drop our internal
  // completed state too so the LevelCompleteScreen overlay closes and the
  // fresh problem grid renders. Otherwise the overlay sits on top while a
  // new pattern plays underneath.
  useEffect(() => {
    if (stars === null && completedStars !== null) setCompletedStars(null);
  }, [stars, completedStars]);
  // Hint when the child stalls. Shown after a few seconds of inactivity on a
  // new problem; auto-hides as soon as they tap any cell.
  const [showTapHint, setShowTapHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-generate ALL problems/challenges for the level to avoid repeats
  const pregenCountingRef = useRef<CountingChallenge[]>([]);
  const pregenProblemsRef = useRef<Problem[]>([]);
  const pregenMemoryRef = useRef<MemoryChallenge[]>([]);
  const pregenShareRef = useRef<ShareProblem[]>([]);
  const pregenCompareRef = useRef<CompareProblem[]>([]);
  useEffect(() => {
    if (level.gameMode === 'memory') {
      const challenges: MemoryChallenge[] = [];
      for (let i = 0; i < problemCount; i++) {
        challenges.push(generateMemoryChallenge(level.modeLevel));
      }
      pregenMemoryRef.current = challenges;
    } else if (level.gameMode === 'compare') {
      const probs: CompareProblem[] = [];
      for (let i = 0; i < problemCount; i++) {
        probs.push(generateCompareProblem(level.modeLevel));
      }
      pregenCompareRef.current = probs;
    } else if (level.gameMode === 'share') {
      const probs: ShareProblem[] = [];
      const seen = new Set<string>();
      let tries = 0;
      let lastKey: string | null = null;
      while (probs.length < problemCount && tries < 50) {
        const p = generateShareProblem(level.modeLevel);
        const key = `${p.total}-${p.buckets}`;
        // After 30 tries duplicates are allowed, but never the problem just
        // pushed: on a two-value pool the generator alternates a,b,a,b, so
        // try 31 always equalled the last one and the level ran a,b,b,a,b —
        // and the repeated problem got no instruction, since its voice key
        // had not changed.
        if (!seen.has(key) || (tries > 30 && key !== lastKey)) {
          seen.add(key);
          probs.push(p);
          lastKey = key;
        }
        tries++;
      }
      pregenShareRef.current = probs;
    } else if (level.gameMode === 'counting') {
      const challenges: CountingChallenge[] = [];
      const seen = new Set<string>();
      let tries = 0;
      let lastKey: string | null = null;
      while (challenges.length < problemCount && tries < 50) {
        const c = generateCountingChallenge(level.modeLevel);
        const key = `${c.instruction}-${c.targetNumber}`;
        if (!seen.has(key) || (tries > 30 && key !== lastKey)) {
          seen.add(key);
          challenges.push(c);
          lastKey = key;
        }
        tries++;
      }
      pregenCountingRef.current = challenges;
    } else {
      const problems: Problem[] = [];
      const seen = new Set<string>();
      let tries = 0;
      let lastKey: string | null = null;
      while (problems.length < problemCount && tries < 50) {
        const rawTarget = level.puzzleTarget ?? 10;
        const target = rawTarget === 'mixed'
          ? pickMixedTarget(level.modeLevel)
          : rawTarget;
        const p = level.gameMode === 'puzzle'
          ? (() => {
              // Pick a start number 0..target-1 (so child has at least one
              // cell to add). For target=10 keep the previous level-aware
              // band logic; for smaller targets just go uniform.
              const n = target === 10
                ? Math.min(target - 1, Math.max(0, generatePuzzleNumber(level.modeLevel)))
                : Math.floor(Math.random() * target);
              return {num1: n, num2: target - n, answer: target};
            })()
          : level.gameMode === 'answer'
          ? generateAnswerProblem(level.modeLevel)
          : generateProblem(level.gameMode, level.modeLevel);
        const key = level.gameMode === 'answer'
          ? `${(p as AnswerProblem).slot}-${p.num1}-${p.num2}`
          : `${p.num1}-${p.num2}`;
        if (!seen.has(key) || (tries > 30 && key !== lastKey)) {
          seen.add(key);
          problems.push(p);
          lastKey = key;
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
    setPadWrongPick(null);
    setPadReveal(false);
    setHintCells([]);
    setAssisting(false);
    // Any walkthrough still running belongs to a problem that is over.
    assistRunRef.current++;
    for (const t of assistTimersRef.current) clearTimeout(t);
    assistTimersRef.current = [];
    if (hintFlashRef.current) {
      clearTimeout(hintFlashRef.current);
      hintFlashRef.current = null;
    }

    if (level.gameMode === 'memory') {
      const challenge = pregenMemoryRef.current[problemIndex]
        ?? generateMemoryChallenge(level.modeLevel);
      // Clear the previous challenge so MemoryMode unmounts during the
      // ProblemTransition overlay (~2.2s). Otherwise the next pattern is
      // already lighting up cells behind the badge. First problem skips the
      // transition (badge only shows for problemIndex>0) so we mount fast.
      setMemoryChallenge(null);
      setCurrentProblem(null);
      setCountingChallenge(null);
      const delay = problemIndex === 0 ? 0 : 2300;
      const t = setTimeout(() => setMemoryChallenge(challenge), delay);
      return () => clearTimeout(t);
    } else if (level.gameMode === 'counting') {
      const challenge = pregenCountingRef.current[problemIndex]
        ?? generateCountingChallenge(level.modeLevel);
      setCountingChallenge(challenge);
      setCurrentProblem(null);
      setMemoryChallenge(null);
    } else if (level.gameMode === 'puzzle') {
      const rawTarget = level.puzzleTarget ?? 10;
      const fallbackTarget = rawTarget === 'mixed'
        ? pickMixedTarget(level.modeLevel)
        : rawTarget;
      const problem = pregenProblemsRef.current[problemIndex]
        ?? (() => {
            const n = Math.floor(Math.random() * fallbackTarget);
            return {num1: n, num2: fallbackTarget - n, answer: fallbackTarget};
          })();
      const prefilled = Array(10).fill('empty') as CellState[];
      for (let i = 0; i < problem.num1; i++) {
        prefilled[i] = 'color1';
      }
      setCells(prefilled);
      setCurrentProblem(problem);
      setCountingChallenge(null);
    } else if (level.gameMode === 'compare') {
      const cp = pregenCompareRef.current[problemIndex]
        ?? generateCompareProblem(level.modeLevel);
      setCompareProblem(cp);
      setCurrentProblem(null);
      setCountingChallenge(null);
      setMemoryChallenge(null);
    } else if (level.gameMode === 'share') {
      const sp = pregenShareRef.current[problemIndex]
        ?? generateShareProblem(level.modeLevel);
      setShareProblem(sp);
      setCurrentProblem(null);
      setCountingChallenge(null);
      setMemoryChallenge(null);
    } else {
      const problem = pregenProblemsRef.current[problemIndex]
        ?? (level.gameMode === 'answer'
          ? generateAnswerProblem(level.modeLevel)
          : generateProblem(level.gameMode, level.modeLevel));
      setCurrentProblem(problem);
      setCountingChallenge(null);
      // Pre-fill for addition/subtraction (answer mode works like addition:
      // num1 pre-placed, the frame is the child's working space)
      if (level.gameMode === 'addition' || level.gameMode === 'answer') {
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

  // Hint timer: arm on every new problem. At 4s show the 👆 visual.
  // The inactivity voice REPLAY is scheduled separately from the voice
  // useEffect below — it fires only after the first instruction voice
  // finishes playing, so the reminder never cuts the original off.
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The pending next-problem instruction timer. handleSubmit cancels it: that
  // timer calls voice.stop(), and stopping the queue drops the pending onDone
  // that carries level progression.
  const instructionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Watchdog that records the answer if the voice callback never arrives.
  const advanceFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (instructionTimerRef.current) clearTimeout(instructionTimerRef.current);
      if (advanceFallbackRef.current) clearTimeout(advanceFallbackRef.current);
      // Any walkthrough still running belongs to a level that is closing.
      assistRunRef.current++;
      for (const t of assistTimersRef.current) clearTimeout(t);
      if (hintFlashRef.current) clearTimeout(hintFlashRef.current);
    },
    [],
  );
  useEffect(() => {
    if (level.gameMode === 'memory' || finished) {
      setShowTapHint(false);
      return;
    }
    setShowTapHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowTapHint(true), 4000);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    };
  }, [problemIndex, level.gameMode, finished]);

  const dismissHint = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
    setShowTapHint(false);
  }, []);

  const handleCellPress = useCallback(
    (index: number) => {
      if (hasSubmitted && isCorrect) return;
      if (assisting) return; // the walkthrough owns the board
      dismissHint();
      // A tap answers the visual hint, so take it down.
      setHintCells(prev => (prev.length ? [] : prev));
      if (hintFlashRef.current) {
        clearTimeout(hintFlashRef.current);
        hintFlashRef.current = null;
      }

      setCells(prev => {
        const newCells = [...prev];
        const currentState = newCells[index];

        if (level.gameMode === 'counting') {
          newCells[index] = currentState === 'empty' ? 'filled' : 'empty';
        } else if (
          level.gameMode === 'addition' ||
          level.gameMode === 'puzzle' ||
          level.gameMode === 'answer'
        ) {
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
    [hasSubmitted, isCorrect, level.gameMode, assisting, dismissHint],
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
      // currentProblem.num2 is the gap (target - start), which is exactly
      // what the child needs to fill. Works for any target, not just 10.
      correct = color2Count === currentProblem.num2;
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
      // This problem's instruction timer may still be armed, and its first act
      // is voice.stop(). If it fires between here and the praise clip
      // finishing, it clears the queue and takes the `advance` callback below
      // with it. Cancel it — but ONLY on the correct path: on a wrong answer
      // the child still needs to hear the instruction and its 10s replay
      // nudge, and cancelling it there silenced the problem for good.
      if (instructionTimerRef.current) {
        clearTimeout(instructionTimerRef.current);
        instructionTimerRef.current = null;
      }

      const wasFirstTry = attempts === 0;
      // Industry pattern (Khan Academy Kids, Endless Numbers): always name
      // the answer for reinforcement, but only celebrate ~40% of the time so
      // praise stays meaningful instead of feeling auto-fired. The clip's own
      // completion callback drives progression, so pacing follows the actual
      // audio rather than hand-tuned durations (clips vary in length).
      //
      // But progression must not DEPEND on that callback surviving: any
      // voice.stop() — navigation blur, the settings toggle, the app being
      // backgrounded — drops the pending onDone and used to strand the level.
      // The latch below makes the record fire exactly once, from whichever of
      // the two paths reaches it first.
      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        if (advanceFallbackRef.current) {
          clearTimeout(advanceFallbackRef.current);
          advanceFallbackRef.current = null;
        }
        onRecordResult(wasFirstTry);
      };
      if (advanceFallbackRef.current) clearTimeout(advanceFallbackRef.current);
      // The child answered, so the instruction for the problem they just
      // solved is stale — drop whatever is still queued behind the clip that
      // is playing. Without this the praise queues behind up to ~5s of
      // instruction and the watchdog below fires mid-sentence, advancing the
      // level while the narrator is still talking about the previous problem.
      // clearPendingVoiceQueue leaves the in-flight clip and the pump owner
      // alone, so the currently speaking sentence still finishes cleanly.
      clearPendingVoiceQueue();
      // Worst legitimate path from here: the in-flight instruction clip
      // finishing (~2.5s) plus a two-clip praise sequence with its 350ms gap
      // and cold-cache loads. 8s clears that; it is a recovery, not a pace.
      advanceFallbackRef.current = setTimeout(advance, 8000);

      if (level.gameMode === 'memory') {
        advance();
      } else if (level.gameMode === 'puzzle') {
        // Half the time the praise names what the child built — "the frame
        // is full!" only when the target was 10.
        const pool = puzzlePraisePool(
          currentProblem?.answer ?? 10,
          VOICE_GROUPS.correct,
        );
        const praiseId = pool[Math.floor(Math.random() * pool.length)];
        voiceRef.current.play(praiseId, afterBeat(advance));
      } else {
        const themeId = ADVENTURE_WORLDS.find(w => w.id === level.worldId)?.theme;
        const noun = LEVEL_NOUN[level.id];
        const visible = cells.filter(c => c !== 'empty').length;
        // Prefer per-level noun praise ("Great! You have 5 octopuses!") so
        // the result matches the cells on screen. Fall back to world-themed
        // praise for levels without a mapped noun, and bare num_N as the
        // final fallback.
        const resultId =
          visible >= 1 && visible <= 10 && noun
            ? `post_great_${noun}_${visible}`
            : visible >= 1 && visible <= 5 && themeId
            ? `post_great_${themeId}_${visible}`
            : visible >= 0 && visible <= 10
            ? `num_${visible}`
            : null;
        // Praise now names what was achieved for this mode ("that's the
        // total", "that's how many are left") half the time, and draws the
        // generic cheer the rest — so it is both more frequent and less
        // repetitive than the old 40% of eight identical lines.
        const modePool =
          level.gameMode === 'counting'
            ? VOICE_GROUPS.okCounting
            : level.gameMode === 'addition'
            ? VOICE_GROUPS.okAddition
            : level.gameMode === 'subtraction'
            ? VOICE_GROUPS.okSubtraction
            : null;
        const withPraise = Math.random() < 0.65;
        const pool =
          modePool && Math.random() < 0.5 ? modePool : VOICE_GROUPS.correct;
        const praiseId = withPraise
          ? pool[Math.floor(Math.random() * pool.length)]
          : null;

        if (resultId && praiseId) {
          voiceRef.current.playSequence([resultId, praiseId], 350, afterBeat(advance));
        } else if (resultId) {
          voiceRef.current.play(resultId, afterBeat(advance));
        } else if (praiseId) {
          voiceRef.current.play(praiseId, afterBeat(advance));
        } else {
          advance();
        }
      }
    } else {
      // ── The hint ladder ────────────────────────────────────────────
      // Before this existed, every wrong answer got one random "Almost!"
      // and the 10s inactivity timer replayed the IDENTICAL instruction —
      // tapping 6 when the answer was 7 and tapping 2 when the answer was
      // 7 produced byte-identical responses. Three rungs now:
      //   1st miss  → say it again, in a DIFFERENT form
      //   2nd miss  → show it: dim what's right, pulse what must change
      //   3rd miss  → build it together, counting aloud; one star anyway
      // No child ever fails out of a problem.
      const attemptNumber = attempts + 1;
      setAttempts(attemptNumber);

      const noun = LEVEL_NOUN[level.id];
      const themeId = ADVENTURE_WORLDS.find(w => w.id === level.worldId)?.theme;
      const isDoubles =
        level.gameMode === 'addition' &&
        level.modeLevel >= 20 &&
        level.modeLevel <= 25;

      // The quantity the child is building toward — drives the five-structure
      // flash (only meaningful for totals of six or more).
      const buildTarget =
        level.gameMode === 'counting' && countingChallenge
          ? countingChallenge.targetNumber
          : currentProblem?.answer ?? 0;

      // Which cells must change, and the walkthrough board, both live in
      // src/utils/hintLadder.ts as pure functions — they are the part of the
      // ladder that can actually be wrong, and there they are testable.
      const ladderCtx = {
        gameMode: level.gameMode,
        cells,
        problem: currentProblem,
        counting: countingChallenge,
      };

      if (attemptNumber === 1) {
        // Put the board back to the problem's starting operand first. The
        // restatement below says "five… add three more", which was spoken
        // over the child's own wrong attempt: following it made the mistake
        // bigger. Free Play already resets before a retry.
        if (level.gameMode === 'addition' || level.gameMode === 'subtraction') {
          setCells(buildAssistPlan(ladderCtx).base);
          setHintCells([]);
        }
        // Same request, different sentence — a repeat reads as a stuck record.
        voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
        if (level.gameMode === 'counting') {
          // Just the instruction again. The generic "tap the boxes and count"
          // line in front of it made a first miss ~7s of speech.
          lastInstructionVoiceRef.current?.();
        } else if (level.gameMode === 'puzzle' && currentProblem) {
          for (const id of puzzleRetryIds(currentProblem.answer)) {
            voiceRef.current.play(id);
          }
        } else if (currentProblem) {
          if (isDoubles) {
            voiceRef.current.play(`doubles_${currentProblem.num1}`);
          } else if (noun) {
            // The instruction said "you have N, add M" — restate it as the
            // bare number plus the action, which is the counting-on frame.
            const verb = level.gameMode === 'addition' ? 'add_more' : 'take';
            voiceRef.current.playSequence(
              [`num_${currentProblem.num1}`, `${verb}_${noun}_${currentProblem.num2}`],
              350,
            );
          } else if (themeId) {
            const act = level.gameMode === 'addition' ? 'add' : 'sub';
            voiceRef.current.play(`instr_${act}_${themeId}_${currentProblem.num2}`);
          }
        }
      } else if (attemptNumber === 2) {
        voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
        const diff = cellsToChange(ladderCtx);
        if (buildTarget >= 6 && !reduceMotion) {
          // Light the full top row first — the five-structure IS the hint for
          // anything past five — then hand over to the actual cells to fix.
          setHintCells([0, 1, 2, 3, 4]);
          hintFlashRef.current = setTimeout(() => {
            hintFlashRef.current = null;
            setHintCells(diff);
          }, 900);
        } else {
          setHintCells(diff);
        }
      } else {
        // ── Build it together ──
        setAssisting(true);
        setHintCells([]);
        // handleSubmit set hasSubmitted/isCorrect(false) just above, which
        // would keep the red WrongFlash and the 🤔 box on screen through the
        // whole walkthrough. This is teaching now, not judging — clear them;
        // they come back as the success pair when the build finishes.
        setHasSubmitted(false);
        setIsCorrect(null);
        if (instructionTimerRef.current) {
          clearTimeout(instructionTimerRef.current);
          instructionTimerRef.current = null;
        }
        if (reminderTimerRef.current) {
          clearTimeout(reminderTimerRef.current);
          reminderTimerRef.current = null;
        }
        voiceRef.current.stop();

        // Reset to the operand's starting point, then place (or remove) one
        // cell at a time, counting aloud — the same one-to-one counting the
        // level is teaching. The child watches the answer get built instead
        // of being told it.
        const {base, steps} = buildAssistPlan(ladderCtx);

        setCells(base);
        // Paced by the VOICE, not by a fixed 600ms interval. The clips are a
        // queue, so on a fixed schedule the spoken count fell further behind
        // the counters with every step — worst in German, where the numbers
        // are longest — and the next problem's voice cut the count off before
        // it reached the answer. Each step now places its counter, says its
        // number, and only then schedules the next one.
        const run = ++assistRunRef.current;
        const finish = () => {
          setHasSubmitted(true);
          setIsCorrect(true);
          voiceRef.current.playRandom(VOICE_GROUPS.correct);
          assistTimersRef.current.push(
            setTimeout(() => {
              if (assistRunRef.current !== run) return;
              setAssisting(false);
              // wasFirstTry false → one star. Helped is still finished.
              onRecordResult(false);
            }, 2200),
          );
        };
        const step = (i: number) => {
          if (assistRunRef.current !== run) return;
          if (i >= steps.length) {
            finish();
            return;
          }
          const st = steps[i];
          setCells(prev => {
            const n = [...prev];
            n[st.index] = st.state;
            return n;
          });
          voiceRef.current.play(`num_${i + 1}`, () => {
            if (assistRunRef.current !== run) return;
            // A short beat between counters, and the floor that keeps the
            // rhythm human when the voice is switched off (the queue calls
            // back immediately then).
            assistTimersRef.current.push(setTimeout(() => step(i + 1), 320));
          });
        };
        assistTimersRef.current.push(setTimeout(() => step(0), 500));
      }
    }
  }, [cells, currentProblem, countingChallenge, level, attempts, onRecordResult, reduceMotion, afterBeat]);

  // Answer-mode pad nudge: when the frame holds exactly the target quantity
  // and the child pauses, point at the pad — building the board is not the
  // whole answer, naming the number is. Also speaks instr_tap_number when
  // that clip exists in the bundle (fails silently until it ships).
  useEffect(() => {
    if (
      level.gameMode !== 'answer' ||
      finished ||
      hasSubmitted ||
      assisting
    ) {
      setShowPadHint(false);
      return;
    }
    const ap = currentProblem as AnswerProblem | null;
    if (!ap) return;
    const filled = cells.filter(c => c !== 'empty').length;
    setShowPadHint(false);
    if (filled !== ap.answer) return;
    const t = setTimeout(() => {
      setShowPadHint(true);
      // Missing-addend problems are answered with the part that was added;
      // "Now tap the number" sent the child to the total on the frame.
      voiceRef.current.play(padNudgeId(ap.slot));
    }, 1100);
    return () => clearTimeout(t);
  }, [cells, currentProblem, level.gameMode, hasSubmitted, finished, assisting]);

  // Answer mode: a pad tap IS the submission. Correct advances with the
  // spoken number; wrong walks a pad-shaped hint ladder — say it again, show
  // it on the frame, then reveal the bubble. No child fails out.
  const handleAnswerPick = useCallback(
    (n: number) => {
      if (finished || assisting) return;
      if (level.gameMode !== 'answer') return;
      const ap = currentProblem as AnswerProblem | null;
      if (!ap || typeof ap.expected !== 'number') return;
      if (hasSubmitted && isCorrect) return;
      dismissHint();
      setShowPadHint(false);

      if (n === ap.expected) {
        setPadWrongPick(null);
        setHasSubmitted(true);
        setIsCorrect(true);
        if (instructionTimerRef.current) {
          clearTimeout(instructionTimerRef.current);
          instructionTimerRef.current = null;
        }
        const wasFirstTry = attempts === 0;
        let advanced = false;
        const advance = () => {
          if (advanced) return;
          advanced = true;
          if (advanceFallbackRef.current) {
            clearTimeout(advanceFallbackRef.current);
            advanceFallbackRef.current = null;
          }
          onRecordResult(wasFirstTry);
        };
        if (advanceFallbackRef.current) clearTimeout(advanceFallbackRef.current);
        clearPendingVoiceQueue();
        advanceFallbackRef.current = setTimeout(advance, 8000);
        // Speak the number the child just named; praise ~40% of the time.
        const praiseId =
          Math.random() < 0.4
            ? VOICE_GROUPS.correct[
                Math.floor(Math.random() * VOICE_GROUPS.correct.length)
              ]
            : null;
        const ids = praiseId ? [`num_${n}`, praiseId] : [`num_${n}`];
        voiceRef.current.playSequence(ids, 350, afterBeat(advance));
        return;
      }

      const attemptNumber = attempts + 1;
      setAttempts(attemptNumber);
      setPadWrongPick(n);
      setHasSubmitted(true);
      setIsCorrect(false);

      if (attemptNumber === 1) {
        voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
        lastInstructionVoiceRef.current?.();
      } else if (attemptNumber === 2) {
        // Show it: complete the frame so the child can count the answer.
        voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
        setCells(() => {
          const filled = Array(10).fill('empty') as CellState[];
          for (let i = 0; i < ap.num1; i++) filled[i] = 'color1';
          for (let i = ap.num1; i < ap.answer && i < 10; i++) filled[i] = 'color2';
          return filled;
        });
      } else {
        // Reveal: light the right bubble, say the number, one star anyway.
        setAssisting(true);
        setPadWrongPick(null);
        setHasSubmitted(false);
        setIsCorrect(null);
        voiceRef.current.stop();
        assistTimersRef.current.push(
          setTimeout(() => {
            setPadReveal(true);
            setHasSubmitted(true);
            setIsCorrect(true);
            voiceRef.current.play(`num_${ap.expected}`);
          }, 400),
        );
        assistTimersRef.current.push(
          setTimeout(() => {
            setAssisting(false);
            onRecordResult(false);
          }, 2600),
        );
      }
    },
    [
      finished,
      assisting,
      level.gameMode,
      currentProblem,
      hasSubmitted,
      isCorrect,
      attempts,
      onRecordResult,
      dismissHint,
      afterBeat,
    ],
  );

  // Compare mode: tapping a frame IS the answer. Correct names the winning
  // count aloud (reinforcing the count they just compared) and advances;
  // wrong replays the gentle try-again and lets them pick again.
  const handleComparePick = useCallback(
    (side: 'left' | 'right' | 'equal') => {
      if (finished || !compareProblem || (hasSubmitted && isCorrect)) return;
      dismissHint();

      // A wrong tap schedules a 1.2s reset of the submitted state; a correct
      // tap inside that window used to be wiped by it — the green highlight
      // vanished and "Almost!" followed "Yes!". Cancel it first.
      for (const t of assistTimersRef.current) clearTimeout(t);
      assistTimersRef.current = [];
      if (side === compareProblem.correct) {
        setHasSubmitted(true);
        setIsCorrect(true);
        const wasFirstTry = attempts === 0;
        let advanced = false;
        const advance = () => {
          if (advanced) return;
          advanced = true;
          if (advanceFallbackRef.current) {
            clearTimeout(advanceFallbackRef.current);
            advanceFallbackRef.current = null;
          }
          onRecordResult(wasFirstTry);
        };
        if (advanceFallbackRef.current) clearTimeout(advanceFallbackRef.current);
        clearPendingVoiceQueue();
        advanceFallbackRef.current = setTimeout(advance, 6000);
        // Name the count that settled it, then confirm in words about the
        // comparison itself — drawn from a rotating set so five problems in
        // a row never sound identical.
        const isEqual = compareProblem.correct === 'equal';
        const spokenCount = isEqual
          ? compareProblem.left
          : Math.max(compareProblem.left, compareProblem.right);
        const pool = isEqual
          ? VOICE_GROUPS.compareSame
          : VOICE_GROUPS.compareYes;
        const confirmId = pool[Math.floor(Math.random() * pool.length)];
        voiceRef.current.playSequence(
          [`num_${spokenCount}`, confirmId],
          350,
          advance,
        );
      } else {
        setAttempts(prev => prev + 1);
        setHasSubmitted(true);
        setIsCorrect(false);
        voiceRef.current.playRandom(VOICE_GROUPS.tryAgain);
        // Clear the red state shortly so the frames invite another tap.
        assistTimersRef.current.push(
          setTimeout(() => {
            setHasSubmitted(false);
            setIsCorrect(null);
          }, 1200),
        );
      }
    },
    [finished, compareProblem, hasSubmitted, isCorrect, attempts, onRecordResult, dismissHint],
  );

  // Auto-complete level when finished
  useEffect(() => {
    if (finished && completedStars === null) {
      const result = onComplete();
      setCompletedStars(result.stars);
    }
  }, [finished, completedStars, onComplete, afterBeat]);

  // Judge where the child STOPS, not where the app catches them. Every cell
  // change re-arms one timer; when the child leaves the board alone for
  // STOP_JUDGE_MS, whatever is on it is their answer — right or wrong, it
  // goes through handleSubmit and, if wrong, into the hint ladder. The old
  // behaviour submitted 350ms after the count MATCHED, so a child tapping
  // onward toward a larger number was stopped and celebrated the moment they
  // passed through the right answer, without ever deciding anything.
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  useEffect(() => {
    if (finished || hasSubmitted || assisting) return;
    // Answer mode: the pad is the submit button; the board is only a working
    // space and must never be auto-judged.
    if (
      level.gameMode === 'memory' ||
      level.gameMode === 'share' ||
      level.gameMode === 'answer' ||
      level.gameMode === 'compare'
    ) {
      return;
    }

    // Only judge once the child has touched their operand — an untouched
    // board is "still thinking", and the 10s voice nudge owns that case.
    let engaged = false;
    if (level.gameMode === 'counting' && countingChallenge) {
      engaged = cells.some(c => c !== 'empty');
    } else if (
      (level.gameMode === 'addition' || level.gameMode === 'puzzle') &&
      currentProblem
    ) {
      engaged = cells.some(c => c === 'color2');
    } else if (level.gameMode === 'subtraction' && currentProblem) {
      engaged =
        cells.filter(c => c === 'color1').length !== currentProblem.num1;
    }
    if (!engaged) return;

    const t = setTimeout(() => handleSubmitRef.current(), STOP_JUDGE_MS);
    return () => clearTimeout(t);
  }, [cells, currentProblem, countingChallenge, level, hasSubmitted, finished, problemIndex, assisting]);

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
    const themeId = ADVENTURE_WORLDS.find(w => w.id === level.worldId)?.theme;

    let key = '';
    let action: (() => void) | null = null;

    if (level.gameMode === 'counting' && countingChallenge) {
      const {instruction, targetNumber} = countingChallenge;
      key = `c-${instruction}-${targetNumber}`;
      const ids = countingInstructionIds(countingChallenge, problemIndex);
      action = () => voiceRef.current.playSequence(ids, 300);
    } else if (level.gameMode === 'puzzle' && currentProblem) {
      key = `p-${currentProblem.answer}-${currentProblem.num1}`;
      // The target ("Make 7!"), then how to get there — worded for the
      // target, since only 10 fills the frame. See puzzleNarration.ts.
      const ids = puzzleInstructionIds(currentProblem.answer, problemIndex);
      action = () => voiceRef.current.playSequence(ids, 350);
    } else if (level.gameMode === 'compare' && compareProblem) {
      key = `cmp-${problemIndex}-${compareProblem.left}-${compareProblem.right}`;
      // First problem explains, later ones nudge — and on the levels where
      // equal pairs appear, the opener also teaches the "Same" button.
      const ids = compareAskIds(level.modeLevel, problemIndex);
      action = () => voiceRef.current.playSequence(ids, 400);
    } else if (level.gameMode === 'share' && shareProblem) {
      key = `sh-${problemIndex}-${shareProblem.total}-${shareProblem.buckets}`;
      const isFirst = problemIndex === 0;
      // Announce the total, then either the rules intro (first problem) or
      // a "make it fair" nudge (later problems).
      const ids = [`num_${shareProblem.total}`, isFirst ? 'share_intro' : 'share_again'];
      action = () => voiceRef.current.playSequence(ids, 400);
    } else if (level.gameMode === 'answer' && currentProblem) {
      const ap = currentProblem as AnswerProblem;
      key = `a-${ap.slot}-${ap.num1}-${ap.num2}`;
      const noun = LEVEL_NOUN[level.id];
      const ids = answerInstructionIds(
        ap.slot,
        ap.num1,
        ap.num2,
        ap.answer,
        noun,
      );
      action = () => voiceRef.current.playSequence(ids, 350);
    } else if (currentProblem && themeId) {
      const mode = level.gameMode;
      key = `${mode}-${currentProblem.num1}-${currentProblem.num2}`;
      // Doubles Castle: generic "N plus N!" clip (level emoji varies).
      const isDoubles = mode === 'addition' && level.modeLevel >= 20 && level.modeLevel <= 25;
      // Other levels: voice the level emoji's noun ("3 octopuses", "2 stars")
      // so the narrator matches the cells the child sees.
      const noun = LEVEL_NOUN[level.id];
      // The task used to be restated as a question on every other problem
      // ("How many are there now in total?"). It arrived while the child was
      // still placing counters, and the owner heard the app as talking too
      // much. The instruction alone is enough; the 10s stall nudge repeats it
      // for a child who hasn't started.
      if (isDoubles && currentProblem.num1 >= 1 && currentProblem.num1 <= 5) {
        const ids = [`doubles_${currentProblem.num1}`];
        action = () => voiceRef.current.playSequence(ids, 350);
      } else if (noun) {
        const verb = mode === 'addition' ? 'add_more' : 'take';
        const ids = [
          `have_${noun}_${currentProblem.num1}`,
          `${verb}_${noun}_${currentProblem.num2}`,
        ];
        action = () => voiceRef.current.playSequence(ids, 350);
      } else {
        const act = mode === 'addition' ? 'add' : 'sub';
        // Fallback: themed world-noun sentence (kept for backward compat
        // until per-level noun clips are added for every world).
        const ids = [
          `pre_have_${themeId}_${currentProblem.num1}`,
          `instr_${act}_${themeId}_${currentProblem.num2}`,
        ];
        action = () => voiceRef.current.playSequence(ids, 350);
      }
    }

    if (!action || key === prevVoiceKey.current) return;
    prevVoiceKey.current = key;
    // Remember the current problem's instruction so the inactivity nudge
    // (5s without a tap) can replay it instead of speaking generic text.
    lastInstructionVoiceRef.current = action;

    // Wait for the ProblemTransition overlay (~2.2s) to play out before the
    // next-problem instruction voice starts. Otherwise the voice narrates
    // content the child can't yet see clearly.
    const delay = isFirstProblemRef.current ? 400 : 2300;
    isFirstProblemRef.current = false;
    const timer = setTimeout(() => {
      instructionTimerRef.current = null;
      // Clear any leftover audio + queued clips from the previous problem
      // (e.g. share_intro that didn't finish before the child got it right).
      // Without this, the new problem's voice queues BEHIND the old one and
      // the child hears the previous instruction replay.
      voiceRef.current.stop();
      action!();
      // Schedule the inactivity replay AFTER the first voice has started
      // playing, with enough margin (10s) to outlast even the longest
      // chained sentence. Otherwise the reminder cut the original off.
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
      reminderTimerRef.current = setTimeout(() => {
        lastInstructionVoiceRef.current?.();
      }, 10000);
    }, delay);
    instructionTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (instructionTimerRef.current === timer) instructionTimerRef.current = null;
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    };
  }, [currentProblem, countingChallenge, shareProblem, compareProblem, problemIndex, level, finished]);

  // Stores the last per-problem voice action; tapped by the inactivity timer
  // below to replay the instruction when the child stalls.
  const lastInstructionVoiceRef = useRef<(() => void) | null>(null);

  // Reset first-problem flag when the level itself changes.
  useEffect(() => {
    isFirstProblemRef.current = true;
    prevVoiceKey.current = null;
  }, [level]);

  // Theme background — prefer the level's own theme override (Memory Garden
  // varies per level for visual variety), else the world's theme.
  const world = ADVENTURE_WORLDS.find(w => w.id === level.worldId);
  const allThemes = getAllThemes();
  const activeThemeId = level.theme ?? world?.theme;
  const worldTheme = allThemes.find(
    (th: ThemeConfig) => th.id === activeThemeId,
  );
  const bgImage = worldTheme?.backgroundPortrait;
  const themeColors = worldTheme?.colors ?? colors;

  // Visual instruction: big emoji/number + small text
  type EquationPart = {text: string; color: string};
  // Once the answer is right, the '?' is filled in and each number wears the
  // colour of its counters — the same completed equation Free Play shows.
  // The screen used to keep "3 + 4 = ?" up through the whole celebration.
  const solvedParts = (): EquationPart[] | null => {
    if (!hasSubmitted || isCorrect !== true || !currentProblem) return null;
    const c1 = themeColors.cellColor1;
    const c2 = themeColors.cellColor2;
    const answer = '#4ADE80';
    const plain = '#FFFFFF';
    const p = currentProblem;
    if (level.gameMode === 'addition') {
      return [
        {text: String(p.num1), color: c1},
        {text: ' + ', color: plain},
        {text: String(p.num2), color: c2},
        {text: ' = ', color: plain},
        {text: String(p.answer), color: answer},
      ];
    }
    if (level.gameMode === 'subtraction') {
      return [
        {text: String(p.num1), color: c1},
        {text: ' − ', color: plain},
        {text: String(p.num2), color: plain},
        {text: ' = ', color: plain},
        {text: String(p.answer), color: answer},
      ];
    }
    if (level.gameMode === 'puzzle') {
      return [
        {text: String(p.num1), color: c1},
        {text: ' + ', color: plain},
        {text: String(p.num2), color: answer},
        {text: ' = ', color: plain},
        {text: String(p.answer), color: plain},
      ];
    }
    if (level.gameMode === 'answer') {
      const ap = p as AnswerProblem;
      return [
        {text: String(ap.num1), color: c1},
        {text: ' + ', color: plain},
        {text: String(ap.num2), color: ap.slot === 'addend' ? answer : c2},
        {text: ' = ', color: plain},
        {text: String(ap.answer), color: ap.slot === 'sum' ? answer : plain},
      ];
    }
    return null;
  };

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
    if (level.gameMode === 'answer' && currentProblem) {
      const ap = currentProblem as AnswerProblem;
      return {
        visual:
          ap.slot === 'sum'
            ? `${ap.num1} + ${ap.num2} = ?`
            : `${ap.num1} + ? = ${ap.answer}`,
        text: t('adventure.pickTheNumber'),
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
      // currentProblem.answer is the level's target (10 for legacy Make 10
      // levels, 3..9 for Make N levels). num2 is the gap (target - num1).
      // The "Fill exactly N cells" hint kicks in only on the first three
      // levels of a world — after that, the equation alone is enough.
      const target = currentProblem.answer;
      const remaining = currentProblem.num2;
      const showHint = level.order <= 3;
      return {
        visual: `${currentProblem.num1} + ? = ${target}`,
        text: showHint ? t('adventure.fillExactly', {count: remaining}) : '',
      };
    }
    return {visual: '', text: ''};
  };

  // Total non-empty cells = the visible count. For subtraction this is
  // num1 - (cells removed) = current remaining. For addition this is
  // num1 + (color2 added) = total so far. For puzzle: color1 + color2.
  const filledCount = cells.filter(c => c !== 'empty').length;

  return (
    <View style={styles.modalRoot}>
    <ImageBackground source={bgImage} style={styles.background} resizeMode="cover">
      <WrongFlash visible={hasSubmitted && isCorrect === false} />
      <ProblemTransition
        trigger={problemIndex}
        current={Math.min(problemIndex + 1, problemCount)}
        total={problemCount}
        colors={themeColors}
      />
      {/* Scrollable, because the level does not fit every window: on short
          ones (a small phone in a system font size, an iPad in Split View,
          an Android phone with a tall navigation bar) the ✕ and the header
          were pushed off the top while the number pad and the submit row
          fell off the bottom, with no way to reach either. It still centres
          when there is room. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.overlay}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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
            {Array.from({length: problemCount}).map((_, i) => {
              const isActive = i === problemIndex;
              return (
                <Animated.View
                  // Force re-mount the active dot on each transition so the
                  // pop-in animation fires when problemIndex advances.
                  key={isActive ? `active-${problemIndex}` : `dot-${i}`}
                  entering={isActive ? BounceIn.duration(450) : undefined}
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    {
                      // Done / current / still to come. Finished pips used
                      // to be green or RED by first-try result, so a problem
                      // the child got through with help sat there as a
                      // failure for the rest of the level — in a colour pair
                      // a colour-blind child cannot tell apart. Quality is
                      // rewarded by the stars at the end, not here.
                      backgroundColor:
                        i < problemIndex || isActive
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.3)',
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {level.gameMode === 'compare' ? (
          <CompareMode
            problem={compareProblem}
            onPick={handleComparePick}
            onReset={() => {}}
            isCorrect={isCorrect}
            hasSubmitted={hasSubmitted}
            colors={themeColors}
            level={level.modeLevel}
            ageProfile={{compact: true} as any}
            hideChrome
          />
        ) : level.gameMode === 'share' ? (
          (() => {
            // One consistent food/animal pair per level so the story holds
            // ("Bunnies & Carrots" really shows bunnies and carrots all 5
            // problems, not random animals mid-level). Default fallback for
            // anything not mapped.
            const LEVEL_PAIRS: Record<string, {food: string; animal: string}> = {
              'fs-1': {food: '🥕', animal: '🐰'},
              'fs-2': {food: '🌽', animal: '🐔'},
              'fs-3': {food: '🍎', animal: '🐷'},
              'fs-4': {food: '🌾', animal: '🐄'},
              'fs-5': {food: '🌽', animal: '🐔'},
              'fs-6': {food: '🥕', animal: '🐰'},
              'fs-bonus-a': {food: '🍎', animal: '🐷'},
              'fs-bonus-b': {food: '🌾', animal: '🐄'},
            };
            const pair = LEVEL_PAIRS[level.id] ?? {food: '🥕', animal: '🐰'};
            return (
              <FarmShareMode
                problem={shareProblem}
                foodEmoji={pair.food}
                animalEmoji={pair.animal}
                colors={themeColors}
                tokenImage={worldTheme?.tokenImage}
                // Training-wheels: highlight overflowing baskets in red on
                // the first two levels; later levels rely on voice alone.
                // Every level gets one voice-only try per problem; after an
                // unfair split the cue shows. Six of eight levels used to be
                // voice-only throughout, which excludes a child who cannot
                // hear it.
                showOverflowHint={level.modeLevel <= 2 || attempts > 0}
                onMatch={() => onRecordResult(attempts === 0)}
                onUnfair={() => {
                  setAttempts(prev => prev + 1);
                  voiceRef.current.play('share_unfair');
                }}
                onInteract={dismissHint}
              />
            );
          })()
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
                // Problems 2+ used to be completely silent through show and
                // input. They now get a short watch cue and, once the grid
                // clears, an explicit prompt to tap what they remember.
                if (phase === 'show') {
                  voiceRef.current.play(
                    problemIndex === 0
                      ? 'mem_intro'
                      : problemIndex % 2 === 1
                      ? 'mem_watch'
                      : 'mem_watch_2',
                  );
                } else if (phase === 'input') {
                  voiceRef.current.play(
                    problemIndex % 2 === 0 ? 'mem_now_1' : 'mem_now_2',
                  );
                } else if (phase === 'reveal') {
                  const pool =
                    Math.random() < 0.5
                      ? VOICE_GROUPS.okMemory
                      : VOICE_GROUPS.correct;
                  voiceRef.current.playRandom(pool);
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
                  {(() => {
                    const parts = solvedParts();
                    return parts ? (
                      <Text style={styles.instructionVisual}>
                        {parts.map((part, i) => (
                          <Text key={i} style={{color: part.color}}>
                            {part.text}
                          </Text>
                        ))}
                      </Text>
                    ) : (
                      <Text style={styles.instructionVisual}>{instr.visual}</Text>
                    );
                  })()}
                  {instr.text ? (
                    <Text style={styles.instructionText}>{instr.text}</Text>
                  ) : null}
                </View>
              );
            })()}

            {/* Ten Frame — fade in on each new problem so the transition reads */}
            <Animated.View
              key={`problem-${problemIndex}`}
              entering={FadeIn.duration(350)}
              style={styles.gameArea}>
              <TenFrame
                cells={cells}
                onCellClick={handleCellPress}
                disabled={assisting}
                colors={themeColors}
                emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
                overrideEmoji={level.emoji}
                hintedCells={hintCells}
                demo={
                  level.gameMode === 'counting' ||
                  level.gameMode === 'addition' ||
                  level.gameMode === 'subtraction' ||
                  level.gameMode === 'puzzle'
                    ? level.gameMode
                    : undefined
                }
              />
              <TapHint visible={showTapHint && !hasSubmitted && !assisting} />
            </Animated.View>

            {/* Count display — answer mode swaps it for the number pad,
                which is both the count check and the submit button */}
            {level.gameMode === 'answer' ? (
              <>
                <PadHint visible={showPadHint} />
                <NumberPad
                  onPick={handleAnswerPick}
                  colors={themeColors}
                  disabled={assisting}
                  highlight={
                    padReveal || (hasSubmitted && isCorrect === true)
                      ? (currentProblem as AnswerProblem | null)?.expected ?? null
                      : null
                  }
                  wrongPick={padWrongPick}
                />
              </>
            ) : (
              <NumberDisplay
                number={filledCount}
                colors={themeColors}
                emoji={worldTheme?.colors?.emojiColor1 ?? '🔵'}
              />
            )}

            {/* Submit / Feedback */}
            {!finished && (
              <View style={styles.submitArea}>
                {hasSubmitted && isCorrect && (
                  <Animated.View
                    entering={BounceIn.duration(400)}
                    style={styles.feedbackBox}>
                    <Mascot pose="jump" height={64} />
                    <Text style={styles.feedbackCorrect}>{t('feedback.correct')}</Text>
                  </Animated.View>
                )}
                {hasSubmitted && !isCorrect && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.feedbackBox}>
                    <Mascot pose="think" height={64} />
                    <Text style={styles.feedbackWrong}>{t('feedback.tryAgain')}</Text>
                  </Animated.View>
                )}
                {/* Manual ✓ button removed — auto-submit handles it for 4-7 ages. */}
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
          worldComplete={worldComplete}
            onNextLevel={onNextLevel}
            onReplay={onReplay}
            onBackToMap={onBackToMap}
          />
        )}
      </ScrollView>
    </ImageBackground>
    </View>
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
  scroll: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlay: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 16,
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
  dotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
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
    justifyContent: 'center',
    marginTop: 12,
    // Reserve height even when no feedback is showing so the ten frame
    // doesn't jump up/down between question and answer states.
    minHeight: 72,
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
