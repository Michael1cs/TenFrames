import React from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';

interface AboutTenFramesProps {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
}

export function AboutTenFrames({visible, colors, onClose}: AboutTenFramesProps) {
  const {t} = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.modal, {backgroundColor: colors.backgroundFrom}]}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: colors.accent}]}>
            {t('info.title')}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Ten Frame illustration */}
          <View style={styles.illustration}>
            <View style={styles.miniGrid}>
              {[1, 1, 1, 1, 0, 0, 0, 0, 0, 0].map((filled, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniCell,
                    {
                      backgroundColor: filled
                        ? colors.cellColor1
                        : colors.cellEmpty,
                      borderColor: filled
                        ? colors.cellColor1Border
                        : colors.cellEmptyBorder,
                    },
                  ]}>
                  {filled ? (
                    <Text style={styles.miniCellEmoji}>⭐</Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={[styles.illustrationLabel, {color: colors.text}]}>
              4 / 10
            </Text>
          </View>

          {/* What are Ten Frames? */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.accent}]}>
              📐 {t('info.what')}
            </Text>
            <Text style={[styles.sectionText, {color: colors.text}]}>
              {t('info.whatDesc')}
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.accent}]}>
              ✨ {t('info.benefits')}
            </Text>
            <Text style={[styles.sectionText, {color: colors.text}]}>
              {t('info.benefitsDesc')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 80,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
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
    gap: 16,
  },
  illustration: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 5 * 36,
    justifyContent: 'center',
  },
  miniCell: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1.5,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCellEmoji: {
    fontSize: 14,
  },
  illustrationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.85,
  },
});
