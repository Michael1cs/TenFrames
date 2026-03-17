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
import {Theme, Language} from '../../types/game';
import {getAllThemes} from '../../hooks/useTheme';
import {LanguageSwitcher} from '../layout/LanguageSwitcher';

interface PlayerSetupProps {
  visible: boolean;
  playerName: string;
  onNameChange: (name: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: () => void;
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
  onComplete,
  isThemeChange = false,
}: PlayerSetupProps) {
  const {t} = useTranslation();
  const themes = getAllThemes();

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
            <Text style={styles.title}>
              {isThemeChange ? `🎨 ${t('setup.changeTheme')}` : `🎮 ${t('setup.welcome')} 🌟`}
            </Text>

            {!isThemeChange && (
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
            )}

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
                      <Text style={styles.themeEmoji}>
                        {themeConfig.selectorEmoji}
                      </Text>
                      <Text
                        style={[
                          styles.themeName,
                          {color: isSelected ? '#FFFFFF' : '#374151'},
                        ]}>
                        {t(themeConfig.nameKey)} {themeConfig.emoji}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable onPress={onComplete} style={styles.startButton}>
              <Text style={styles.startButtonText}>
                {isThemeChange
                  ? `✨ ${t('setup.saveTheme')}`
                  : `🎮 ${t('setup.startAdventure')}`}
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  languageRow: {
    alignItems: 'flex-start',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeButton: {
    width: '18%',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  themeName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
