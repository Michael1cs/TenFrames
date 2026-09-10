import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {Emoji} from '../common/Emoji';
import {AgeProfile} from '../../hooks/useAgeProfile';
import {CompareProblem, ThemeColors} from '../../types/game';

interface CompareModeProps {
  problem: CompareProblem | null;
  onPick: (side: 'left' | 'right' | 'equal') => void;
  onReset: () => void;
  isCorrect: boolean | null;
  hasSubmitted: boolean;
  feedback: string;
  colors: ThemeColors;
  level: number;
  ageProfile?: AgeProfile;
}

// A 2x5 mini frame drawn with plain dots — small enough that two fit side
// by side, which is the whole point of the mode.
function MiniFrame({
  count,
  colors,
  highlight,
}: {
  count: number;
  colors: ThemeColors;
  highlight: boolean;
}) {
  return (
    <View
      style={[
        styles.miniFrame,
        {borderColor: highlight ? '#22C55E' : 'rgba(255,255,255,0.5)'},
      ]}>
      {[0, 1].map(row => (
        <View key={row} style={styles.miniRow}>
          {[0, 1, 2, 3, 4].map(col => {
            const index = row * 5 + col;
            const filled = index < count;
            return (
              <View
                key={col}
                style={[
                  styles.miniCell,
                  {
                    backgroundColor: filled
                      ? colors.cellFilled
                      : 'rgba(255,255,255,0.25)',
                    borderColor: filled
                      ? colors.cellFilledBorder
                      : 'rgba(255,255,255,0.4)',
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// "Which has more?" — subitizing and comparison. The child taps the fuller
// frame, or the "same" button when the two frames hold equal counts.
export function CompareMode({
  problem,
  onPick,
  onReset,
  isCorrect,
  hasSubmitted,
  colors,
  level,
  ageProfile,
}: CompareModeProps) {
  const {t} = useTranslation();
  const compact = ageProfile?.compact ?? false;
  const revealed = hasSubmitted && isCorrect === true;

  if (!problem) return null;

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={[styles.levelBadge, {backgroundColor: colors.accent}]}>
          <Text style={styles.levelText}><Emoji>⭐</Emoji> Level {level} <Emoji>⭐</Emoji></Text>
        </View>
      )}

      <View style={styles.problemContainer}>
        <Text style={styles.question}>{t('game.compareQuestion')}</Text>
      </View>

      <View style={styles.framesRow}>
        <Pressable
          onPress={() => onPick('left')}
          style={({pressed}) => [
            styles.frameCard,
            pressed && styles.cardPressed,
          ]}>
          <MiniFrame
            count={problem.left}
            colors={colors}
            highlight={revealed && problem.correct === 'left'}
          />
        </Pressable>
        <Pressable
          onPress={() => onPick('right')}
          style={({pressed}) => [
            styles.frameCard,
            pressed && styles.cardPressed,
          ]}>
          <MiniFrame
            count={problem.right}
            colors={colors}
            highlight={revealed && problem.correct === 'right'}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={() => onPick('equal')}
        style={({pressed}) => [
          styles.equalButton,
          {
            backgroundColor:
              revealed && problem.correct === 'equal'
                ? '#22C55E'
                : 'rgba(255,255,255,0.92)',
          },
          pressed && styles.cardPressed,
        ]}>
        <Text
          style={[
            styles.equalText,
            revealed && problem.correct === 'equal' && {color: '#FFFFFF'},
          ]}>
          = {t('game.compareSame')}
        </Text>
      </Pressable>


      <Pressable
        onPress={onReset}
        style={[styles.resetButton, {backgroundColor: colors.primaryButton}]}>
        <Text style={styles.resetButtonText}><Emoji>🔄</Emoji></Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  problemContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  framesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  frameCard: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardPressed: {
    transform: [{scale: 0.95}],
  },
  miniFrame: {
    borderWidth: 3,
    borderRadius: 10,
    padding: 5,
    gap: 5,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 5,
  },
  miniCell: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  equalButton: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 22,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  equalText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 22,
  },
});
