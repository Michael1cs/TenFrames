import React from 'react';
import {Pressable, Text, StyleSheet, View} from 'react-native';
import {Language} from '../../types/game';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSwitcher({
  language,
  onLanguageChange,
}: LanguageSwitcherProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onLanguageChange('ro')}
        style={[
          styles.flag,
          language === 'ro' && styles.activeFlag,
        ]}>
        <Text style={styles.flagText}>🇷🇴</Text>
      </Pressable>
      <Pressable
        onPress={() => onLanguageChange('en')}
        style={[
          styles.flag,
          language === 'en' && styles.activeFlag,
        ]}>
        <Text style={styles.flagText}>🇬🇧</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  flag: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFlag: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  flagText: {
    fontSize: 20,
  },
});
