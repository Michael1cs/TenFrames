import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {CellState, MemoryChallenge, ThemeColors} from '../../types/game';

type Phase = 'show' | 'input' | 'reveal';

interface MemoryModeProps {
  challenge: MemoryChallenge;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageProfile?: AgeProfile;
  // Called once child reaches the target count.
  onCorrect: () => void;
  // Called when grace period elapses with mismatch (overshoot).
  onWrong: () => void;
  // Called at the start of each phase so the parent can play voice.
  onPhaseChange?: (phase: Phase, targetCount: number) => void;
}

export function MemoryMode({
  challenge,
  colors,
  emoji,
  tokenImage,
  onCorrect,
  onWrong,
  onPhaseChange,
}: MemoryModeProps) {
  const {t} = useTranslation();
  const [phase, setPhase] = useState<Phase>('show');
  const [userCells, setUserCells] = useState<CellState[]>(() =>
    Array(10).fill('empty'),
  );

  // Hold callbacks in refs so parent re-renders don't reset our timers
  // (otherwise the 350ms auto-submit gets cancelled before it fires).
  const onCorrectRef = useRef(onCorrect);
  const onWrongRef = useRef(onWrong);
  const onPhaseChangeRef = useRef(onPhaseChange);
  onCorrectRef.current = onCorrect;
  onWrongRef.current = onWrong;
  onPhaseChangeRef.current = onPhaseChange;

  // Reset when a new challenge is given.
  useEffect(() => {
    setPhase('show');
    setUserCells(Array(10).fill('empty'));
    onPhaseChangeRef.current?.('show', challenge.targetCount);
    const showTimer = setTimeout(() => {
      setPhase('input');
      onPhaseChangeRef.current?.('input', challenge.targetCount);
    }, challenge.showDurationMs);
    return () => clearTimeout(showTimer);
  }, [challenge]);

  const filledCount = userCells.filter(c => c !== 'empty').length;

  // Pattern match: every cell must align with the target pattern.
  // For memory training, identical positions — not just count — matter.
  const patternMatches = userCells.every((cell, i) => {
    const targetFilled = challenge.targetCells[i] !== 'empty';
    const userFilled = cell !== 'empty';
    return targetFilled === userFilled;
  });

  // Auto-submit on pattern match (correct) or after grace if mismatched.
  // Latch via ref to prevent double-fire if re-renders happen mid-timer.
  const correctFiredRef = useRef(false);
  // Latch: did the child overshoot at least once during this challenge?
  // Used to record an attempt even if they self-correct before grace expires.
  const hadWrongRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A child who simply isn't tapping gets the pattern shown again ONCE.
  // Without this latch the show/input cues repeated every ~10s forever, which
  // is the "talks too much" complaint at its worst: a child who looked away
  // came back to an app that had been calling after them the whole time.
  const idleReshownRef = useRef(false);
  useEffect(() => {
    correctFiredRef.current = false;
    hadWrongRef.current = false;
    idleReshownRef.current = false;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [challenge]);

  // Nothing may keep talking once the level is closed mid-show.
  useEffect(
    () => () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    [],
  );

  // Inactivity guard: if the child stares at the input phase without
  // touching anything for ~8s, re-show the pattern automatically. Otherwise
  // a child who forgot the sequence has no way out — the level would just
  // sit there waiting. Resets every time filledCount changes so it only
  // fires when there's no progress.
  useEffect(() => {
    if (phase !== 'input') return;
    if (correctFiredRef.current) return;
    if (filledCount === challenge.targetCount && patternMatches) return;

    if (idleReshownRef.current) return;

    const timer = setTimeout(() => {
      if (correctFiredRef.current) return;
      // Showing the pattern again is help, not a verdict. This used to call
      // onWrong, so a child who was only thinking lost the first-try stars
      // and heard "Almost!" without having touched a single cell.
      idleReshownRef.current = true;
      setUserCells(Array(10).fill('empty'));
      setPhase('show');
      onPhaseChangeRef.current?.('show', challenge.targetCount);
      const retryShow = setTimeout(() => {
        setPhase('input');
        onPhaseChangeRef.current?.('input', challenge.targetCount);
      }, challenge.showDurationMs);
      retryTimerRef.current = retryShow;
    }, 8000);
    return () => clearTimeout(timer);
  }, [phase, filledCount, challenge, patternMatches]);

  useEffect(() => {
    if (phase !== 'input') return;
    if (correctFiredRef.current) return;

    // Correct: child reached the EXACT target count AND every cell matches
    // the pattern shown. Hold for 1.5s so child can verify before lock-in.
    if (filledCount === challenge.targetCount && patternMatches) {
      const timer = setTimeout(() => {
        if (correctFiredRef.current) return;
        correctFiredRef.current = true;
        setPhase('reveal');
        onPhaseChangeRef.current?.('reveal', challenge.targetCount);
        // Brief pause so the praise clip finishes before advancing.
        advanceTimerRef.current = setTimeout(() => onCorrectRef.current(), 1200);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Wrong: count matches the target but pattern is off (wrong cells),
    // OR child placed too many cells.
    const countMatchButWrongPattern =
      filledCount === challenge.targetCount && !patternMatches;
    const tooMany = filledCount > challenge.targetCount;
    if (countMatchButWrongPattern || tooMany) {
      if (!hadWrongRef.current) {
        hadWrongRef.current = true;
        onWrongRef.current();
      }
      // Re-show pattern after 1.8s so child can retry with fresh memory.
      const timer = setTimeout(() => {
        setUserCells(Array(10).fill('empty'));
        setPhase('show');
        onPhaseChangeRef.current?.('show', challenge.targetCount);
        const retryShow = setTimeout(() => {
          setPhase('input');
          onPhaseChangeRef.current?.('input', challenge.targetCount);
        }, challenge.showDurationMs);
        retryTimerRef.current = retryShow;
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [filledCount, phase, challenge.targetCount, patternMatches]);

  const handleCellClick = (index: number) => {
    if (phase !== 'input') return;
    setUserCells(prev => {
      const next = [...prev];
      next[index] = next[index] === 'empty' ? 'filled' : 'empty';
      return next;
    });
  };

  // Cells shown depends on phase
  const visibleCells =
    phase === 'show'
      ? challenge.targetCells
      : phase === 'reveal'
      ? challenge.targetCells // show the original to compare
      : userCells;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, {backgroundColor: colors.accent}]}>
        <Text style={styles.bannerText}>
          {phase === 'show'
            ? `👀 ${t('memory.watch')}`
            : phase === 'input'
            ? `🤔 ${t('memory.yourTurn')}`
            : `🎉 ${t('memory.target', {count: challenge.targetCount})}`}
        </Text>
      </View>

      <TenFrame
        cells={visibleCells}
        onCellClick={handleCellClick}
        disabled={phase !== 'input'}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
      />

      {/* Counter container — reserved height so layout doesn't shift between
          phases. Empty placeholder in show/reveal keeps the ten frame anchored. */}
      <View style={styles.counterSlot}>
        {phase === 'input' && (
          <View style={[styles.counter, {backgroundColor: 'rgba(0,0,0,0.4)'}]}>
            <Text style={[styles.counterText, {color: colors.numberText}]}>
              {filledCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  counterSlot: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  counterText: {
    fontSize: 44,
    fontWeight: '900',
  },
});
