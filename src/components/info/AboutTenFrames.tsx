import React from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface AboutTenFramesProps {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
}

export function AboutTenFrames({visible, colors, onClose}: AboutTenFramesProps) {
  const {t} = useTranslation();

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
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, {color: colors.accent}]}>
                <Emoji>📐</Emoji> {t('info.title')}
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

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
                      <Text style={styles.miniCellEmoji}><Emoji>⭐</Emoji></Text>
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
                <Emoji>📐</Emoji> {t('info.what')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.whatDesc')}
              </Text>
            </View>

            {/* How do they help? */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>🧒</Emoji> {t('info.howHelp')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.howHelpDesc')}
              </Text>
            </View>

            {/* Counting */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>🔢</Emoji> {t('info.counting')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.countingDesc')}
              </Text>
            </View>

            {/* Addition */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>➕</Emoji> {t('info.addition')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.additionDesc')}
              </Text>
            </View>

            {/* Subtraction */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>➖</Emoji> {t('info.subtraction')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.subtractionDesc')}
              </Text>
            </View>

            {/* Number Bonds */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>🧩</Emoji> {t('info.bonds')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.bondsDesc')}
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>✨</Emoji> {t('info.benefits')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.benefitsDesc')}
              </Text>
            </View>

            {/* Tips for Parents */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>👨‍👩‍👧</Emoji> {t('info.tipsParents')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.tipsParentsDesc')}
              </Text>
            </View>

            {/* Research Background */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                <Emoji>📚</Emoji> {t('info.research')}
              </Text>
              <Text style={[styles.sectionText, {color: colors.text}]}>
                {t('info.researchDesc')}
              </Text>
            </View>
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
    maxWidth: 400,
    height: '80%',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
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
  illustration: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    color: '#E5E7EB',
  },
});
