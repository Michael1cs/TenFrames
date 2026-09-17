import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../common/AppText';
import {FREDOKA_FAMILY} from '../../utils/fonts';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {Emoji} from '../common/Emoji';
import {useVoice} from '../../hooks/useVoice';
import {LanguageSwitcher} from '../layout/LanguageSwitcher';
import {Bouncy} from '../common/Bouncy';
import {WorldIcon} from '../adventure/WorldIcon';
import {Language} from '../../types/game';

interface ModeChoiceProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onAdventure: () => void;
  onFreeplay: () => void;
  // Optional home bar — when present, ModeChoice renders the landing-page
  // chrome (dashboard left, language + settings right). Omit on first-run
  // pickers so the screen stays absolutely minimal.
  homeBar?: {
    onDashboard: () => void;
    onSettings: () => void;
  };
}

// Module-level flag so the welcome / mode-question / mode-card narration
// only plays ONCE per language change. Without this, every time the kid
// navigated back to Home (from FreePlay, Adventure, etc.) the full ~10s
// sequence would replay, which felt repetitive and annoying. Reset by
// swapping languages — the parent expects to hear the new voice play.
let narrationPlayedForLang: string | null = null;

// The mode-bar icons, reused so the two doors on the home screen show the
// same pictures the child will tap inside.
const ADVENTURE_ICON = require('../../../assets/icons/mode_adventure.png');
const COUNTING_ICON = require('../../../assets/icons/mode_counting.png');
const FREEPLAY_PREVIEW = [
  require('../../../assets/icons/mode_addition.png'),
  require('../../../assets/icons/mode_subtraction.png'),
  require('../../../assets/icons/mode_workshop.png'),
];

// A soft spark of light that drifts up and down — the decoration the
// floating star emoji used to be, drawn as a plain glowing dot.
function FloatingSpark({size, style}: {size: number; style: any}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, {duration: 1500}),
        withTiming(8, {duration: 1500}),
      ),
      -1,
      true,
    );
  }, [y]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: y.value}],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          shadowColor: '#FFFFFF',
          shadowOpacity: 0.9,
          shadowRadius: size / 2,
          shadowOffset: {width: 0, height: 0},
        },
        animStyle,
      ]}
    />
  );
}

export function ModeChoice({
  language,
  onLanguageChange,
  onAdventure,
  onFreeplay,
  homeBar,
}: ModeChoiceProps) {
  const {t, i18n} = useTranslation();

  // Voice narration sequence + visual pulse on the card whose voice is playing.
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const [activeCard, setActiveCard] = useState<'adventure' | 'freeplay' | null>(
    null,
  );

  const advPulse = useSharedValue(1);
  const fpPulse = useSharedValue(1);
  useEffect(() => {
    if (activeCard === 'adventure') {
      advPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, {duration: 500}),
          withTiming(1, {duration: 500}),
        ),
        4,
        false,
      );
    } else if (activeCard === 'freeplay') {
      fpPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, {duration: 500}),
          withTiming(1, {duration: 500}),
        ),
        4,
        false,
      );
    }
  }, [activeCard, advPulse, fpPulse]);

  const advStyle = useAnimatedStyle(() => ({
    transform: [{scale: advPulse.value}],
  }));
  const fpStyle = useAnimatedStyle(() => ({
    transform: [{scale: fpPulse.value}],
  }));

  // useFocusEffect runs on FOCUS and cleans up on BLUR (not just on unmount).
  // Critical here: react-navigation native-stack keeps blurred screens
  // mounted, so a plain useEffect cleanup wouldn't fire when the kid taps
  // into Adventure / FreePlay mid-narration — the queued setTimeouts would
  // keep calling voice.play after navigation and the welcome/mode sequence
  // would talk over the next screen.
  //
  // The narration only fires the FIRST time Home gets focus per language —
  // subsequent returns from FreePlay / Adventure stay silent. Switching the
  // language flag resets the guard so the parent gets to hear the new voice.
  const currentLang = i18n.language;
  useFocusEffect(useCallback(() => {
    if (narrationPlayedForLang === currentLang) return;
    narrationPlayedForLang = currentLang;
    const t0 = setTimeout(() => voiceRef.current.play('welcome'), 400);
    const t1 = setTimeout(() => voiceRef.current.play('mode_question'), 2400);
    const t2 = setTimeout(() => {
      voiceRef.current.play('mode_adventure');
      setActiveCard('adventure');
    }, 4900);
    const t3 = setTimeout(() => {
      voiceRef.current.play('mode_freeplay');
      setActiveCard('freeplay');
    }, 7900);
    const t4 = setTimeout(() => setActiveCard(null), 10500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      voiceRef.current.stop();
      setActiveCard(null);
    };
  }, [currentLang]));

  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  // Everything on this screen was sized for a phone: a 360pt card column, a
  // 22pt wordmark and 28pt brand cells. On a 13" iPad that column occupies a
  // third of a 1032pt-wide screen and the whole composition collapses into a
  // small island floating in the middle of the artwork. Scale the column, the
  // type and the brand mark together so the screen keeps its proportions
  // instead of just its pixel sizes.
  const isTablet = Math.min(width, height) >= 600;
  const miniCell = isTablet ? 40 : 28;
  const miniGap = isTablet ? 6 : 4;
  const miniPad = isTablet ? 8 : 6;
  // 5 columns; each cell carries a 1.5pt border on both sides.
  const miniFrameWidth =
    5 * (miniCell + 3) + 4 * miniGap + miniPad * 2;
  const spaceBg = isLandscape
    ? require('../../../assets/backgrounds/space/space_landscape.jpg')
    : require('../../../assets/backgrounds/space/space_portrait.jpg');

  return (
    <View style={styles.root}>
      <ImageBackground source={spaceBg} style={styles.gradient} resizeMode="cover">
        {/* Subtle dim so white card UI stays legible over the cosmic art. */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.35)',
            'rgba(0,0,0,0.15)',
            'rgba(0,0,0,0.45)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Home top bar: 🏆 dashboard on the left, language + ⚙️ settings
            on the right, both sides inside a translucent pill so the chrome
            reads cleanly against the cosmic art. On first-run pickers (no
            homeBar) the screen renders without any chrome. */}
        {homeBar ? (
          <View style={styles.topBar} pointerEvents="box-none">
            <Pressable
              onPress={homeBar.onDashboard}
              style={styles.topPillSingle}>
              <Text style={styles.iconButtonText}><Emoji>🏆</Emoji></Text>
            </Pressable>
            <View style={styles.topPillGroup}>
              <LanguageSwitcher
                language={language}
                onLanguageChange={onLanguageChange}
              />
              <Pressable
                onPress={homeBar.onSettings}
                style={styles.settingsButton}>
                <Text style={styles.iconButtonText}><Emoji>⚙️</Emoji></Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.langPicker} pointerEvents="box-none">
            <LanguageSwitcher
              language={language}
              onLanguageChange={onLanguageChange}
            />
          </View>
        )}
        <View style={styles.overlay}>
          {/* Decorative floating emojis */}
          <FloatingSpark size={14} style={styles.bgEmoji1} />
          <FloatingSpark size={10} style={styles.bgEmoji2} />
          <FloatingSpark size={12} style={styles.bgEmoji3} />
          <FloatingSpark size={9} style={styles.bgEmoji4} />

          {/* Brand mark — a mini ten-frame that mirrors the in-game cells:
              filled cells carry the space theme's rocket emoji, empties show
              a faint plus so the grid reads as "fillable" at a glance. */}
          <Animated.View entering={BounceIn.delay(100)} style={styles.brandWrap}>
            <View
              style={[
                styles.miniFrame,
                {width: miniFrameWidth, padding: miniPad, gap: miniGap},
              ]}>
              {Array.from({length: 10}).map((_, i) => {
                const filled = i < 7;
                return (
                  <View
                    key={i}
                    style={[
                      styles.miniCell,
                      {width: miniCell, height: miniCell},
                      filled ? styles.miniCellFilled : styles.miniCellEmpty,
                    ]}>
                    {filled ? (
                      <View
                        style={[
                          styles.miniCellDot,
                          {
                            width: miniCell * 0.55,
                            height: miniCell * 0.55,
                            borderRadius: miniCell * 0.275,
                          },
                        ]}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.miniCellPlus,
                          isTablet && styles.miniCellPlusTablet,
                        ]}>
                        +
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={[styles.brandText, isTablet && styles.brandTextTablet]}>
              TEN FRAMES
            </Text>
          </Animated.View>

          <Animated.Text
            entering={BounceIn.delay(280)}
            style={[styles.title, isTablet && styles.titleTablet]}>
            {t('modeChoice.title')}
          </Animated.Text>

        <View style={[styles.cardsColumn, isTablet && styles.cardsColumnTablet]}>
          {/* Adventure Card */}
          <Animated.View entering={BounceIn.delay(400)} style={advStyle}>
            <Bouncy
              onPress={() => {
                voiceRef.current.stop();
                onAdventure();
              }}
              style={[
                styles.adventureCard,
                activeCard === 'adventure' && styles.cardHighlighted,
              ]}>

              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.adventureIcon,
                    isTablet && styles.modeIconTablet,
                  ]}>
                  <Image
                    source={ADVENTURE_ICON}
                    style={isTablet ? styles.cardIconTablet : styles.cardIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                    {t('modeChoice.adventureTitle')}
                  </Text>
                </View>
              </View>

              {/* A peek at four of the worlds inside. */}
              <View style={styles.previewRow}>
                {(
                  [
                    'counting-meadow',
                    'hungry-monsters',
                    'addition-island',
                    'doubles-castle',
                  ] as const
                ).map(id => (
                  <WorldIcon
                    key={id}
                    worldId={id === 'hungry-monsters' ? 'monster-more' : id}
                    width={isTablet ? 76 : 58}
                    height={isTablet ? 48 : 36}
                    fallbackEmoji=""
                  />
                ))}
              </View>
            </Bouncy>
          </Animated.View>

          {/* Free Play Card */}
          <Animated.View entering={BounceIn.delay(550)} style={fpStyle}>
            <Bouncy
              onPress={() => {
                voiceRef.current.stop();
                onFreeplay();
              }}
              style={[
                styles.freeplayCard,
                activeCard === 'freeplay' && styles.cardHighlighted,
              ]}>
              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.freeplayIcon,
                    isTablet && styles.modeIconTablet,
                  ]}>
                  <Image
                    source={COUNTING_ICON}
                    style={isTablet ? styles.cardIconTablet : styles.cardIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                    {t('modeChoice.freeplayTitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                {FREEPLAY_PREVIEW.map((src, i) => (
                  <Image
                    key={i}
                    source={src}
                    style={isTablet ? styles.previewIconTablet : styles.previewIcon}
                    resizeMode="contain"
                  />
                ))}
              </View>
            </Bouncy>
          </Animated.View>
        </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  gradient: {
    flex: 1,
  },
  langPicker: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topPillSingle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 22,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bgEmoji1: {
    position: 'absolute',
    top: '10%',
    left: '8%',
    fontSize: 36,
    opacity: 0.4,
  },
  bgEmoji2: {
    position: 'absolute',
    top: '15%',
    right: '12%',
    fontSize: 28,
    opacity: 0.35,
  },
  bgEmoji3: {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
    fontSize: 32,
    opacity: 0.4,
  },
  bgEmoji4: {
    position: 'absolute',
    bottom: '12%',
    right: '10%',
    fontSize: 26,
    opacity: 0.3,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  miniFrame: {
    // 5 columns × 2 rows. Each cell is 28px wide + 1.5px border on each
    // side (≈31px outer); 4 inter-cell gaps of 4px and 6px container
    // padding on each side keeps everything on two rows.
    flexDirection: 'row',
    flexWrap: 'wrap',
    // width / padding / gap are supplied inline so the brand mark can grow
    // on tablets; see miniFrameWidth in the component.
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center',
  },
  miniCell: {
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCellFilled: {
    backgroundColor: '#3B82F6',
    borderColor: '#93C5FD',
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  miniCellEmpty: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  miniCellDot: {
    backgroundColor: '#FFF4DC',
  },
  miniCellPlusTablet: {fontSize: 19},
  miniCellPlus: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  brandTextTablet: {fontSize: 34, letterSpacing: 7},
  title: {
    fontFamily: FREDOKA_FAMILY,
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  titleTablet: {fontSize: 36, marginBottom: 34},
  cardsColumn: {
    gap: 16,
    width: '100%',
    maxWidth: 360,
  },
  cardsColumnTablet: {maxWidth: 620, gap: 26},
  adventureCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  freeplayCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardHighlighted: {
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  adventureIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2.5,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeplayIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {width: 62, height: 62},
  cardIconTablet: {width: 88, height: 88},
  previewIcon: {width: 34, height: 34},
  previewIconTablet: {width: 46, height: 46},
  modeIconTablet: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  cardTitleTablet: {fontSize: 36},
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingLeft: 4,
  },
  previewDots: {
    color: '#9CA3AF',
    fontSize: 14,
    letterSpacing: 2,
  },
});
