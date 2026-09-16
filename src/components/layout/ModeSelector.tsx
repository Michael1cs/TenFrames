import React from 'react';
import {View, Pressable, ScrollView, StyleSheet} from 'react-native';
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

const allModes: {id: GameMode; key: string}[] = [
  {id: 'counting', key: 'modes.counting'},
  {id: 'addition', key: 'modes.addition'},
  {id: 'subtraction', key: 'modes.subtraction'},
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
  const modes = availableModes
    ? allModes.filter(m => availableModes.includes(m.id))
    : allModes;

  if (vertical) {
    // Landscape sidebar mode
    return (
      <View style={styles.containerVertical}>
        {modes.map(mode => {
          const isActive = activeMode === mode.id;
          const isLimited =
            !isPremium && mode.id !== 'counting' && mode.id !== 'workshop';
          const remaining = getRemainingExercises
            ? getRemainingExercises(mode.id)
            : Infinity;
          const isExhausted = isLimited && remaining <= 0;

          return (
            <Pressable
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
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Portrait bottom tab bar. With the full 7-mode roster plus Adventure the
  // tabs no longer fit a phone width, so past six entries the bar scrolls
  // horizontally with fixed-width tabs instead of squeezing flex ones.
  const totalTabs = modes.length + (onAdventurePress ? 1 : 0);
  const scrollable = totalTabs > 6;
  const tabStyle = scrollable ? styles.bottomTabFixed : styles.bottomTab;
  const bar = (
    <>
      {modes.map(mode => {
        const isActive = activeMode === mode.id;
        const isLimited = !isPremium && mode.id !== 'counting';
        const remaining = getRemainingExercises
          ? getRemainingExercises(mode.id)
          : Infinity;
        const isExhausted = isLimited && remaining <= 0;

        return (
          <Pressable
            key={mode.id}
            onPress={() => onModeChange(mode.id)}
            style={[
              tabStyle,
              {opacity: isExhausted ? 0.5 : 1},
            ]}>
            <View
              style={[
                styles.bottomTabInner,
                isActive && {
                  backgroundColor: 'rgba(255,255,255,0.35)',
                  borderColor: colors.accent,
                },
              ]}>
              <View style={compact ? styles.bottomIconCompact : styles.bottomEmojiContainer}>
                <ModeIcon mode={mode.id} size={compact ? 36 : 28} colors={colors} />
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
                  {t(mode.key)}
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
          </Pressable>
        );
      })}
      {onAdventurePress && (
        <Pressable onPress={onAdventurePress} style={tabStyle}>
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
                style={[
                  styles.bottomLabel,
                  {color: 'rgba(255,255,255,0.85)', fontWeight: '500'},
                ]}
                numberOfLines={1}>
                {t('adventure.title')}
              </Text>
            )}
            <Text style={styles.remainingPlaceholder}>{' '}</Text>
          </View>
        </Pressable>
      )}
    </>
  );

  // targetSdkVersion 36 means Android 15+ forces the window edge-to-edge —
  // RN's own edgeToEdgeEnabled=false does not opt out of the platform
  // enforcement — so this bar's bottom 48dp lands behind an opaque 3-button
  // navigation bar. These are the mode buttons, so it costs taps, not just
  // pixels. Pre-dates 1.7.0; fixed here now that a provider exists.
  const barPaddingBottom = 12 + insets.bottom;

  if (scrollable) {
    return (
      <View style={styles.bottomBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.bottomBarScroll,
            {paddingBottom: barPaddingBottom},
          ]}>
          {bar}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.bottomBar, {paddingBottom: barPaddingBottom}]}>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Bottom tab bar (portrait) */
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
  },
  bottomTabFixed: {
    width: 88,
    alignItems: 'center',
  },
  bottomBarWrap: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomBarScroll: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
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
