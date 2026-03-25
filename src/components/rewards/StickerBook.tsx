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
import {ALL_STICKERS} from '../../utils/rewardData';
import {Emoji} from '../common/Emoji';

interface StickerBookProps {
  visible: boolean;
  unlockedStickers: string[];
  totalStars: number;
  colors: ThemeColors;
  onClose: () => void;
}

const CATEGORIES = [
  {id: 'numbers', emoji: '🔢'},
  {id: 'animals', emoji: '🐾'},
  {id: 'space', emoji: '🚀'},
  {id: 'nature', emoji: '🌿'},
  {id: 'food', emoji: '🍎'},
  {id: 'sports', emoji: '🏆'},
] as const;

export function StickerBook({
  visible,
  unlockedStickers,
  totalStars,
  colors,
  onClose,
}: StickerBookProps) {
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
            {t('rewards.stickerBook')}
          </Text>
          <Text style={[styles.progress, {color: colors.text}]}>
            {unlockedStickers.length}/{ALL_STICKERS.length}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {CATEGORIES.map(cat => {
            const stickers = ALL_STICKERS.filter(s => s.category === cat.id);
            return (
              <View key={cat.id} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, {color: colors.text}]}>
                  <Emoji>{cat.emoji}</Emoji> {t(`stickerCategories.${cat.id}`)}
                </Text>
                <View style={styles.stickerGrid}>
                  {stickers.map(sticker => {
                    const isUnlocked = unlockedStickers.includes(sticker.id);
                    return (
                      <View
                        key={sticker.id}
                        style={[
                          styles.stickerCell,
                          isUnlocked
                            ? styles.stickerUnlocked
                            : styles.stickerLocked,
                        ]}>
                        <Text
                          style={[
                            styles.stickerEmoji,
                            !isUnlocked && styles.stickerLockedEmoji,
                          ]}>
                          <Emoji>{isUnlocked ? sticker.emoji : '❓'}</Emoji>
                        </Text>
                        {!isUnlocked && (
                          <Text style={styles.requirementText}>
                            <Emoji>⭐</Emoji> {sticker.requirement}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
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
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stickerCell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stickerLocked: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stickerEmoji: {
    fontSize: 28,
  },
  stickerLockedEmoji: {
    opacity: 0.4,
  },
  requirementText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
