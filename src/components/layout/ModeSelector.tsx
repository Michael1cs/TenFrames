import {Bouncy} from '../common/Bouncy';
import {LIMITED_MODES} from '../../config/limits';
import React, {useEffect, useState} from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {GameMode, ThemeColors} from '../../types/game';
import {ModeIcon} from './ModeIcon';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface ModeSelectorProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  colors: ThemeColors;
  vertical?: boolean;
  getRemainingExercises?: (mode: GameMode) => number;
  isPremium?: boolean;
  onAdventurePress?: () => void;
  availableModes?: GameMode[];
  // Young profile: icon-only tabs (larger, no labels) — pre-readers navigate
  // by shape and color, and every icon is drawn from the game's own geometry.
  compact?: boolean;
}

// Which tabs wear the "n/5 left today" badge. Read from the same list the
// limit is enforced from — the bar used to hard-code "everything but
// counting", a second copy of the rule that had already drifted between the
// portrait bar and the landscape one.
function isModeMetered(mode: GameMode): boolean {
  return (LIMITED_MODES as readonly string[]).includes(mode);
}

const allModes: {id: GameMode; key: string}[] = [
  {id: 'counting', key: 'modes.counting'},
  {id: 'addition', key: 'modes.addition'},
  {id: 'subtraction', key: 'modes.subtraction'},
  {id: 'readAdd', key: 'modes.readAdd'},
  {id: 'readSub', key: 'modes.readSub'},
  {id: 'answer', key: 'modes.answer'},
  {id: 'puzzle', key: 'modes.puzzle'},
  {id: 'compare', key: 'modes.compare'},
  {id: 'workshop', key: 'modes.workshop'},
];

export function ModeSelector({
  activeMode,
  onModeChange,
  colors,
  vertical = false,
  getRemainingExercises,
  isPremium = false,
  onAdventurePress,
  availableModes,
  compact = false,
}: ModeSelectorProps) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [rowHeight, setRowHeight] = useState(0);
  const modes = availableModes
    ? allModes.filter(m => availableModes.includes(m.id))
    : allModes;

  if (vertical) {
    // Landscape sidebar mode
    return (
      <View style={styles.containerVertical}>
        {modes.map(mode => {
          const isActive = activeMode === mode.id;
          const isLimited = !isPremium && isModeMetered(mode.id);
          const remaining = getRemainingExercises
            ? getRemainingExercises(mode.id)
            : Infinity;
          const isExhausted = isLimited && remaining <= 0;

          return (
            <Bouncy
              key={mode.id}
              onPress={() => onModeChange(mode.id)}
              style={[
                styles.tabVertical,
                {
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: isActive ? colors.accent : 'transparent',
                  opacity: isExhausted ? 0.5 : 1,
                },
              ]}>
              <View style={styles.emojiVerticalContainer}>
                <ModeIcon mode={mode.id} size={24} colors={colors} />
              </View>
              <Text
                style={[
                  styles.labelVertical,
                  {
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontWeight: isActive ? 'bold' : 'normal',
                  },
                ]}
                numberOfLines={1}>
                {t(mode.key)}
              </Text>
              {isLimited && remaining < Infinity && (
                <Text
                  style={[
                    styles.remainingVertical,
                    {color: remaining <= 0 ? '#EF4444' : '#F59E0B'},
                  ]}>
                  {remaining}/5
                </Text>
              )}
            </Bouncy>
          );
        })}
        {/* In landscape the sidebar was the only navigation, and it had no
            way into Adventure or back Home: on an iPad held sideways — the
            classroom and School Edition setup — Free Play was a dead end
            whose only exit was the iOS edge-swipe. */}
        {onAdventurePress && (
          <Bouncy
            onPress={onAdventurePress}
            accessibilityRole="button"
            accessibilityLabel={t('adventure.title')}
            style={[
              styles.tabVertical,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.25)',
              },
            ]}>
            <View style={styles.emojiVerticalContainer}>
              <ModeIcon mode="adventure" size={26} colors={colors} />
            </View>
          </Bouncy>
        )}
      </View>
    );
  }

  // Portrait: a drawer of rows, TABS_PER_ROW to a row, never a horizontal
  // scroll. The first row is always in view; the rows below it peek out from
  // under it so a child can see there is more, and a pull on the handle (or
  // a swipe up anywhere on the bar) opens the rest. Picking a game closes it.
  // Rows grow with the roster — challenges and timed games will add rows,
  // not squeeze tabs.
  const tabs: ({kind: 'mode'; id: GameMode; key: string} | {kind: 'adventure'})[] =
    modes.map(m => ({kind: 'mode' as const, id: m.id, key: m.key}));
  if (onAdventurePress) tabs.push({kind: 'adventure'});
  const rows: (typeof tabs)[] = [];
  for (let i = 0; i < tabs.length; i += TABS_PER_ROW) {
    rows.push(tabs.slice(i, i + TABS_PER_ROW));
  }
  const hasDrawer = rows.length > 1;

  const renderTab = (tab: (typeof tabs)[number]) => {
    if (tab.kind === 'adventure') {
      return (
        <Bouncy key="adventure" onPress={onAdventurePress} style={styles.bottomTab}>
          <View
            style={[
              styles.bottomTabInner,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.25)',
              },
            ]}>
            <View style={compact ? styles.bottomIconCompact : styles.bottomEmojiContainer}>
              <ModeIcon mode="adventure" size={compact ? 36 : 28} colors={colors} />
            </View>
            {!compact && (
              <Text
                style={[styles.bottomLabel, {color: 'rgba(255,255,255,0.85)', fontWeight: '500'}]}
                numberOfLines={1}>
                {t('adventure.title')}
              </Text>
            )}
            <Text style={styles.remainingPlaceholder}>{' '}</Text>
          </View>
        </Bouncy>
      );
    }
    const isActive = activeMode === tab.id;
    const isLimited = !isPremium && isModeMetered(tab.id);
    const remaining = getRemainingExercises ? getRemainingExercises(tab.id) : Infinity;
    const isExhausted = isLimited && remaining <= 0;
    return (
      <Bouncy
        key={tab.id}
        onPress={() => {
          setExpanded(false);
          onModeChange(tab.id);
        }}
        style={[styles.bottomTab, {opacity: isExhausted ? 0.5 : 1}]}>
        <View
          style={[
            styles.bottomTabInner,
            isActive && {
              backgroundColor: 'rgba(255,255,255,0.35)',
              borderColor: colors.accent,
            },
          ]}>
          <View style={compact ? styles.bottomIconCompact : styles.bottomEmojiContainer}>
            <ModeIcon mode={tab.id} size={compact ? 36 : 28} colors={colors} />
          </View>
          {!compact && (
            <Text
              style={[
                styles.bottomLabel,
                {
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                  fontWeight: isActive ? 'bold' : '500',
                },
              ]}
              numberOfLines={1}>
              {t(tab.key)}
            </Text>
          )}
          {isLimited && remaining < Infinity ? (
            <Text
              style={[
                styles.remainingBottom,
                {color: remaining <= 0 ? '#EF4444' : '#F59E0B'},
              ]}>
              {remaining}/5
            </Text>
          ) : (
            <Text style={styles.remainingPlaceholder}>{' '}</Text>
          )}
        </View>
      </Bouncy>
    );
  };

  // targetSdkVersion 36 means Android 15+ forces the window edge-to-edge —
  // RN's own edgeToEdgeEnabled=false does not opt out of the platform
  // enforcement — so this bar's bottom 48dp lands behind an opaque 3-button
  // navigation bar. These are the mode buttons, so it costs taps, not just
  // pixels. Pre-dates 1.7.0; fixed here now that a provider exists.
  const barPaddingBottom = 12 + insets.bottom;

  // Every row keeps TABS_PER_ROW slots so a short last row has tabs the same
  // width as the rows above it.
  const rowViews = rows.map((row, i) => (
    <View
      key={i}
      style={styles.drawerRow}
      onLayout={i === 0 ? e => setRowHeight(e.nativeEvent.layout.height) : undefined}>
      {row.map(renderTab)}
      {Array.from({length: TABS_PER_ROW - row.length}, (_, j) => (
        <View key={`pad-${j}`} style={styles.bottomTab} />
      ))}
    </View>
  ));

  if (!hasDrawer) {
    return (
      <View style={[styles.bottomBar, {paddingBottom: barPaddingBottom}]}>
        {rowViews}
      </View>
    );
  }

  // The peek sits partly under the home indicator, which is fine: it is a
  // cue that there is more, not a target.
  const collapsedHeight = HANDLE_HEIGHT + rowHeight + ROW_GAP + PEEK + Math.min(insets.bottom, 12);
  const expandedHeight =
    HANDLE_HEIGHT + rows.length * rowHeight + (rows.length - 1) * ROW_GAP + barPaddingBottom;
  return (
    <ModeDrawer
      expanded={expanded}
      setExpanded={setExpanded}
      collapsedHeight={collapsedHeight}
      expandedHeight={expandedHeight}
      accent={colors.accent}
      measured={rowHeight > 0}
      rowHeight={rowHeight}>
      {rowViews}
    </ModeDrawer>
  );
}

const TABS_PER_ROW = 4;
const HANDLE_HEIGHT = 22;
const PEEK = 14; // enough of the next row to read as buttons, not a stripe
const ROW_GAP = 8;

// The animated shell of the drawer: height follows `expanded`, a swipe up or
// down anywhere on it (or a tap on the handle) flips it. The pan only wins
// after 12pt of vertical travel, so taps still reach the tabs.
function ModeDrawer({
  expanded,
  setExpanded,
  collapsedHeight,
  expandedHeight,
  accent,
  measured,
  rowHeight,
  children,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  collapsedHeight: number;
  expandedHeight: number;
  accent: string;
  measured: boolean;
  rowHeight: number;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(expanded ? 1 : 0, {damping: 18, stiffness: 180});
  }, [expanded, progress]);
  const animated = useAnimatedStyle(() => ({
    height: measured
      ? collapsedHeight + (expandedHeight - collapsedHeight) * progress.value
      : undefined,
  }));
  // The chevron points up while closed and flips down once open; while
  // closed it bobs, the one motion on the screen that says "pull me".
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, {duration: 600, easing: Easing.inOut(Easing.quad)}),
        withTiming(0, {duration: 600, easing: Easing.inOut(Easing.quad)}),
      ),
      -1,
      false,
    );
  }, [bob]);
  const chevron = useAnimatedStyle(() => ({
    transform: [
      {translateY: bob.value * (1 - progress.value)},
      {rotate: `${180 * progress.value}deg`},
    ],
  }));
  // The rows underneath sit in shadow while the drawer is closed, so the
  // sliver that shows reads as "more below", not as a row that got cut.
  const shade = useAnimatedStyle(() => ({opacity: 1 - progress.value}));
  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onEnd(e => {
      if (e.translationY < -20) runOnJS(setExpanded)(true);
      else if (e.translationY > 20) runOnJS(setExpanded)(false);
    });
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.drawer, animated]}>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          hitSlop={{top: 6, bottom: 6, left: 60, right: 60}}
          style={styles.handleArea}>
          <Animated.View style={[styles.chevron, chevron]}>
            <View style={[styles.chevronArm, styles.chevronLeft, {backgroundColor: accent}]} />
            <View style={[styles.chevronArm, styles.chevronRight, {backgroundColor: accent}]} />
          </Animated.View>
        </Pressable>
        <View style={styles.drawerRows}>{children}</View>
        <Animated.View
          pointerEvents="none"
          style={[styles.shade, {top: HANDLE_HEIGHT + rowHeight + ROW_GAP / 2}, shade]}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  /* Bottom tab bar (portrait) */
  bottomBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  drawer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  handleArea: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 30,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronArm: {
    position: 'absolute',
    width: 16,
    height: 5,
    borderRadius: 3,
  },
  chevronLeft: {left: 1, transform: [{rotate: '-35deg'}]},
  chevronRight: {right: 1, transform: [{rotate: '35deg'}]},
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawerRows: {
    paddingHorizontal: 8,
    gap: 8,
  },
  drawerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
  },
  bottomTabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: '100%',
    minHeight: 64,
  },
  bottomEmojiContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconCompact: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  remainingBottom: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  remainingPlaceholder: {
    fontSize: 11,
    marginTop: 1,
    color: 'transparent',
  },
  /* Vertical sidebar (landscape) */
  containerVertical: {
    gap: 4,
  },
  tabVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  emojiVerticalContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelVertical: {
    fontSize: 15,
    flex: 1,
    fontWeight: '600',
  },
  remainingVertical: {
    fontSize: 12,
    fontWeight: '700',
  },
});
