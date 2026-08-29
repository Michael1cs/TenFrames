import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Language} from '../../types/game';
import {Emoji} from '../common/Emoji';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  /** Tablet-sized flags — the default is tuned for the phone top bar. */
  large?: boolean;
  /**
   * Selection styling for a light surface. The default active state is a
   * translucent white border, which is correct over the cosmic artwork of the
   * top bar but invisible inside the white setup modal — the parent could not
   * see which language was selected.
   */
  onLight?: boolean;
}

export function LanguageSwitcher({
  language,
  onLanguageChange,
  large = false,
  onLight = false,
}: LanguageSwitcherProps) {
  const flagStyle = [styles.flag, large && styles.flagLarge];
  const activeStyle = onLight ? styles.activeFlagLight : styles.activeFlag;
  const textStyle = [styles.flagText, large && styles.flagTextLarge];
  return (
    <View style={[styles.container, large && styles.containerLarge]}>
      <Pressable
        onPress={() => onLanguageChange('ro')}
        style={[flagStyle, language === 'ro' && activeStyle]}>
        <Emoji style={textStyle}>🇷🇴</Emoji>
      </Pressable>
      <Pressable
        onPress={() => onLanguageChange('en')}
        style={[flagStyle, language === 'en' && activeStyle]}>
        <Emoji style={textStyle}>🇬🇧</Emoji>
      </Pressable>
      <Pressable
        onPress={() => onLanguageChange('de')}
        style={[flagStyle, language === 'de' && activeStyle]}>
        <Emoji style={textStyle}>🇩🇪</Emoji>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  containerLarge: {
    gap: 14,
  },
  flag: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flagLarge: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 3,
  },
  activeFlag: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeFlagLight: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  flagText: {
    fontSize: 20,
  },
  flagTextLarge: {
    fontSize: 40,
  },
});
