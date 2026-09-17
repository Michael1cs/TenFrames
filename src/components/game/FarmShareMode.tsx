import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Image, StyleSheet, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  FadeOut,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Emoji} from '../common/Emoji';
import {ShareProblem} from '../../utils/mathProblems';
import {ThemeColors} from '../../types/game';
import {DropRect, dropTargetAt} from '../../utils/dropTarget';
import {
  ShareState,
  give,
  isFair,
  remaining as poolRemaining,
  startShare,
  takeBack,
} from '../../utils/shareState';

interface FarmShareModeProps {
  problem: ShareProblem | null;
  // Per-problem cosmetics — chosen by the parent so the world theme drives
  // which food + animal combos appear.
  foodEmoji: string;
  animalEmoji: string;
  colors: ThemeColors;
  // The theme's counter image. When present it IS the food: a real picture
  // never clips the way an emoji in a fixed box does, and it is the same
  // piece the child places in the frame everywhere else.
  tokenImage?: ImageSourcePropType;
  // Training-wheel hint: when true and the pool empties unfairly, the
  // baskets holding too much turn red so the child sees what to fix.
  showOverflowHint?: boolean;
  // Fires once the pool empties and every basket has the same count.
  onMatch?: () => void;
  // Fires when the pool empties but the split is unfair.
  onUnfair?: () => void;
  // True while a piece is being carried, so the screen around it can stop
  // scrolling — otherwise the scroll view fights the drag.
  onDragStateChange?: (dragging: boolean) => void;
}

// Sharing is a physical idea — you hand food out one piece at a time — so
// the child drags each piece from the pool to an animal. Tapping an animal's
// tray also gives it one, because a small hand's drag can miss and the child
// must never be stuck; with the pool empty, a tap takes one back.

const TRAY = '#FFF4DC';
const TRAY_EDGE = '#E9D9B4';

// The pool is a fixed grid, five across like a ten frame's top row. Every
// piece keeps its place, so giving one away leaves a gap instead of
// re-flowing the food under the child's finger.
const POOL_COLUMNS = 5;
const POOL_CELL = 46;
const POOL_PIECE = 38;

function Food({source, emoji, size}: {source?: ImageSourcePropType; emoji: string; size: number}) {
  if (source) {
    return <Image source={source} style={{width: size, height: size}} resizeMode="contain" />;
  }
  // Emoji fallback: the line box is taller than the glyph, so give it room
  // or the top and bottom are cut off.
  return (
    <Text style={{fontSize: size * 0.82, lineHeight: size * 1.15, textAlign: 'center'}}>
      <Emoji>{emoji}</Emoji>
    </Text>
  );
}

// One piece of food in the pool. Drag it to an animal; it springs home if
// dropped anywhere else, and disappears (into the tray) when it is taken.
function PoolPiece({
  id,
  source,
  emoji,
  onDropAt,
  onDragStateChange,
}: {
  id: number;
  source?: ImageSourcePropType;
  emoji: string;
  onDropAt: (x: number, y: number, id: number) => boolean;
  onDragStateChange?: (dragging: boolean) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lifted = useSharedValue(0);

  const settle = useCallback(() => {
    tx.value = withSpring(0, {damping: 14, stiffness: 220});
    ty.value = withSpring(0, {damping: 14, stiffness: 220});
  }, [tx, ty]);

  const finishDrag = useCallback(
    (x: number, y: number) => {
      onDragStateChange?.(false);
      if (!onDropAt(x, y, id)) settle();
    },
    [onDropAt, settle, id, onDragStateChange],
  );
  const startDrag = useCallback(() => onDragStateChange?.(true), [onDragStateChange]);

  const pan = Gesture.Pan()
    .minDistance(3)
    .onStart(() => {
      lifted.value = withTiming(1, {duration: 120});
      runOnJS(startDrag)();
    })
    .onUpdate(e => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd(e => {
      runOnJS(finishDrag)(e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      lifted.value = withTiming(0, {duration: 140});
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateX: tx.value},
      {translateY: ty.value},
      {scale: 1 + lifted.value * 0.2},
    ],
    zIndex: lifted.value > 0 ? 10 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style} exiting={FadeOut.duration(160)}>
        <Food source={source} emoji={emoji} size={POOL_PIECE} />
      </Animated.View>
    </GestureDetector>
  );
}

function Basket({
  animalEmoji,
  source,
  foodEmoji,
  pieces,
  target,
  poolEmpty,
  showOverflowHint,
  columns,
  pieceSize,
  onTap,
  onMeasure,
}: {
  animalEmoji: string;
  source?: ImageSourcePropType;
  foodEmoji: string;
  pieces: number[];
  target: number;
  poolEmpty: boolean;
  showOverflowHint: boolean;
  columns: number;
  pieceSize: number;
  onTap: () => void;
  onMeasure: (r: DropRect) => void;
}) {
  const ref = useRef<View>(null);
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = 0;
    pop.value = withSpring(1, {damping: 7, stiffness: 240});
  }, [pieces.length, pop]);
  const style = useAnimatedStyle(() => ({
    transform: [{scale: 1 + pop.value * 0.04}],
  }));

  // Once the pool is empty: right (green), too much (red — only with the
  // training hint on), otherwise amber for "still hungry", never "wrong".
  let edge = TRAY_EDGE;
  if (poolEmpty) {
    if (pieces.length === target) edge = '#22C55E';
    else if (showOverflowHint && pieces.length > target) edge = '#EF4444';
    else edge = '#F59E0B';
  }

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(onTap)();
  });

  const gap = 4;
  const pad = 8;
  const width = columns * pieceSize + (columns - 1) * gap + pad * 2;
  const rows = Math.max(1, Math.ceil(pieces.length / columns));
  const height = rows * pieceSize + (rows - 1) * gap + pad * 2;

  return (
    <View style={styles.basketWrap}>
      <Text style={styles.animal}>
        <Emoji>{animalEmoji}</Emoji>
      </Text>
      <GestureDetector gesture={tap}>
        <Animated.View
          ref={ref}
          onLayout={() =>
            ref.current?.measureInWindow((x, y, w, h) => onMeasure({x, y, w, h}))
          }
          style={[
            styles.tray,
            {width, height, gap, padding: pad, borderColor: edge},
            style,
          ]}>
          {pieces.map(id => (
            <Animated.View key={id} entering={ZoomIn.duration(220)} exiting={FadeOut.duration(140)}>
              <Food source={source} emoji={foodEmoji} size={pieceSize} />
            </Animated.View>
          ))}
        </Animated.View>
      </GestureDetector>
      <Text style={styles.count}>{pieces.length}</Text>
    </View>
  );
}

export function FarmShareMode({
  problem,
  foodEmoji,
  animalEmoji,
  tokenImage,
  showOverflowHint = false,
  onMatch,
  onUnfair,
  onDragStateChange,
}: FarmShareModeProps) {
  const [state, setState] = useState<ShareState | null>(null);
  const matchedRef = useRef(false);
  const rectsRef = useRef<DropRect[]>([]);
  const onMatchRef = useRef(onMatch);
  const onUnfairRef = useRef(onUnfair);
  onMatchRef.current = onMatch;
  onUnfairRef.current = onUnfair;

  useEffect(() => {
    if (!problem) return;
    setState(startShare(problem.total, problem.buckets));
    rectsRef.current = [];
    matchedRef.current = false;
  }, [problem]);

  const remaining = state ? poolRemaining(state) : 0;
  useEffect(() => {
    if (!problem || !state) return;
    if (remaining > 0) {
      // The child rearranged: a fresh fair split may trigger again.
      matchedRef.current = false;
      return;
    }
    if (matchedRef.current) return;
    if (isFair(state, problem.target)) {
      matchedRef.current = true;
      const t = setTimeout(() => onMatchRef.current?.(), 900);
      return () => clearTimeout(t);
    }
    onUnfairRef.current?.();
  }, [remaining, state, problem]);

  const giveTo = useCallback((basket: number, id?: number) => {
    setState(prev => (prev ? give(prev, basket, id) : prev));
  }, []);

  // A drop lands with the animal whose tray is under the finger, with a
  // forgiving margin: a four-year-old lets go near the basket, not on it.
  const dropAt = useCallback(
    (x: number, y: number, id: number) => {
      const hit = dropTargetAt(rectsRef.current, x, y);
      if (hit < 0) return false;
      giveTo(hit, id);
      return true;
    },
    [giveTo],
  );

  if (!problem || !state) return null;

  const baskets = state.baskets.length;
  const columns = baskets >= 4 ? 3 : baskets === 3 ? 4 : 5;
  const pieceSize = baskets >= 4 ? 22 : baskets === 3 ? 26 : 30;
  const poolRows = Math.max(1, Math.ceil(problem.total / POOL_COLUMNS));

  return (
    <View style={styles.container}>
      {/* The pool, above the baskets so a piece being carried never slides
          behind a tray. */}
      <View
        style={[
          styles.pool,
          {width: POOL_COLUMNS * POOL_CELL, height: poolRows * POOL_CELL},
        ]}>
        {state.pool.map(id => (
          <View
            key={id}
            style={[
              styles.poolCell,
              {
                left: (id % POOL_COLUMNS) * POOL_CELL,
                top: Math.floor(id / POOL_COLUMNS) * POOL_CELL,
              },
            ]}>
            <PoolPiece
              id={id}
              source={tokenImage}
              emoji={foodEmoji}
              onDropAt={dropAt}
              onDragStateChange={onDragStateChange}
            />
          </View>
        ))}
      </View>

      <View style={styles.basketsRow}>
        {state.baskets.map((pieces, i) => (
          <Basket
            key={i}
            animalEmoji={animalEmoji}
            source={tokenImage}
            foodEmoji={foodEmoji}
            pieces={pieces}
            target={problem.target}
            poolEmpty={remaining === 0}
            showOverflowHint={showOverflowHint}
            columns={columns}
            pieceSize={pieceSize}
            onTap={() =>
              remaining === 0 && pieces.length > 0
                ? setState(prev => (prev ? takeBack(prev, i) : prev))
                : giveTo(i)
            }
            onMeasure={r => {
              rectsRef.current[i] = r;
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  pool: {
    zIndex: 5,
    elevation: 5,
  },
  poolCell: {
    position: 'absolute',
    width: POOL_CELL,
    height: POOL_CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  basketWrap: {
    alignItems: 'center',
    gap: 2,
  },
  animal: {
    fontSize: 38,
    lineHeight: 46,
  },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    backgroundColor: TRAY,
    borderRadius: 16,
    borderWidth: 3,
  },
  count: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
