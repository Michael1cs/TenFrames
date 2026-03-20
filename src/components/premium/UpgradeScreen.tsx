import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
// Product type placeholder — will use react-native-iap Product when billing is integrated
interface Product {
  localizedPrice: string;
}

interface UpgradeScreenProps {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onPurchase: () => void;
  onRestore: () => void;
  product: Product | null;
  purchasing: boolean;
  restoring: boolean;
  error: string | null;
  onClearError: () => void;
}

export function UpgradeScreen({
  visible,
  colors,
  onClose,
  onPurchase,
  onRestore,
  product,
  purchasing,
  restoring,
  error,
  onClearError,
}: UpgradeScreenProps) {
  const {t} = useTranslation();

  const features = [
    {emoji: '🎈', key: 'premium.featureUnlimitedModes'},
    {emoji: '🎨', key: 'premium.featureAllThemes'},
    {emoji: '📖', key: 'premium.featureStickerBook'},
    {emoji: '🏆', key: 'premium.featureAchievements'},
  ];

  // Use localized price from store, fallback to $2.99
  const displayPrice = product?.localizedPrice || '$2.99';
  const isLoading = purchasing || restoring;

  const getErrorMessage = (err: string): string => {
    if (err === 'no_previous_purchase') {
      return t('premium.restoreNotFound');
    }
    return t('premium.purchaseError');
  };

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
                {displayPrice}
              </Text>
              <Text style={[styles.priceNote, {color: colors.accent}]}>
                {t('premium.oneTimePurchase')}
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <Pressable onPress={onClearError} style={styles.errorBox}>
                <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
              </Pressable>
            )}

            {/* Purchase button */}
            <Pressable
              onPress={onPurchase}
              disabled={isLoading}
              style={[
                styles.purchaseButton,
                {backgroundColor: colors.primaryButton},
                isLoading && styles.disabledButton,
              ]}>
              {purchasing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.purchaseButtonText}>
                    {t('premium.purchasing')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {t('premium.buyNow')} ✨
                </Text>
              )}
            </Pressable>

            {/* Restore purchases button */}
            <Pressable
              onPress={onRestore}
              disabled={isLoading}
              style={[styles.restoreButton, isLoading && styles.disabledButton]}>
              {restoring ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text style={[styles.restoreText, {color: colors.accent}]}>
                    {t('premium.purchasing')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.restoreText, {color: colors.accent}]}>
                  {t('premium.restorePurchases')}
                </Text>
              )}
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
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
  restoreButton: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
