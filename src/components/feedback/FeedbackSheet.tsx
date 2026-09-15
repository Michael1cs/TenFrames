import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '../common/AppText';
import {Emoji} from '../common/Emoji';
import Animated, {
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export interface EquationPart {
  text: string;
  color: string;
}

interface FeedbackSheetProps {
  visible: boolean;
  isCorrect: boolean | null;
  stars: number; // 0-3, correct answers only
  equationParts: EquationPart[] | null;
}

// The answer moment, done the way the polished kids' apps do it (Duolingo,
// Khan Kids): a sheet slides over the BOTTOM of the play area — absolutely
// positioned, so the frame above never reflows — carrying the stars, the
// praise and the completed equation ("2 + 3 = 5") in one place instead of
// scattering them across the screen.
export function FeedbackSheet({
  visible,
  isCorrect,
  stars,
  equationParts,
}: FeedbackSheetProps) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(160);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible && isCorrect !== null) {
      translateY.value = withSpring(0, {damping: 15, stiffness: 160});
      opacity.value = withTiming(1, {duration: 200});
    } else {
      translateY.value = withTiming(160, {duration: 180});
      opacity.value = withTiming(0, {duration: 150});
    }
  }, [visible, isCorrect, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  if (!visible || isCorrect === null) return null;

  return (
    // The lane is anchored to the window bottom, so on Android it would sit
    // under the navigation bar — 48dp with 3-button nav, and opaque. The
    // equation is the card's last line, so that is exactly what gets eaten.
    // iOS never showed this: Info.plist locks iPhone to portrait and only
    // iPad reaches landscape, where the home indicator is ~20pt and see-through.
    <View pointerEvents="none" style={[styles.lane, {bottom: 10 + insets.bottom}]}>
      <Animated.View
        style={[
          styles.card,
          {borderColor: isCorrect ? '#22C55E' : '#F59E0B'},
          animStyle,
        ]}>
        {isCorrect && stars > 0 && (
          <View style={styles.starsRow}>
            {Array.from({length: 3}).map((_, i) => (
              <Animated.View
                key={i}
                entering={BounceIn.delay(150 + i * 160).duration(350)}>
                <Text style={i === 1 ? styles.starBig : styles.star}>
                  {i < stars ? <Emoji>⭐</Emoji> : ' '}
                </Text>
              </Animated.View>
            ))}
          </View>
        )}
        <Text style={[styles.title, {color: isCorrect ? '#16A34A' : '#B45309'}]}>
          {isCorrect ? t('feedback.correct') : t('feedback.tryAgain')}
        </Text>
        {isCorrect && equationParts && (
          <Text style={styles.equation}>
            {equationParts.map((part, i) => (
              <Text key={i} style={{color: part.color}}>
                {part.text}
              </Text>
            ))}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    zIndex: 60,
  },
  card: {
    backgroundColor: '#FFF9F0',
    borderRadius: 22,
    borderWidth: 3,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 240,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  star: {
    fontSize: 26,
  },
  starBig: {
    fontSize: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  equation: {
    fontSize: 26,
    fontWeight: 'bold',
  },
});
