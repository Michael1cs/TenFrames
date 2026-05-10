import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TenFrame} from './TenFrame';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {AgeGroup, CellState, MemoryChallenge, ThemeColors} from '../../types/game';

type Phase = 'show' | 'input' | 'reveal';

interface MemoryModeProps {
  challenge: MemoryChallenge;
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  ageGroup?: AgeGroup;
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
  ageGroup = 'young',
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

  // Auto-submit on count match (correct) or after overshoot grace (wrong).
  // Latch via ref to prevent double-fire if re-renders happen mid-timer.
  const correctFiredRef = useRef(false);
  useEffect(() => {
    correctFiredRef.current = false;
  }, [challenge]);

  useEffect(() => {
    if (phase !== 'input') return;
    if (correctFiredRef.current) return;

    if (filledCount === challenge.targetCount) {
      correctFiredRef.current = true;
      const timer = setTimeout(() => {
        setPhase('reveal');
        onPhaseChangeRef.current?.('reveal', challenge.targetCount);
        onCorrectRef.current();
      }, 350);
      return () => clearTimeout(timer);
    }
    if (filledCount > challenge.targetCount) {
      const timer = setTimeout(() => {
        if (correctFiredRef.current) return;
        correctFiredRef.current = true;
        setPhase('reveal');
        onPhaseChangeRef.current?.('reveal', challenge.targetCount);
        onWrongRef.current();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [filledCount, phase, challenge.targetCount]);

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
        ageGroup={ageGroup}
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
