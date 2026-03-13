import {useState, useCallback, useEffect, useRef} from 'react';
import {
  GameMode,
  CellState,
  Problem,
  MascotMood,
  Theme,
  Language,
} from '../types/game';
import {generateProblem, generatePuzzleNumber} from '../utils/mathProblems';
import {shouldLevelUp} from '../utils/scoring';

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
  const [showPuzzleAnswer, setShowPuzzleAnswer] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('space');
  const [language, setLanguage] = useState<Language>('ro');
  const [playerName, setPlayerName] = useState('');
  const [showSetup, setShowSetup] = useState(true);
  const [isThemeChange, setIsThemeChange] = useState(false);
  // Track addition phase: 'first' = placing num1, 'second' = placing num2
  const [additionPhase, setAdditionPhase] = useState<'first' | 'second'>('first');

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

  const doGenerateProblem = useCallback(() => {
    const mode = gameModeRef.current;
    const problem = generateProblem(mode);
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
    if (gameMode === 'addition' || gameMode === 'subtraction') {
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
      } else if (mode === 'addition' && !hasSubmittedRef.current) {
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
      } else if (mode === 'subtraction' && !hasSubmittedRef.current) {
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
    [],
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

      setTimeout(() => {
        setShowConfetti(false);
        doGenerateProblem();
      }, 3000);
    } else {
      // WRONG
      setIsCorrect(false);
      setFeedback('wrong');
      setStreak(0);
      setHasSubmitted(true);
      setMascotMood('thinking');

      // After 3 seconds, reset same problem for retry
      setTimeout(() => {
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
  }, [cells, doGenerateProblem, setupAdditionCells, setupSubtractionCells]);

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

      setTimeout(() => {
        setShowConfetti(false);
        setShowPuzzleAnswer(false);
        setIsCorrect(null);
        const newNum = generatePuzzleNumber();
        setPuzzleAnswer(newNum);
        setupPuzzleCells(newNum);
      }, 3000);
    } else {
      // WRONG
      setShowPuzzleAnswer(true);
      setIsCorrect(false);
      setMascotMood('thinking');
      setStreak(0);

      setTimeout(() => {
        setShowPuzzleAnswer(false);
        setIsCorrect(null);
        // Reset to try again with same puzzle
        setupPuzzleCells(puzzleAnswer);
      }, 3000);
    }
  }, [cells, puzzleAnswer, setupPuzzleCells]);

  const resetGame = useCallback(() => {
    const mode = gameModeRef.current;
    setFeedback('');
    setIsCorrect(null);
    setHasSubmitted(false);

    if (mode === 'addition' || mode === 'subtraction') {
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
  }, [doGenerateProblem, setupPuzzleCells]);

  const newPuzzle = useCallback(() => {
    const newNum = generatePuzzleNumber();
    setPuzzleAnswer(newNum);
    setupPuzzleCells(newNum);
    setShowPuzzleAnswer(false);
    setIsCorrect(null);
  }, [setupPuzzleCells]);

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
    playerName,
    showSetup,
    isThemeChange,
    additionPhase,

    // Actions
    setGameMode,
    handleCellClick,
    handleSubmit,
    handlePuzzleSubmit,
    resetGame,
    newPuzzle,
    setTheme,
    setLanguage,
    setPlayerName,
    setShowSetup,
    setIsThemeChange,
  };
}
