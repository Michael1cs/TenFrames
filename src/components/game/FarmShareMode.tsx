import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ImageSourcePropType} from 'react-native';
import {Text} from '../common/AppText';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
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

interface FarmShareModeProps {
  problem: ShareProblem | null;
  // Per-problem cosmetics — chosen by the parent so the world theme drives
  // which food + animal combos appear.
  foodEmoji: string;
  animalEmoji: string;
  colors: ThemeColors;
  tokenImage?: ImageSourcePropType;
  // Training-wheel hint: when true and the pool empties unfairly, the
  // baskets holding too much turn red so the child sees what to fix.
  showOverflowHint?: boolean;
  // Fires once the pool empties and every basket has the same count.
  onMatch?: () => void;
  // Fires when the pool empties but the split is unfair.
  onUnfair?: () => void;
}

// Sharing is a physical idea — you hand food out, one piece at a time — so
// the child drags it: pick a carrot out of the tray and drop it in front of
// an animal. Tapping a tray still adds one, because a four-year-old's drag
// can miss and they must never be stuck.
//
// What is deliberately gone: tapping the food used to deal it to whichever
// basket had least, which is the app doing the sharing for the child.

const TRAY = '#FFF4DC';
const TRAY_EDGE = '#E9D9B4';
const SLOT = 'rgba(34,48,90,0.22)';

function Slot({size, children}: {size: number; children?: React.ReactNode}) {
  return (
    <View
      style={[
        styles.slot,
        {width: size, height: size, borderRadius: Math.round(size / 4)},
      ]}>
      {children}
    </View>
  );
}

// One piece of food waiting in the pool. Draggable; springs home if it is
// dropped somewhere that is not an animal.
function PoolItem({
  foodEmoji,
  size,
  onDropAt,
}: {
  foodEmoji: string;
  size: number;
  onDropAt: (x: number, y: number) => boolean;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lifted = useSharedValue(0);

  const settle = useCallback(() => {
    tx.value = withSpring(0, {damping: 14, stiffness: 220});
    ty.value = withSpring(0, {damping: 14, stiffness: 220});
    lifted.value = withTiming(0, {duration: 140});
  }, [tx, ty, lifted]);

  const handleDrop = useCallback(
    (x: number, y: number) => {
      // Taken by a basket: the item disappears with the state change, so
      // there is nothing to animate back.
      if (!onDropAt(x, y)) settle();
    },
    [onDropAt, settle],
  );

  const pan = Gesture.Pan()
    .minDistance(3)
    .onBegin(() => {
      lifted.value = withTiming(1, {duration: 120});
    })
    .onUpdate(e => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd(e => {
      runOnJS(handleDrop)(e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      lifted.value = withTiming(0, {duration: 140});
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateX: tx.value},
      {translateY: ty.value},
      {scale: 1 + lifted.value * 0.18},
    ],
    zIndex: lifted.value > 0 ? 10 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>
        <Text style={{fontSize: size}}>
          <Emoji>{foodEmoji}</Emoji>
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function Basket({
  animalEmoji,
  foodEmoji,
  count,
  target,
  poolEmpty,
  showOverflowHint,
  slotSize,
  slots,
  onAdd,
  onTakeBack,
  onMeasure,
}: {
  animalEmoji: string;
  foodEmoji: string;
  count: number;
  target: number;
  poolEmpty: boolean;
  showOverflowHint: boolean;
  slotSize: number;
  slots: number;
  onAdd: () => void;
  onTakeBack: () => void;
  onMeasure: (r: DropRect) => void;
}) {
  const ref = useRef<View>(null);
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = 0;
    pop.value = withSpring(1, {damping: 7, stiffness: 240});
  }, [count, pop]);
  const style = useAnimatedStyle(() => ({
    transform: [{scale: 1 + pop.value * 0.04}],
  }));

  // Three states once the pool is empty: right (green), too much (red, only
  // while the training hint is on), otherwise amber — "still hungry", not
  // "wrong".
  let edge = TRAY_EDGE;
  if (poolEmpty) {
    if (count === target) edge = '#22C55E';
    else if (showOverflowHint && count > target) edge = '#EF4444';
    else edge = '#F59E0B';
  }

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (!success) return;
    runOnJS(count > 0 && poolEmpty ? onTakeBack : onAdd)();
  });

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
          style={[styles.tray, {borderColor: edge}, style]}>
          {Array.from({length: slots}).map((_, i) => (
            <Slot key={i} size={slotSize}>
              {i < count ? (
                <Text style={{fontSize: slotSize * 0.72}}>
                  <Emoji>{foodEmoji}</Emoji>
                </Text>
              ) : null}
            </Slot>
          ))}
        </Animated.View>
      </GestureDetector>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

export function FarmShareMode({
  problem,
  foodEmoji,
  animalEmoji,
  colors,
  showOverflowHint = false,
  onMatch,
  onUnfair,
}: FarmShareModeProps) {
  const [baskets, setBaskets] = useState<number[]>([]);
  const matchedRef = useRef(false);
  const rectsRef = useRef<DropRect[]>([]);
  const onMatchRef = useRef(onMatch);
  const onUnfairRef = useRef(onUnfair);
  onMatchRef.current = onMatch;
  onUnfairRef.current = onUnfair;

  useEffect(() => {
    if (!problem) return;
    setBaskets(Array(problem.buckets).fill(0));
    rectsRef.current = [];
    matchedRef.current = false;
  }, [problem]);

  const distributed = baskets.reduce((a, b) => a + b, 0);
  const remaining = problem ? Math.max(0, problem.total - distributed) : 0;

  useEffect(() => {
    if (!problem) return;
    // The child rearranged: let a fresh equal split re-trigger the check.
    if (remaining > 0) {
      matchedRef.current = false;
      return;
    }
    if (matchedRef.current) return;
    if (distributed !== problem.total) return;
    if (baskets.every(c => c === problem.target)) {
      matchedRef.current = true;
      const t = setTimeout(() => onMatchRef.current?.(), 900);
      return () => clearTimeout(t);
    }
    onUnfairRef.current?.();
  }, [remaining, distributed, baskets, problem]);

  const addTo = useCallback((i: number) => {
    setBaskets(prev => {
      const total = prev.reduce((a, b) => a + b, 0);
      if (!problem || total >= problem.total) return prev;
      return prev.map((c, j) => (j === i ? c + 1 : c));
    });
  }, [problem]);

  const takeBackFrom = useCallback((i: number) => {
    setBaskets(prev => prev.map((c, j) => (j === i && c > 0 ? c - 1 : c)));
  }, []);

  // A drop counts for the animal whose tray is under the finger, with a
  // forgiving margin — a four-year-old aims roughly.
  const dropAt = useCallback(
    (x: number, y: number) => {
      const hit = dropTargetAt(rectsRef.current, x, y);
      if (hit < 0) return false;
      addTo(hit);
      return true;
    },
    [addTo],
  );

  if (!problem) return null;

  const slots = Math.max(problem.target + 1, 3);
  const slotSize = baskets.length >= 4 ? 24 : baskets.length === 3 ? 30 : 34;
  const poolSize = 34;

  return (
    <View style={styles.container}>
      {/* The pool: what is still to be shared. Drag a piece to an animal. */}
      <View style={styles.pool}>
        {Array.from({length: remaining}).map((_, i) => (
          <PoolItem
            key={`${problem.total}-${i}`}
            foodEmoji={foodEmoji}
            size={poolSize}
            onDropAt={dropAt}
          />
        ))}
        {remaining === 0 && (
          <Text style={styles.poolEmptyText}>
            <Emoji>{foodEmoji}</Emoji>
          </Text>
        )}
      </View>

      <View style={styles.basketsRow}>
        {baskets.map((count, i) => (
          <Basket
            key={i}
            animalEmoji={animalEmoji}
            foodEmoji={foodEmoji}
            count={count}
            target={problem.target}
            poolEmpty={remaining <= 0}
            showOverflowHint={showOverflowHint}
            slotSize={slotSize}
            slots={slots}
            onAdd={() => addTo(i)}
            onTakeBack={() => takeBackFrom(i)}
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
    gap: 14,
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  poolEmptyText: {
    fontSize: 26,
    opacity: 0.25,
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
  },
  tray: {
    flexDirection: 'row',
    gap: 5,
    padding: 7,
    backgroundColor: TRAY,
    borderRadius: 16,
    borderWidth: 3,
  },
  slot: {
    backgroundColor: SLOT,
    alignItems: 'center',
    justifyContent: 'center',
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
