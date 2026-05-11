import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Modal} from 'react-native';
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

interface ModeChoiceProps {
  visible: boolean;
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
    const t1 = setTimeout(() => voiceRef.current.play('mode_question'), 500);
    const t2 = setTimeout(() => {
      voiceRef.current.play('mode_adventure');
      setActiveCard('adventure');
    }, 3000);
    const t3 = setTimeout(() => {
      voiceRef.current.play('mode_freeplay');
      setActiveCard('freeplay');
    }, 6000);
    const t4 = setTimeout(() => setActiveCard(null), 9000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
      <LinearGradient
        colors={['#1E1B4B', '#4338CA', '#7C3AED']}
        style={styles.gradient}>
        <View style={styles.overlay}>
          {/* Decorative floating emojis */}
          <FloatingEmoji emoji="⭐" style={styles.bgEmoji1} />
          <FloatingEmoji emoji="🌟" style={styles.bgEmoji2} />
          <FloatingEmoji emoji="✨" style={styles.bgEmoji3} />
          <FloatingEmoji emoji="💫" style={styles.bgEmoji4} />

          <Animated.Text entering={BounceIn.delay(200)} style={styles.title}>
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
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
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
