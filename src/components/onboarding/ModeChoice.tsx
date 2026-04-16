import React from 'react';
import {View, Text, Pressable, StyleSheet, Modal} from 'react-native';
import Animated, {
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Emoji} from '../common/Emoji';

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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.Text entering={BounceIn.delay(200)} style={styles.title}>
          {t('modeChoice.title')}
        </Animated.Text>

        <View style={styles.cardsColumn}>
          {/* Adventure Card */}
          <Animated.View entering={BounceIn.delay(400)}>
            <Pressable onPress={onAdventure} style={styles.adventureCard}>
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
                  <Text style={styles.cardDesc}>
                    {t('modeChoice.adventureDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}><Emoji>🍄</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🐟</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🚀</Emoji></Text>
                <Text style={styles.previewDots}>• • •</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Free Play Card */}
          <Animated.View entering={BounceIn.delay(550)}>
            <Pressable onPress={onFreeplay} style={styles.freeplayCard}>
              <View style={styles.cardContent}>
                <View style={styles.freeplayIcon}>
                  <Text style={styles.bigEmoji}><Emoji>🎮</Emoji></Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {t('modeChoice.freeplayTitle')}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {t('modeChoice.freeplayDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}><Emoji>🔢</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>➕</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>➖</Emoji></Text>
                <Text style={styles.previewEmoji}><Emoji>🧩</Emoji></Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
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
    maxWidth: 340,
  },
  adventureCard: {
    borderRadius: 24,
    padding: 20,
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
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  adventureIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeplayIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 34,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingLeft: 4,
  },
  previewEmoji: {
    fontSize: 22,
  },
  previewDots: {
    color: '#9CA3AF',
    fontSize: 14,
    letterSpacing: 2,
  },
  // Floating decorations
  floatTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    fontSize: 16,
    opacity: 0.6,
  },
  floatTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 14,
    opacity: 0.5,
  },
  floatBR: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    opacity: 0.4,
  },
});
