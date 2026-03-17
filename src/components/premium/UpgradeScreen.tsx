import React from 'react';
import {View, Text, Pressable, StyleSheet, Modal, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';

interface UpgradeScreenProps {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onPurchase: () => void;
}

export function UpgradeScreen({
  visible,
  colors,
  onClose,
  onPurchase,
}: UpgradeScreenProps) {
  const {t} = useTranslation();

  const features = [
    {emoji: '🎈', key: 'premium.featureUnlimitedModes'},
    {emoji: '🎨', key: 'premium.featureAllThemes'},
    {emoji: '📖', key: 'premium.featureStickerBook'},
    {emoji: '🏆', key: 'premium.featureAchievements'},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.crown}>👑</Text>
            <Text style={[styles.title, {color: colors.text}]}>
              {t('premium.upgradeTitle')}
            </Text>
            <Text style={[styles.subtitle, {color: colors.accent}]}>
              {t('premium.upgradeSubtitle')}
            </Text>

            <View style={styles.featureList}>
              {features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                  <Text style={[styles.featureText, {color: colors.text}]}>
                    {t(feature.key)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.priceBox}>
              <Text style={[styles.price, {color: colors.text}]}>
                $2.99
              </Text>
              <Text style={[styles.priceNote, {color: colors.accent}]}>
                {t('premium.oneTimePurchase')}
              </Text>
            </View>

            <Pressable
              onPress={onPurchase}
              style={[styles.purchaseButton, {backgroundColor: colors.primaryButton}]}>
              <Text style={styles.purchaseButtonText}>
                {t('premium.buyNow')} ✨
              </Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, {color: colors.accent}]}>
                {t('premium.maybeLater')}
              </Text>
            </Pressable>
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
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 28,
    borderWidth: 2,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
  },
  scrollContent: {
    padding: 28,
    alignItems: 'center',
  },
  crown: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
  },
  priceNote: {
    fontSize: 13,
    marginTop: 2,
  },
  purchaseButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
