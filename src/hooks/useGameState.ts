import {useState, useCallback, useEffect, useRef} from 'react';
import {
  GameMode,
  CellState,
  Problem,
  MascotMood,
  Theme,
  Language,
  AgeGroup,
} from '../types/game';
import {generateProblem, generatePuzzleNumber, generateShareProblem, generateAnswerProblem, generateCompareProblem, ShareProblem} from '../utils/mathProblems';
import {AnswerProblem, CompareProblem} from '../types/game';
import {shouldLevelUp} from '../utils/scoring';
import i18n from '../i18n';

export function useGameState() {
  const [gameMode, setGameMode] = useState<GameMode>('counting');
  const [cells, setCells] = useState<CellState[]>(Array(10).fill('empty'));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [showConfetti, setShowConfetti] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState(5);
  const [shareProblem, setShareProblem] = useState<ShareProblem | null>(null);
  const [showPuzzleAnswer, setShowPuzzleAnswer] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('space');
  // Initialize from i18n's resolved language (which picks the device locale,
  // RO if Romanian, EN otherwise). Without this, language defaulted to 'ro'
  // while the UI text already followed i18n and rendered in EN — the language
  // picker then showed RO highlighted on an EN screen.
  const [language, setLanguage] = useState<Language>(
    i18n.language === 'ro' ? 'ro' :
    i18n.language === 'de' ? 'de' :
    'en',
  );
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('young');
  const [playerName, setPlayerName] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [isThemeChange, setIsThemeChange] = useState(false);
  // Track addition phase: 'first' = placing num1, 'second' = placing num2
  const [additionPhase, setAdditionPhase] = useState<'first' | 'second'>('first');
  // Per-mode difficulty levels (1-9 = focused, 10+ = random)
  const [additionLevel, setAdditionLevel] = useState(1);
  const [subtractionLevel, setSubtractionLevel] = useState(1);
  // Answer mode ("name the number"): 1-3 sum slot, 5-6 missing addend, 7 mixed
  const [answerLevel, setAnswerLevel] = useState(1);
  const [answerProblem, setAnswerProblem] = useState<AnswerProblem | null>(null);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  // Compare mode ("which has more?")
  const [compareLevel, setCompareLevel] = useState(1);
  const [compareProblem, setCompareProblem] = useState<CompareProblem | null>(null);
  // Consecutive correct answers at current level (level up after 3)
  const [levelCorrectStreak, setLevelCorrectStreak] = useState(0);

  // Refs for stale closure prevention
  const hasSubmittedRef = useRef(hasSubmitted);
  hasSubmittedRef.current = hasSubmitted;
  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;
  const additionPhaseRef = useRef(additionPhase);
  additionPhaseRef.current = additionPhase;
  const currentProblemRef = useRef(currentProblem);
  currentProblemRef.current = currentProblem;

  // Count cells by type
  const filledCount = cells.filter(c => c !== 'empty').length;
  const color1Count = cells.filter(c => c === 'color1').length;
  const color2Count = cells.filter(c => c === 'color2').length;

  // === SETUP HELPERS ===

  // Addition: pre-fill num1 cells with color1, child adds num2 with color2
  const setupAdditionCells = useCallback((problem: Problem) => {
    const newCells: CellState[] = Array(10).fill('empty');
    // Place num1 cells as color1 (first addend) — top row first, left to right
    for (let i = 0; i < problem.num1; i++) {
      newCells[i] = 'color1';
    }
    setCells(newCells);
    setAdditionPhase('second');
  }, []);

  // Subtraction: pre-fill num1 cells with color1, child removes num2
  const setupSubtractionCells = useCallback((problem: Problem) => {
    const newCells: CellState[] = Array(10).fill('empty');
    for (let i = 0; i < problem.num1; i++) {
      newCells[i] = 'color1';
    }
    setCells(newCells);
  }, []);

  // Puzzle: pre-fill puzzleNumber cells with color1, child fills complement with color2
  const setupPuzzleCells = useCallback((number: number) => {
    const newCells: CellState[] = Array(10).fill('empty');
    for (let i = 0; i < number; i++) {
      newCells[i] = 'color1';
    }
    setCells(newCells);
  }, []);

  const additionLevelRef = useRef(additionLevel);
  additionLevelRef.current = additionLevel;
  const subtractionLevelRef = useRef(subtractionLevel);
  subtractionLevelRef.current = subtractionLevel;
  const ageGroupRef = useRef(ageGroup);
  ageGroupRef.current = ageGroup;
  const answerLevelRef = useRef(answerLevel);
  answerLevelRef.current = answerLevel;
  const compareLevelRef = useRef(compareLevel);
  compareLevelRef.current = compareLevel;
  const answerProblemRef = useRef(answerProblem);
  answerProblemRef.current = answerProblem;
  const compareProblemRef = useRef(compareProblem);
  compareProblemRef.current = compareProblem;

  const doGenerateProblem = useCallback(() => {
    const mode = gameModeRef.current;

    if (mode === 'answer') {
      const p = generateAnswerProblem(answerLevelRef.current);
      setAnswerProblem(p);
      setWrongPick(null);
      setCurrentProblem(null);
      setFeedback('');
      setIsCorrect(null);
      setHasSubmitted(false);
      setMascotMood('thinking');
      // The frame is the child's working space: num1 pre-placed, they build
      // the rest and then NAME the number on the pad.
      const newCells: CellState[] = Array(10).fill('empty');
      for (let i = 0; i < p.num1; i++) {
        newCells[i] = 'color1';
      }
      setCells(newCells);
      setUserAnswer(p.num1);
      return;
    }

    if (mode === 'compare') {
      setCompareProblem(generateCompareProblem(compareLevelRef.current));
      setWrongPick(null);
      setCurrentProblem(null);
      setFeedback('');
      setIsCorrect(null);
      setHasSubmitted(false);
      setMascotMood('thinking');
      setCells(Array(10).fill('empty'));
      setUserAnswer(null);
      return;
    }

    const modeLevel = mode === 'addition' ? additionLevelRef.current : subtractionLevelRef.current;
    const problem = generateProblem(mode, modeLevel, ageGroupRef.current);
    setCurrentProblem(problem);
    setFeedback('');
    setIsCorrect(null);
    setHasSubmitted(false);
    setMascotMood('thinking');

    if (mode === 'addition') {
      // Addition: show num1 as color1, child adds num2 as color2
      setupAdditionCells(problem);
      setUserAnswer(problem.num1); // starts with num1 already placed
    } else if (mode === 'subtraction') {
      // Subtraction: show num1 as color1, child removes num2
      setupSubtractionCells(problem);
      setUserAnswer(problem.num1);
    } else {
      setCells(Array(10).fill('empty'));
      setUserAnswer(null);
    }
  }, [setupAdditionCells, setupSubtractionCells]);

  // Generate problem when mode changes
  useEffect(() => {
    // Drop any feedback-pause advance from the previous mode.
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    waitTimeoutRef.current = null;
    pendingAdvanceRef.current = null;
    setLevelCorrectStreak(0);
    if (
      gameMode === 'addition' ||
      gameMode === 'subtraction' ||
      gameMode === 'answer' ||
      gameMode === 'compare'
    ) {
      doGenerateProblem();
    } else if (gameMode === 'puzzle') {
      const num = generatePuzzleNumber();
      setPuzzleAnswer(num);
      setupPuzzleCells(num);
      setCurrentProblem(null);
      setUserAnswer(null);
      setFeedback('');
      setIsCorrect(null);
      setHasSubmitted(false);
      setShowPuzzleAnswer(false);
      setMascotMood('thinking');
    } else if (gameMode === 'share') {
      // Free-play: rotate through level 1..5 share configs randomly.
      const sp = generateShareProblem(Math.floor(Math.random() * 5) + 1);
      setShareProblem(sp);
      setCells(Array(10).fill('empty'));
      setCurrentProblem(null);
      setUserAnswer(null);
      setFeedback('');
      setIsCorrect(null);
      setHasSubmitted(false);
      setMascotMood('thinking');
    } else {
      // Counting
      setCells(Array(10).fill('empty'));
      setCurrentProblem(null);
      setUserAnswer(null);
      setFeedback('');
      setIsCorrect(null);
      setHasSubmitted(false);
      setMascotMood('happy');
    }
  }, [gameMode]);

  // Level up check
  useEffect(() => {
    if (shouldLevelUp(score, level)) {
      setLevel(prev => prev + 1);
      setMascotMood('celebrating');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [score, level]);

  // === FEEDBACK-WAIT SCHEDULING ===
  // After a submit the board pauses (praise, or a beat before retry). The
  // pause is skippable: tapping the frame fires the pending advance now, so
  // the wait never walls off a fast child.
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAdvanceRef = useRef<(() => void) | null>(null);
  const advanceScheduledAtRef = useRef(0);

  const scheduleAdvance = useCallback((fn: () => void, delayMs: number) => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    pendingAdvanceRef.current = fn;
    advanceScheduledAtRef.current = Date.now();
    waitTimeoutRef.current = setTimeout(() => {
      waitTimeoutRef.current = null;
      pendingAdvanceRef.current = null;
      fn();
    }, delayMs);
  }, []);

  const cancelPendingAdvance = useCallback(() => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    waitTimeoutRef.current = null;
    pendingAdvanceRef.current = null;
  }, []);

  // Returns true when the tap was consumed by a pending wait. The 600ms grace
  // swallows the stray extra tap a child often lands right as the board is
  // judged, without cutting the feedback short.
  const skipWait = useCallback((): boolean => {
    if (!pendingAdvanceRef.current || !waitTimeoutRef.current) return false;
    if (Date.now() - advanceScheduledAtRef.current < 600) return true;
    clearTimeout(waitTimeoutRef.current);
    const fn = pendingAdvanceRef.current;
    waitTimeoutRef.current = null;
    pendingAdvanceRef.current = null;
    fn();
    return true;
  }, []);

  // === CELL CLICK HANDLERS ===

  const handleCellClick = useCallback(
    (index: number) => {
      const mode = gameModeRef.current;

      if (mode === 'counting') {
        // Free toggle with 'filled' state
        setCells(prev => {
          const newCells = [...prev];
          newCells[index] = newCells[index] === 'empty' ? 'filled' : 'empty';
          return newCells;
        });
      } else if (mode === 'addition') {
        // During the feedback pause a frame tap advances instead of editing.
        if (hasSubmittedRef.current) {
          skipWait();
          return;
        }
        // Addition: color1 cells are locked (first addend), child can only
        // add/remove color2 cells in empty spots
        setCells(prev => {
          const newCells = [...prev];
          if (newCells[index] === 'color1') {
            // Can't remove the first addend cells
            return prev;
          }
          if (newCells[index] === 'empty') {
            newCells[index] = 'color2';
          } else if (newCells[index] === 'color2') {
            newCells[index] = 'empty';
          }
          const totalFilled = newCells.filter(c => c !== 'empty').length;
          setUserAnswer(totalFilled);
          return newCells;
        });
      } else if (mode === 'answer') {
        // Same board rules as addition — but the frame is only a working
        // space; the answer is submitted from the number pad.
        if (hasSubmittedRef.current) {
          skipWait();
          return;
        }
        setCells(prev => {
          const newCells = [...prev];
          if (newCells[index] === 'color1') {
            return prev;
          }
          if (newCells[index] === 'empty') {
            newCells[index] = 'color2';
          } else if (newCells[index] === 'color2') {
            newCells[index] = 'empty';
          }
          const totalFilled = newCells.filter(c => c !== 'empty').length;
          setUserAnswer(totalFilled);
          return newCells;
        });
      } else if (mode === 'subtraction') {
        if (hasSubmittedRef.current) {
          skipWait();
          return;
        }
        // Subtraction: child can only remove color1 cells (or re-add them)
        setCells(prev => {
          const newCells = [...prev];
          if (newCells[index] === 'color1') {
            newCells[index] = 'empty';
          } else if (newCells[index] === 'empty') {
            // Allow undo — re-add as color1
            newCells[index] = 'color1';
          }
          const totalFilled = newCells.filter(c => c !== 'empty').length;
          setUserAnswer(totalFilled);
          return newCells;
        });
      } else if (mode === 'puzzle') {
        // A tap during the answer-reveal pause advances instead of editing.
        if (skipWait()) return;
        // Puzzle: color1 cells are locked, child adds/removes color2
        setCells(prev => {
          const newCells = [...prev];
          if (newCells[index] === 'color1') {
            return prev; // Can't touch pre-filled cells
          }
          if (newCells[index] === 'empty') {
            newCells[index] = 'color2';
          } else if (newCells[index] === 'color2') {
            newCells[index] = 'empty';
          }
          return newCells;
        });
      }
    },
    [skipWait],
  );

  // === SUBMIT HANDLERS ===

  const handleSubmit = useCallback(() => {
    if (!currentProblemRef.current || hasSubmittedRef.current) return;
    const problem = currentProblemRef.current;
    const mode = gameModeRef.current;

    // Count total filled cells
    const currentFilledCount = cells.filter(c => c !== 'empty').length;

    // For addition: answer = num1 + num2
    //   color1 = num1 (pre-placed), color2 = what child added
    //   total should be answer
    // For subtraction: answer = num1 - num2
    //   child started with num1 color1 cells and should have removed num2
    //   remaining should equal answer
    const expectedAnswer = problem.answer;

    if (currentFilledCount === expectedAnswer) {
      // CORRECT
      setIsCorrect(true);
      setFeedback('correct');
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setHasSubmitted(true);
      setShowConfetti(true);
      setMascotMood('excited');

      // Level-up: after 3 correct in a row at current level
      setLevelCorrectStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 3) {
          if (mode === 'addition') {
            setAdditionLevel(l => Math.min(l + 1, 11));
          } else if (mode === 'subtraction') {
            setSubtractionLevel(l => Math.min(l + 1, 11));
          }
          return 0; // Reset streak for next level
        }
        return newStreak;
      });

      // Longer than the praise voice (post_great_<theme>_<N> ≈ 2-3s) so
      // the kid hears the full sentence + has a beat to settle before the
      // next problem appears. A frame tap skips ahead.
      scheduleAdvance(() => {
        setShowConfetti(false);
        doGenerateProblem();
      }, 5000);
    } else {
      // WRONG
      setIsCorrect(false);
      setFeedback('wrong');
      setStreak(0);
      setLevelCorrectStreak(0); // Reset level streak on wrong answer
      setHasSubmitted(true);
      setMascotMood('thinking');

      // After 3 seconds (or a frame tap), reset same problem for retry
      scheduleAdvance(() => {
        if (mode === 'addition') {
          setupAdditionCells(problem);
          setUserAnswer(problem.num1);
        } else if (mode === 'subtraction') {
          setupSubtractionCells(problem);
          setUserAnswer(problem.num1);
        }
        setHasSubmitted(false);
        setIsCorrect(null);
        setFeedback('');
      }, 3000);
    }
  }, [cells, doGenerateProblem, scheduleAdvance, setupAdditionCells, setupSubtractionCells]);

  // Answer mode: the pad IS the submit button. Correct advances like any
  // other mode; wrong marks the bubble and lets the child pick again — no
  // frozen wait, the retry is immediate.
  const handleNumberPick = useCallback(
    (n: number) => {
      const p = answerProblemRef.current;
      if (!p) return;
      if (hasSubmittedRef.current) {
        skipWait();
        return;
      }
      if (n === p.expected) {
        setWrongPick(null);
        setIsCorrect(true);
        setFeedback('correct');
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        setHasSubmitted(true);
        setShowConfetti(true);
        setMascotMood('excited');
        setLevelCorrectStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak >= 3) {
            setAnswerLevel(l => Math.min(l + 1, 7));
            return 0;
          }
          return newStreak;
        });
        scheduleAdvance(() => {
          setShowConfetti(false);
          doGenerateProblem();
        }, 5000);
      } else {
        setWrongPick(n);
        setIsCorrect(false);
        setFeedback('wrong');
        setStreak(0);
        setLevelCorrectStreak(0);
        setMascotMood('thinking');
      }
    },
    [doGenerateProblem, scheduleAdvance, skipWait],
  );

  // Compare mode: tap the side with more (or "same").
  const handleComparePick = useCallback(
    (side: 'left' | 'right' | 'equal') => {
      const p = compareProblemRef.current;
      if (!p) return;
      if (hasSubmittedRef.current) {
        skipWait();
        return;
      }
      if (side === p.correct) {
        setIsCorrect(true);
        setFeedback('correct');
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        setHasSubmitted(true);
        setShowConfetti(true);
        setMascotMood('excited');
        setLevelCorrectStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak >= 3) {
            setCompareLevel(l => Math.min(l + 1, 3));
            return 0;
          }
          return newStreak;
        });
        scheduleAdvance(() => {
          setShowConfetti(false);
          doGenerateProblem();
        }, 4000);
      } else {
        setIsCorrect(false);
        setFeedback('wrong');
        setStreak(0);
        setLevelCorrectStreak(0);
        setMascotMood('thinking');
      }
    },
    [doGenerateProblem, scheduleAdvance, skipWait],
  );

  const handlePuzzleSubmit = useCallback(() => {
    // Count color2 cells (what child added)
    const color2Cells = cells.filter(c => c === 'color2').length;
    const correctComplement = 10 - puzzleAnswer;

    // Total filled should be 10 (color1 + color2 = puzzleAnswer + complement = 10)
    if (color2Cells === correctComplement) {
      // CORRECT
      setShowPuzzleAnswer(true);
      setIsCorrect(true);
      setMascotMood('excited');
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setShowConfetti(true);

      scheduleAdvance(() => {
        setShowConfetti(false);
        setShowPuzzleAnswer(false);
        setIsCorrect(null);
        const newNum = generatePuzzleNumber();
        setPuzzleAnswer(newNum);
        setupPuzzleCells(newNum);
      }, 5000);
    } else {
      // WRONG
      setShowPuzzleAnswer(true);
      setIsCorrect(false);
      setMascotMood('thinking');
      setStreak(0);

      scheduleAdvance(() => {
        setShowPuzzleAnswer(false);
        setIsCorrect(null);
        // Reset to try again with same puzzle
        setupPuzzleCells(puzzleAnswer);
      }, 3000);
    }
  }, [cells, puzzleAnswer, scheduleAdvance, setupPuzzleCells]);

  const resetGame = useCallback(() => {
    const mode = gameModeRef.current;
    // A reset during the feedback pause must also drop the pending advance,
    // or the stale timeout fires later and generates a second problem.
    cancelPendingAdvance();
    setFeedback('');
    setIsCorrect(null);
    setHasSubmitted(false);

    if (
      mode === 'addition' ||
      mode === 'subtraction' ||
      mode === 'answer' ||
      mode === 'compare'
    ) {
      doGenerateProblem();
    } else if (mode === 'puzzle') {
      const newNum = generatePuzzleNumber();
      setPuzzleAnswer(newNum);
      setupPuzzleCells(newNum);
      setShowPuzzleAnswer(false);
    } else {
      setCells(Array(10).fill('empty'));
      setUserAnswer(null);
    }
  }, [cancelPendingAdvance, doGenerateProblem, setupPuzzleCells]);

  const newPuzzle = useCallback(() => {
    const newNum = generatePuzzleNumber();
    setPuzzleAnswer(newNum);
    setupPuzzleCells(newNum);
    setShowPuzzleAnswer(false);
    setIsCorrect(null);
  }, [setupPuzzleCells]);

  const newShareProblem = useCallback(() => {
    setShareProblem(generateShareProblem(Math.floor(Math.random() * 5) + 1));
    setIsCorrect(null);
    setHasSubmitted(false);
  }, []);

  return {
    // State
    gameMode,
    cells,
    score,
    streak,
    level,
    currentProblem,
    userAnswer,
    isCorrect,
    hasSubmitted,
    mascotMood,
    showConfetti,
    puzzleAnswer,
    showPuzzleAnswer,
    feedback,
    filledCount,
    color1Count,
    color2Count,
    theme,
    language,
    ageGroup,
    playerName,
    showSetup,
    isThemeChange,
    additionPhase,
    additionLevel,
    subtractionLevel,
    answerLevel,
    answerProblem,
    wrongPick,
    compareLevel,
    compareProblem,

    // Actions
    setGameMode,
    handleCellClick,
    handleSubmit,
    handleNumberPick,
    handleComparePick,
    handlePuzzleSubmit,
    resetGame,
    newPuzzle,
    newShareProblem,
    shareProblem,
    setTheme,
    setLanguage,
    setAgeGroup,
    setPlayerName,
    setShowSetup,
    setIsThemeChange,
  };
}
