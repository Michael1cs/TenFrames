import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Theme, Language, AgeGroup} from '../../types/game';
import {getAllThemes} from '../../hooks/useTheme';
import {LanguageSwitcher} from '../layout/LanguageSwitcher';
import {Emoji} from '../common/Emoji';

interface PlayerSetupProps {
  visible: boolean;
  playerName: string;
  onNameChange: (name: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  ageGroup: AgeGroup;
  onAgeGroupChange: (group: AgeGroup) => void;
  onComplete: () => void;
  // When true, modal is opened from header (returning user editing settings).
  // We don't show the big "Ten Frames" title and the CTA copy is "Save".
  isThemeChange?: boolean;
}

export function PlayerSetup({
  visible,
  playerName,
  onNameChange,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  ageGroup,
  onAgeGroupChange,
  onComplete,
  isThemeChange = false,
}: PlayerSetupProps) {
  const {t} = useTranslation();
  const themes = getAllThemes();
  const isSettings = isThemeChange;

  const themeGradients: Record<Theme, string[]> = {
    space: ['#6366F1', '#8B5CF6'],
    forest: ['#22C55E', '#10B981'],
    ocean: ['#3B82F6', '#06B6D4'],
    farm: ['#EAB308', '#F97316'],
    candy: ['#EC4899', '#D946EF'],
    unicorn: ['#8B5CF6', '#A855F7'],
    pixel: ['#0D9488', '#06B6D4'],
    slime: ['#84CC16', '#A855F7'],
    kpop: ['#EC4899', '#8B5CF6'],
    monsters: ['#7C3AED', '#10B981'],
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!isSettings && (
              <Text style={styles.titleMain}>Ten Frames</Text>
            )}
            <Text style={styles.title}>
              {isSettings ? (
                <><Emoji>⚙️</Emoji>{` ${t('setup.settings')}`}</>
              ) : (
                <><Emoji>🎮</Emoji>{` ${t('setup.welcome')} `}<Emoji>🌟</Emoji></>
              )}
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>{t('setup.nameLabel')}</Text>
              <TextInput
                value={playerName}
                onChangeText={onNameChange}
                placeholder={t('setup.namePlaceholder')}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{t('setup.languageLabel')}</Text>
              <View style={styles.languageRow}>
                <LanguageSwitcher
                  language={language}
                  onLanguageChange={onLanguageChange}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{t('setup.ageLabel')}</Text>
              <View style={styles.ageRow}>
                <Pressable
                  onPress={() => onAgeGroupChange('young')}
                  style={[
                    styles.ageButton,
                    ageGroup === 'young' && styles.ageButtonActive,
                  ]}>
                  <Emoji style={styles.ageEmoji}>
                    {t('setup.ageYoungEmoji')}
                  </Emoji>
                  <Text
                    style={[
                      styles.ageLabel,
                      ageGroup === 'young' && styles.ageLabelActive,
                    ]}>
                    {t('setup.ageYoung')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onAgeGroupChange('older')}
                  style={[
                    styles.ageButton,
                    ageGroup === 'older' && styles.ageButtonActive,
                  ]}>
                  <Emoji style={styles.ageEmoji}>
                    {t('setup.ageOlderEmoji')}
                  </Emoji>
                  <Text
                    style={[
                      styles.ageLabel,
                      ageGroup === 'older' && styles.ageLabelActive,
                    ]}>
                    {t('setup.ageOlder')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{t('setup.themeLabel')}</Text>
              <View style={styles.themeGrid}>
                {themes.map(themeConfig => {
                  const isSelected = theme === themeConfig.id;
                  const gradientColor = themeGradients[themeConfig.id][0];
                  return (
                    <Pressable
                      key={themeConfig.id}
                      onPress={() => onThemeChange(themeConfig.id)}
                      style={[
                        styles.themeButton,
                        {
                          backgroundColor: isSelected
                            ? gradientColor
                            : '#F3F4F6',
                          borderColor: isSelected
                            ? gradientColor
                            : '#E5E7EB',
                        },
                      ]}>
                      <Emoji style={styles.themeEmoji}>
                        {themeConfig.selectorEmoji}
                      </Emoji>
                      <Text
                        style={[
                          styles.themeName,
                          {color: isSelected ? '#FFFFFF' : '#374151'},
                        ]}>
                        {t(themeConfig.nameKey)} <Emoji>{themeConfig.emoji}</Emoji>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable onPress={onComplete} style={styles.startButton}>
              <Text style={styles.startButtonText}>
                {isSettings ? (
                  <>✓ {t('setup.saveSettings')}</>
                ) : (
                  <><Emoji>🎮</Emoji> {t('setup.startAdventure')}</>
                )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    elevation: 10,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#4F46E5',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 22,
    color: '#1F2937',
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#374151',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: '#1F2937',
  },
  languageRow: {
    alignItems: 'flex-start',
  },
  ageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ageButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    gap: 4,
  },
  ageButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  ageEmoji: {
    fontSize: 36,
  },
  ageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  ageLabelActive: {
    color: '#5B21B6',
    fontWeight: '700',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  themeButton: {
    width: '22%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
