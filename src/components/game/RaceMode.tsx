import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Pressable, ImageSourcePropType, LayoutChangeEvent} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Text} from '../common/AppText';
import {TenFrame} from './TenFrame';
import {NumberPad} from './NumberPad';
import {Mascot} from '../common/Mascot';
import {Bouncy} from '../common/Bouncy';
import {Emoji} from '../common/Emoji';
import {ModeIcon} from '../layout/ModeIcon';
import {generateReadProblem, READ_LEVEL_CAP} from '../../utils/mathProblems';
import {AnswerProblem, CellState, ThemeColors} from '../../types/game';

export const RACE_MS = 35000; // Mihai: a minute is long for four-year-olds

// The band climbs with the score inside one run, so a strong child meets
// bigger numbers before the minute is out.
export function raceBand(score: number): number {
  return Math.min(READ_LEVEL_CAP, 1 + Math.floor(score / 4));
}

function makeProblem(score: number): AnswerProblem {
  const op = Math.random() < 0.5 ? 'add' : 'sub';
  return generateReadProblem(op, raceBand(score));
}

function cellsFor(p: AnswerProblem): CellState[] {
  const cells: CellState[] = Array(10).fill('empty');
  for (let i = 0; i < p.num1; i++) cells[i] = 'color1';
  if (p.op === 'add') {
    for (let i = p.num1; i < p.num1 + p.num2 && i < 10; i++) cells[i] = 'color2';
  }
  return cells;
}

interface RaceModeProps {
  colors: ThemeColors;
  emoji: string;
  tokenImage?: ImageSourcePropType;
  best: number;
  // Asked before a run starts; false keeps the child on the start screen
  // (the daily wall is the caller's to show).
  onStart: () => boolean;
  onFinish: (score: number, isNewBest: boolean) => void;
  playSound: (name: 'correct' | 'wrong' | 'levelup' | 'star') => void;
}

// One minute, as many locked frames as the child can read and name. No
// clock digits: the mascot flies along a track and the run ends when it
// reaches the star. Wrong answers cost nothing but the moment; the score is
// correct answers, and the opponent is the child's own best.
export function RaceMode({
  colors,
  emoji,
  tokenImage,
  best,
  onStart,
  onFinish,
  playSound,
}: RaceModeProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [problem, setProblem] = useState<AnswerProblem | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const scoreRef = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  useEffect(
    () => () => {
      if (endTimer.current) clearTimeout(endTimer.current);
      if (nextTimer.current) clearTimeout(nextTimer.current);
    },
    [],
  );

  const finish = useCallback(() => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    const final = scoreRef.current;
    const newBest = final > best;
    setIsNewBest(newBest);
    setPhase('done');
    playSound(newBest && final > 0 ? 'levelup' : 'star');
    onFinish(final, newBest);
  }, [best, onFinish, playSound]);

  const start = useCallback(() => {
    if (!onStart()) return;
    scoreRef.current = 0;
    setScore(0);
    setMisses(0);
    setWrongPick(null);
    setHighlight(null);
    setProblem(makeProblem(0));
    setPhase('running');
    progress.value = 0;
    progress.value = withTiming(1, {duration: RACE_MS, easing: Easing.linear});
    endTimer.current = setTimeout(finish, RACE_MS);
  }, [onStart, finish, progress]);

  const pick = useCallback(
    (n: number) => {
      if (phase !== 'running' || !problem || highlight !== null) return;
      if (n === problem.expected) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setHighlight(n);
        setWrongPick(null);
        playSound('correct');
        nextTimer.current = setTimeout(() => {
          setHighlight(null);
          setProblem(makeProblem(scoreRef.current));
        }, 380);
      } else {
        setWrongPick(n);
        setMisses(m => m + 1);
        playSound('wrong');
      }
    },
    [phase, problem, highlight, playSound],
  );

  const runner = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * Math.max(0, trackWidth - 60)}],
  }));

  const equation = problem
    ? [
        {text: String(problem.num1), color: colors.cellColor1},
        {text: problem.op === 'sub' ? ' − ' : ' + ', color: '#FFFFFF'},
        {text: String(problem.num2), color: problem.op === 'sub' ? '#FFFFFF' : colors.cellColor2},
        {text: ' = ', color: '#FFFFFF'},
        {text: '?', color: '#FBBF24'},
      ]
    : [];
  const fadedCells =
    problem?.op === 'sub'
      ? Array.from({length: problem.num2}, (_, i) => problem.num1 - 1 - i)
      : undefined;

  if (phase === 'ready' || phase === 'done') {
    const shown = phase === 'done' ? score : best;
    return (
      <View style={styles.container}>
        <Mascot pose={phase === 'done' && isNewBest ? 'jump' : 'hello'} height={110} />
        {/* The tally: thumbs up for the ones it got, thumbs down for the
            misses (Mihai's pick over a row of dots). Before a run, the
            record alone. */}
        <View style={styles.tally}>
          <View style={[styles.tallyBadge, styles.tallyGot]}>
            <Text style={styles.tallyText}>
              <Emoji>👍</Emoji> {shown}
            </Text>
          </View>
          {phase === 'done' && (
            <View style={[styles.tallyBadge, styles.tallyMissed]}>
              <Text style={styles.tallyText}>
                <Emoji>👎</Emoji> {misses}
              </Text>
            </View>
          )}
        </View>
        {phase === 'done' && best > 0 && !isNewBest && (
          <View style={styles.bestRow}>
            <View style={styles.bestBadge}>
              <Text style={styles.bestText}>{best}</Text>
            </View>
          </View>
        )}
        <Bouncy onPress={start} style={[styles.playButton, {backgroundColor: colors.primaryButton}]}>
          <View style={styles.playTriangle} />
        </Bouncy>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.trackWrap} onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}>
        <View style={styles.track} />
        {/* The finish is the same stopwatch as the tile: the mascot flies
            towards the clock, and the run is over when it gets there. */}
        <View style={styles.goal}>
          <ModeIcon mode="race" size={38} colors={colors} />
        </View>
        <Animated.View style={[styles.runner, runner]}>
          <Mascot pose="point" height={40} />
        </Animated.View>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>
      <View style={styles.problemContainer}>
        <Text style={styles.problem}>
          {equation.map((part, i) => (
            <Text key={i} style={{color: part.color}}>
              {part.text}
            </Text>
          ))}
        </Text>
      </View>
      <TenFrame
        cells={problem ? cellsFor(problem) : Array(10).fill('empty')}
        onCellClick={() => {}}
        colors={colors}
        emoji={emoji}
        tokenImage={tokenImage}
        fadedCells={fadedCells}
        disabled
      />
      <NumberPad onPick={pick} colors={colors} highlight={highlight} wrongPick={wrongPick} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center', gap: 10},
  trackWrap: {
    width: '90%',
    height: 44,
    justifyContent: 'center',
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  goal: {
    position: 'absolute',
    right: -4,
  },
  runner: {position: 'absolute', left: 0, top: 0},
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  scoreBadge: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {color: '#FBBF24', fontSize: 22, fontWeight: '800'},
  problemContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  problem: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  tally: {flexDirection: 'row', gap: 14, marginTop: 6},
  tallyBadge: {
    minWidth: 88,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tallyGot: {backgroundColor: '#16A34A', borderColor: '#BBF7D0'},
  tallyMissed: {backgroundColor: '#DC2626', borderColor: '#FECACA'},
  tallyText: {color: '#FFFFFF', fontSize: 26, fontWeight: '800'},
  bestRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  bestBadge: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 8,
    borderTopWidth: 22,
    borderBottomWidth: 22,
    borderLeftWidth: 36,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
});
