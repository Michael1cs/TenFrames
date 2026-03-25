import React from 'react';
import {View, Text, Pressable, StyleSheet, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface DailyLimitModalProps {
  visible: boolean;
  colors: ThemeColors;
  onDismiss: () => void;
  onUpgrade: () => void;
}

export function DailyLimitModal({
  visible,
  colors,
  onDismiss,
  onUpgrade,
}: DailyLimitModalProps) {
  const {t} = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          <Text style={styles.emoji}><Emoji>🌟</Emoji></Text>
          <Text style={[styles.title, {color: colors.text}]}>
            {t('premium.dailyLimitTitle')}
          </Text>
          <Text style={[styles.message, {color: colors.text}]}>
            {t('premium.dailyLimitMessage')}
          </Text>

          <Pressable
            onPress={onUpgrade}
            style={[styles.upgradeButton, {backgroundColor: colors.primaryButton}]}>
            <Text style={styles.upgradeButtonText}>
              {t('premium.unlockAll')} <Emoji>✨</Emoji>
            </Text>
          </Pressable>

          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Text style={[styles.dismissText, {color: colors.accent}]}>
              {t('premium.comeBackTomorrow')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
