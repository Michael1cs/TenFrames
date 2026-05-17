import React, {useState} from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Language, ThemeColors} from '../../types/game';
import {Emoji} from '../common/Emoji';
import {LanguageSwitcher} from '../layout/LanguageSwitcher';

interface AboutTenFramesProps {
  visible: boolean;
  colors: ThemeColors;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onClose: () => void;
  onOpenProgress?: () => void;
}

type Tab = 'kids' | 'parents';

export function AboutTenFrames({
  visible,
  colors,
  language,
  onLanguageChange,
  onClose,
  onOpenProgress,
}: AboutTenFramesProps) {
  const {t} = useTranslation();
  const [tab, setTab] = useState<Tab>('kids');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.accent}]}>
              <Emoji>📐</Emoji> {t('info.title')}
            </Text>
            <LanguageSwitcher
              language={language}
              onLanguageChange={onLanguageChange}
            />
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('kids')}
              style={[
                styles.tab,
                tab === 'kids' && {backgroundColor: colors.accent},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  tab === 'kids' && styles.tabTextActive,
                ]}>
                <Emoji>🧒</Emoji> {t('info.tabKids')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('parents')}
              style={[
                styles.tab,
                tab === 'parents' && {backgroundColor: colors.accent},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  tab === 'parents' && styles.tabTextActive,
                ]}>
                <Emoji>👨‍👩‍👧</Emoji> {t('info.tabParents')}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Ten Frame illustration (always visible) */}
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

            {tab === 'kids' ? (
              <>
                <View style={styles.kidsIntro}>
                  <Text style={[styles.kidsIntroText, {color: colors.text}]}>
                    {t('info.kids.intro')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    {t('info.kids.counting')}
                  </Text>
                  <Text style={[styles.kidsText, {color: colors.text}]}>
                    {t('info.kids.countingDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    {t('info.kids.addition')}
                  </Text>
                  <Text style={[styles.kidsText, {color: colors.text}]}>
                    {t('info.kids.additionDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    {t('info.kids.subtraction')}
                  </Text>
                  <Text style={[styles.kidsText, {color: colors.text}]}>
                    {t('info.kids.subtractionDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    {t('info.kids.puzzle')}
                  </Text>
                  <Text style={[styles.kidsText, {color: colors.text}]}>
                    {t('info.kids.puzzleDesc')}
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Progress dashboard entry — gated by ParentalGate inside
                    the dashboard so the child can't peek. */}
                {onOpenProgress && (
                  <Pressable
                    onPress={onOpenProgress}
                    style={[
                      styles.progressBtn,
                      {backgroundColor: colors.accent},
                    ]}>
                    <Text style={styles.progressBtnText}>
                      <Emoji>📊</Emoji>{' '}
                      {t('info.parents.viewProgress', {
                        defaultValue: 'See child progress',
                      })}
                    </Text>
                  </Pressable>
                )}

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>📐</Emoji> {t('info.parents.what')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.whatDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>🧒</Emoji> {t('info.parents.howHelp')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.howHelpDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>🔢</Emoji> {t('info.parents.counting')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.countingDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>➕</Emoji> {t('info.parents.addition')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.additionDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>➖</Emoji> {t('info.parents.subtraction')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.subtractionDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>🧩</Emoji> {t('info.parents.bonds')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.bondsDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>✨</Emoji> {t('info.parents.benefits')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.benefitsDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>👨‍👩‍👧</Emoji> {t('info.parents.tips')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.tipsDesc')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    <Emoji>📚</Emoji> {t('info.parents.research')}
                  </Text>
                  <Text style={[styles.sectionText, {color: colors.text}]}>
                    {t('info.parents.researchDesc')}
                  </Text>
                </View>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  kidsIntro: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  kidsIntroText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E5E7EB',
  },
  kidsText: {
    fontSize: 17,
    lineHeight: 25,
    color: '#E5E7EB',
  },
  progressBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  progressBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
