import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AudioMode} from '../../types/game';
import {Emoji} from './Emoji';

interface AudioToggleProps {
  mode: AudioMode;
  onChange: (mode: AudioMode) => void;
}

const NEXT: Record<AudioMode, AudioMode> = {
  full: 'sfx',
  sfx: 'mute',
  mute: 'full',
};

const ICON: Record<AudioMode, string> = {
  full: '🔊',
  sfx: '🔈',
  mute: '🔇',
};

const LABEL_KEY: Record<AudioMode, string> = {
  full: 'audio.modeFull',
  sfx: 'audio.modeSfx',
  mute: 'audio.modeMute',
};

export function AudioToggle({mode, onChange}: AudioToggleProps) {
  const {t} = useTranslation();

  return (
    <Pressable
      onPress={() => onChange(NEXT[mode])}
      style={styles.button}
      accessibilityLabel={t(LABEL_KEY[mode])}
      accessibilityRole="button">
      <View style={styles.inner}>
        <Text style={styles.icon}>
          <Emoji>{ICON[mode]}</Emoji>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  icon: {
    fontSize: 18,
  },
});
