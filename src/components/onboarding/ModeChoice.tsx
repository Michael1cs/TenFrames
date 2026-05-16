import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Modal, ImageBackground, useWindowDimensions} from 'react-native';
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
import {Language} from '../../types/game';

interface ModeChoiceProps {
  visible: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onAdventure: () => void;
  onFreeplay: () => void;
}

function FloatingEmoji({emoji, style}: {emoji: string; style: any}) {
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
    <Animated.Text style={[style, animStyle]}>
      <Emoji>{emoji}</Emoji>
    </Animated.Text>
  );
}

export function ModeChoice({
  visible,
  language,
  onLanguageChange,
  onAdventure,
  onFreeplay,
}: ModeChoiceProps) {
  const {t} = useTranslation();

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

  useEffect(() => {
    if (!visible) {
      setActiveCard(null);
      return;
    }
    // Welcome lands first so the child knows the app heard them; then the
    // mode prompt and per-card narration follow on the existing cadence.
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
    };
  }, [visible]);

  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const spaceBg = isLandscape
    ? require('../../../assets/backgrounds/space/space_landscape.jpg')
    : require('../../../assets/backgrounds/space/space_portrait.jpg');

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
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
        {/* Language picker (top-right). Lets the parent flip the app
            language even when the device locale doesn't match the
            preferred reading. Tiny, doesn't compete with the cards. */}
        <View style={styles.langPicker} pointerEvents="box-none">
          <LanguageSwitcher
            language={language}
            onLanguageChange={onLanguageChange}
          />
        </View>
        <View style={styles.overlay}>
          {/* Decorative floating emojis */}
          <FloatingEmoji emoji="⭐" style={styles.bgEmoji1} />
          <FloatingEmoji emoji="🌟" style={styles.bgEmoji2} />
          <FloatingEmoji emoji="✨" style={styles.bgEmoji3} />
          <FloatingEmoji emoji="💫" style={styles.bgEmoji4} />

          {/* Ten Frames brand mark — a stylized mini ten-frame above the
              question so the first screen actually announces the app. */}
          <Animated.View entering={BounceIn.delay(100)} style={styles.brandWrap}>
            <View style={styles.miniFrame}>
              {Array.from({length: 10}).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniCell,
                    i < 7 && styles.miniCellFilled,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.brandText}>TEN FRAMES</Text>
          </Animated.View>

          <Animated.Text entering={BounceIn.delay(280)} style={styles.title}>
            {t('modeChoice.title')}
          </Animated.Text>

        <View style={styles.cardsColumn}>
          {/* Adventure Card */}
          <Animated.View entering={BounceIn.delay(400)} style={advStyle}>
            <Pressable
              onPress={() => {
                voiceRef.current.stop();
                onAdventure();
              }}
              style={[
                styles.adventureCard,
                activeCard === 'adventure' && styles.cardHighlighted,
              ]}>
              {/* Floating decorations */}
              <FloatingEmoji emoji="⭐" style={styles.floatTL} />
              <FloatingEmoji emoji="🌟" style={styles.floatTR} />
              <FloatingEmoji emoji="✨" style={styles.floatBR} />

              <View style={styles.cardContent}>
                <View style={styles.adventureIcon}>
                  <Text style={styles.bigEmoji}><Emoji>🗺️</Emoji></Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {t('modeChoice.adventureTitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}><Emoji>🍄</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🐟</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🚀</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🏖️</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🏰</Emoji></Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Free Play Card */}
          <Animated.View entering={BounceIn.delay(550)} style={fpStyle}>
            <Pressable
              onPress={() => {
                voiceRef.current.stop();
                onFreeplay();
              }}
              style={[
                styles.freeplayCard,
                activeCard === 'freeplay' && styles.cardHighlighted,
              ]}>
              <View style={styles.cardContent}>
                <View style={styles.freeplayIcon}>
                  <Text style={styles.bigEmoji}><Emoji>🎮</Emoji></Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {t('modeChoice.freeplayTitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}><Emoji>🔢</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>➕</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>➖</Emoji></Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  langPicker: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 5 * 26 + 4 * 6 + 12, // 5 cells × 26px + 4 gaps × 6px + padding
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    gap: 4,
  },
  miniCell: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 2,
    marginBottom: 2,
  },
  miniCellFilled: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  cardsColumn: {
    gap: 16,
    width: '100%',
    maxWidth: 360,
  },
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
  bigEmoji: {
    fontSize: 48,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingLeft: 4,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewDots: {
    color: '#9CA3AF',
    fontSize: 14,
    letterSpacing: 2,
  },
  // Floating decorations
  floatTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 18,
    opacity: 0.6,
  },
  floatTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 16,
    opacity: 0.5,
  },
  floatBR: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 14,
    opacity: 0.4,
  },
});
