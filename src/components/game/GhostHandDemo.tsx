import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Text} from '../common/AppText';
import {ThemeColors} from '../../types/game';
import {useReduceMotion} from '../../hooks/useReduceMotion';

export interface DemoPoint {
  x: number; // cell center, in the frame's inner coordinates
  y: number;
}

interface GhostHandDemoProps {
  targets: DemoPoint[];
  kind: 'add' | 'remove';
  cellSize: number;
  colors: ThemeColors;
  onDone: () => void;
}

// Beats of the demonstration, in ms.
const APPEAR = 250;
const TRAVEL = 550;
const PRESS = 120;
const RELEASE = 180;
const HOLD = 320;
const LEAVE = 320;

// A translucent hand that shows a child who can't read the instruction what
// to do with the frame: it glides to a cell, presses, and a ghost of the
// result appears there — a counter dropping in, or one fading out — then it
// lifts away. Nothing in the game changes; the overlay ignores touches, so
// the child's first real tap goes straight through (and ends the demo).
export function GhostHandDemo({
  targets,
  kind,
  cellSize,
  colors,
  onDone,
}: GhostHandDemoProps) {
  const reduceMotion = useReduceMotion();
  const handSize = Math.round(cellSize * 0.85);
  const first = targets[0];

  const x = useSharedValue(first.x);
  const y = useSharedValue(first.y + cellSize * 1.4);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const ghost0 = useSharedValue(0);
  const ghost1 = useSharedValue(0);
  const ripple = useSharedValue(0);
  const rippleAt = useSharedValue(0);
  const ghosts: SharedValue<number>[] = [ghost0, ghost1];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const travel = reduceMotion ? 0 : TRAVEL;
    const ease = {duration: travel, easing: Easing.inOut(Easing.cubic)};

    if (reduceMotion) {
      x.value = first.x;
      y.value = first.y;
    }
    opacity.value = withTiming(0.85, {duration: APPEAR});

    let t = APPEAR;
    targets.slice(0, ghosts.length).forEach((p, i) => {
      at(t, () => {
        x.value = withTiming(p.x, ease);
        y.value = withTiming(p.y, ease);
      });
      t += travel;
      at(t, () => {
        scale.value = withSequence(
          withTiming(0.82, {duration: PRESS}),
          withSpring(1, {damping: 10, stiffness: 220}),
        );
        rippleAt.value = i;
        ripple.value = 0;
        ripple.value = withTiming(1, {duration: 420});
        ghosts[i].value = withSpring(1, {damping: 12, stiffness: 180});
      });
      t += PRESS + RELEASE + HOLD;
    });

    at(t, () => {
      opacity.value = withTiming(0, {duration: LEAVE});
      if (!reduceMotion) {
        y.value = withTiming(y.value + cellSize * 0.8, {duration: LEAVE});
      }
    });
    at(t + LEAVE, () => {
      ghosts.forEach(g => (g.value = withTiming(0, {duration: 400})));
    });
    at(t + LEAVE + 420, onDone);

    return () => timers.forEach(clearTimeout);
    // The demo runs once per mount; its inputs are fixed for that mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      // Fingertip on the point: the glyph's tip sits near its top center.
      {translateX: x.value - handSize / 2},
      {translateY: y.value - handSize * 0.12},
      {scale: scale.value},
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => {
    const p = targets[Math.min(rippleAt.value, targets.length - 1)];
    const size = cellSize * (0.5 + ripple.value * 0.7);
    return {
      opacity: ripple.value === 0 ? 0 : (1 - ripple.value) * 0.7,
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{translateX: p.x - size / 2}, {translateY: p.y - size / 2}],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {targets.slice(0, ghosts.length).map((p, i) => (
        <Ghost
          key={i}
          point={p}
          progress={ghosts[i]}
          kind={kind}
          cellSize={cellSize}
          colors={colors}
        />
      ))}
      <Animated.View style={[styles.ripple, rippleStyle]} />
      <Animated.View style={[styles.hand, {width: handSize, height: handSize}, handStyle]}>
        <Text style={{fontSize: handSize * 0.8, lineHeight: handSize}}>👆</Text>
      </Animated.View>
    </View>
  );
}

function Ghost({
  point,
  progress,
  kind,
  cellSize,
  colors,
}: {
  point: DemoPoint;
  progress: SharedValue<number>;
  kind: 'add' | 'remove';
  cellSize: number;
  colors: ThemeColors;
}) {
  // Adding: a translucent counter drops into the empty cell. Removing: the
  // filled cell is veiled with the empty-cell color, as if the counter left.
  const size = kind === 'add' ? cellSize * 0.56 : cellSize;
  const style = useAnimatedStyle(() => ({
    opacity: progress.value * (kind === 'add' ? 0.6 : 0.78),
    transform: [
      {translateX: point.x - size / 2},
      {translateY: point.y - size / 2},
      {scale: kind === 'add' ? 0.4 + progress.value * 0.6 : 1},
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.ghost,
        {
          width: size,
          height: size,
          borderRadius: kind === 'add' ? size / 2 : 10,
          backgroundColor: kind === 'add' ? colors.marble || colors.cellFilled : colors.cellEmpty,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  hand: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ripple: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
