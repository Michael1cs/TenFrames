import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {ALL_ACHIEVEMENTS} from '../../utils/rewardData';
import {Emoji} from '../common/Emoji';

interface AchievementsScreenProps {
  visible: boolean;
  unlockedAchievements: string[];
  colors: ThemeColors;
  onClose: () => void;
}

export function AchievementsScreen({
  visible,
  unlockedAchievements,
  colors,
  onClose,
}: AchievementsScreenProps) {
  const {t} = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, {backgroundColor: colors.backgroundFrom}]}>
          <View style={styles.header}>
          <Text style={[styles.title, {color: colors.accent}]}>
            {t('rewards.achievements')}
          </Text>
          <Text style={[styles.progress, {color: colors.text}]}>
            {unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {ALL_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <View
                key={ach.id}
                style={[
                  styles.achievementRow,
                  isUnlocked
                    ? styles.achievementUnlocked
                    : styles.achievementLocked,
                ]}>
                <Text
                  style={[
                    styles.achievementEmoji,
                    !isUnlocked && styles.lockedEmoji,
                  ]}>
                  <Emoji>{isUnlocked ? ach.emoji : '🔒'}</Emoji>
                </Text>
                <View style={styles.achievementInfo}>
                  <Text
                    style={[
                      styles.achievementName,
                      {color: isUnlocked ? '#FFFFFF' : 'rgba(255,255,255,0.4)'},
                    ]}>
                    {isUnlocked ? t(ach.nameKey) : '???'}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDesc,
                      {color: isUnlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'},
                    ]}>
                    {t(ach.descKey)}
                  </Text>
                </View>
                {isUnlocked && <Text style={styles.checkmark}><Emoji>✅</Emoji></Text>}
              </View>
            );
          })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    height: '80%',
    borderRadius: 20,
    padding: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 8,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  achievementLocked: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  achievementEmoji: {
    fontSize: 28,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
  },
});
