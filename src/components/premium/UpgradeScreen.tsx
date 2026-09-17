import React, {useEffect, useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Text} from '../common/AppText';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import type {Product} from 'react-native-iap';
import {Emoji} from '../common/Emoji';
import {ParentalGate} from './ParentalGate';
import {isGrownUp, markGrownUp} from '../../utils/grownUp';

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
  // The gate now guards the WHOLE screen: a child reaching a crown used to
  // see the price, the plan and an 'Unlock now' button, with the maths
  // question appearing only after they tapped it. In a Made for Kids app the
  // price itself is not for the child.
  const [passedGate, setPassedGate] = useState(false);
  useEffect(() => {
    // A grown-up who answered the gate a moment ago (in settings, say) is
    // not asked again here.
    setPassedGate(visible ? isGrownUp() : false);
  }, [visible]);

  // Only what premium actually unlocks. The list used to sell all themes,
  // the sticker book and the achievements, which every free player already
  // has — a purchase described inaccurately, which store reviewers flag and
  // parents notice the moment they look.
  const features = [
    {emoji: '🗺️', key: 'premium.featureAllWorlds'},
    {emoji: '♾️', key: 'premium.featureUnlimitedModes'},
    {emoji: '📊', key: 'premium.featureParentDashboard'},
  ];

  // Only ever show a price the store gave us. There used to be a hardcoded
  // '$4.99' fallback here, which is a trap: the price lives in App Store
  // Connect / Play Console, so the day it changes this string is silently
  // wrong, and a parent who taps Buy after reading the old number sees a
  // different amount at the confirmation sheet. When the product has not
  // loaded — offline, store unavailable, product not yet approved — show
  // nothing rather than a guess.
  // (react-native-iap 15.x renamed Product.localizedPrice to displayPrice.)
  const displayPrice = product?.displayPrice ?? null;
  const isLoading = purchasing || restoring;

  const getErrorMessage = (err: string): string => {
    if (err === 'no_previous_purchase') {
      return t('premium.restoreNotFound');
    }
    if (err === 'purchase_pending') {
      return t('premium.purchasePending');
    }
    return t('premium.purchaseError');
  };

  // Until a grown-up answers, this screen is only the gate.
  if (visible && !passedGate) {
    return (
      <ParentalGate
        visible
        colors={colors}
        onSuccess={() => {
          markGrownUp();
          setPassedGate(true);
        }}
        onCancel={onClose}
      />
    );
  }

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
            <Text style={styles.crown}><Emoji>👑</Emoji></Text>
            <Text style={[styles.title, {color: colors.text}]}>
              {t('premium.upgradeTitle')}
            </Text>
            <Text style={[styles.subtitle, {color: colors.accent}]}>
              {t('premium.upgradeSubtitle')}
            </Text>

            <View style={styles.featureList}>
              {features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureEmoji}><Emoji>{feature.emoji}</Emoji></Text>
                  <Text style={[styles.featureText, {color: colors.text}]}>
                    {t(feature.key)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.priceBox}>
              {displayPrice ? (
                <Text style={[styles.price, {color: colors.text}]}>
                  {displayPrice}
                </Text>
              ) : null}
              <Text style={[styles.priceNote, {color: colors.accent}]}>
                {displayPrice
                  ? t('premium.oneTimePurchase')
                  : t('premium.priceUnavailable')}
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
                  {t('premium.buyNow')} <Emoji>✨</Emoji>
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
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
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
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '600',
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
