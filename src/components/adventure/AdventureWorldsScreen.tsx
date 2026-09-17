import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {
  AdventureProgress,
  AdventureWorld,
  WorldId,
  ThemeConfig,
} from '../../types/game';
import {
  ADVENTURE_WORLDS,
  isLevelPremiumLocked,
} from '../../config/adventureWorlds';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {WorldIcon} from './WorldIcon';
import {WorldProgressFrame} from './WorldProgressFrame';

// Grid geometry, shared between the container padding and the per-card
// width so the columns always add up to the available width exactly.
const GRID_PADDING = 16;
const GRID_GAP = 12;

// The same clay map icon the Free Play bar uses for Adventure, so the title
// carries the picture the child just tapped to get here.
const ADVENTURE_ICON = require('../../../assets/icons/mode_adventure.png');

// How many of a world's levels the child has finished. Bonus levels count:
// the progress frame only fills completely when the whole world is done.
function countCompleted(
  world: AdventureWorld,
  progress: AdventureProgress,
): number {
  const levels = progress.worlds[world.id]?.levels ?? {};
  return world.levels.reduce(
    (n, level) => n + (levels[level.id]?.completed ? 1 : 0),
    0,
  );
}

// The card the child should tap next. "Playable" means the world has a
// level the child can open right now: reached by progression and not behind
// the crown for a free user (the same rule the map's crowns use, so the
// pulse never points at a locked level). Among playable worlds, prefer the
// furthest one the child has already started — that's where they are —
// and fall back to the first playable one on a fresh install. A pre-reader
// can't scan eleven names for "where was I?", so this card pulses instead,
// the way the current level pulses on the map inside.
function pickRecommended(
  progress: AdventureProgress,
  isPremium: boolean,
): WorldId | null {
  const playable = (w: AdventureWorld) => {
    const wp = progress.worlds[w.id];
    if (!wp?.unlocked) return false;
    return w.levels.some(level => {
      const lp = wp.levels[level.id];
      return (
        !!lp?.unlocked &&
        !lp.completed &&
        !isLevelPremiumLocked(w, level, lp, isPremium)
      );
    });
  };
  const started = (w: AdventureWorld) => countCompleted(w, progress) > 0;
  const furthestStarted = [...ADVENTURE_WORLDS]
    .reverse()
    .find(w => started(w) && playable(w));
  return (furthestStarted ?? ADVENTURE_WORLDS.find(playable))?.id ?? null;
}

interface Props {
  progress: AdventureProgress;
  isPremium: boolean;
  onSelectWorld: (worldId: WorldId) => void;
  onClose: () => void;
}

export function AdventureWorldsScreen({
  progress,
  isPremium,
  onSelectWorld,
  onClose,
}: Props) {
  const {t} = useTranslation();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(() => {
    const timer = setTimeout(() => voiceRef.current.play('choose_world'), 500);
    return () => clearTimeout(timer);
  }, []);

  // The cards used a flat 47% width, which is right on a phone (two columns)
  // but produced ~485pt squares on a 13" iPad — two and a half of them filled
  // the screen and the world list read as a stack of billboards rather than a
  // map.
  //
  // The width the math runs on is MEASURED from the grid itself (onLayout),
  // not read from useWindowDimensions: under iPadOS 26's resizable windows
  // the Dimensions module can keep reporting the window's old size after a
  // live resize, which left a two-column phone grid hugging the left edge of
  // a full-width iPad window. The measured width is ground truth no matter
  // how the window got its size; the window value only seeds the first frame.
  const {width: windowWidth} = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const width = measuredWidth ?? windowWidth;
  const isTablet = width >= 640;
  const columns = isTablet ? 3 : 2;
  // Math.floor, or the row overflows by a fraction of a point: at 820pt
  // (iPad Air portrait) the exact share is 254.67pt, Yoga rounds each card
  // up to the pixel grid, 3×255 + gaps lands 1pt past the row, and the third
  // card WRAPS — tablet-sized cards in two left-hugging columns. Flooring
  // trades that for a ≤3pt slack on the right, which nobody can see.
  const cardWidth = Math.floor(
    (width - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns,
  );

  const allThemes = getAllThemes();
  const recommended = pickRecommended(progress, isPremium);

  return (
    <ImageBackground
      source={require('../../../assets/backgrounds/pixel/pixel_portrait.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Image
              source={ADVENTURE_ICON}
              style={isTablet ? styles.titleIconTablet : styles.titleIcon}
              resizeMode="contain"
            />
            <Text style={[styles.title, isTablet && styles.titleTablet]}>
              {t('adventure.title')}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.worldsScroll}
          contentContainerStyle={styles.worldsGrid}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          onLayout={e => setMeasuredWidth(e.nativeEvent.layout.width)}>
          {ADVENTURE_WORLDS.map(w => {
            const wTheme = allThemes.find(
              (th: ThemeConfig) => th.id === w.theme,
            );
            return (
              <WorldCard
                key={w.id}
                world={w}
                width={cardWidth}
                isTablet={isTablet}
                accent={wTheme?.colors?.accent ?? '#8B5CF6'}
                unlocked={!!progress.worlds[w.id]?.unlocked}
                completed={countCompleted(w, progress)}
                recommended={w.id === recommended}
                onPress={() => onSelectWorld(w.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

interface WorldCardProps {
  world: AdventureWorld;
  width: number;
  isTablet: boolean;
  accent: string;
  unlocked: boolean;
  completed: number;
  recommended: boolean;
  onPress: () => void;
}

// A world card is built for a child who doesn't read: the illustration
// shows the math, the mini ten frame shows how far they've got, and the
// recommended card breathes. The name stays, smaller, for the adult.
function WorldCard({
  world,
  width,
  isTablet,
  accent,
  unlocked,
  completed,
  recommended,
  onPress,
}: WorldCardProps) {
  const {t} = useTranslation();

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!recommended) {
      pulse.value = withTiming(1, {duration: 200});
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.035, {duration: 850}),
        withTiming(1, {duration: 850}),
      ),
      -1,
      false,
    );
  }, [recommended, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
  }));

  const artWidth = width - 20;
  const artHeight = Math.round(width * 0.48);

  return (
    <Animated.View style={[{width}, pulseStyle]}>
      <Pressable
        onPress={onPress}
        disabled={!unlocked}
        style={[
          styles.worldCard,
          {borderColor: accent},
          recommended && styles.worldCardRecommended,
          !unlocked && styles.worldCardLocked,
        ]}>
        <View style={{width: artWidth, height: artHeight}}>
          <WorldIcon
            worldId={world.id}
            width={artWidth}
            height={artHeight}
            fallbackEmoji={world.emoji}
            dimmed={!unlocked}
          />
          {!unlocked && <Padlock />}
        </View>
        <Text
          style={[styles.worldCardName, isTablet && styles.worldCardNameTablet]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {t(world.nameKey)}
        </Text>
        <WorldProgressFrame
          completed={completed}
          total={world.levels.length}
          cellSize={isTablet ? 13 : 10}
          accent={accent}
        />
      </Pressable>
    </Animated.View>
  );
}

// A padlock drawn from two rounded shapes — no glyph, no emoji — over the
// faded picture of a world the child hasn't reached yet.
function Padlock() {
  return (
    <View style={styles.padlock} pointerEvents="none">
      <View style={styles.padlockShackle} />
      <View style={styles.padlockBody}>
        <View style={styles.padlockHole} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titleIcon: {width: 30, height: 30},
  titleIconTablet: {width: 42, height: 42},
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  titleTablet: {fontSize: 32},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  worldsScroll: {flex: 1},
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // flex-start, not space-between: the width is computed to fill the row
    // exactly, so space-between would only stretch a short final row.
    justifyContent: 'flex-start',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 96,
    gap: GRID_GAP,
  },
  worldCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  worldCardRecommended: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  worldCardLocked: {
    opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  worldCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  worldCardNameTablet: {fontSize: 19},
  padlock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padlockShackle: {
    width: 22,
    height: 16,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    marginBottom: -2,
  },
  padlockBody: {
    width: 32,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padlockHole: {
    width: 7,
    height: 9,
    borderRadius: 3.5,
    backgroundColor: '#1E1B4B',
  },
});
