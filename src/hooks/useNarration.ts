import {useCallback, useEffect, useRef} from 'react';
import Tts from 'react-native-tts';
import {useTranslation} from 'react-i18next';
import {AudioMode, Language} from '../types/game';

const LANG_TO_TTS: Record<Language, string> = {
  ro: 'ro-RO',
  en: 'en-US',
};

export function useNarration(audioMode: AudioMode = 'full') {
  const {t, i18n} = useTranslation();
  const initialized = useRef(false);
  const currentLang = useRef<Language>((i18n.language as Language) || 'ro');

  useEffect(() => {
    let cancelled = false;

    Tts.getInitStatus()
      .then(() => {
        if (cancelled) return;
        initialized.current = true;
        const lang = (i18n.language as Language) || 'ro';
        Tts.setDefaultLanguage(LANG_TO_TTS[lang]).catch(() => {});
        Tts.setDefaultRate(0.45);
        Tts.setDefaultPitch(1.1);
      })
      .catch(() => {
        initialized.current = false;
      });

    return () => {
      cancelled = true;
      Tts.stop().catch(() => {});
    };
  }, [i18n.language]);

  useEffect(() => {
    const lang = (i18n.language as Language) || 'ro';
    if (lang !== currentLang.current) {
      currentLang.current = lang;
      if (initialized.current) {
        Tts.setDefaultLanguage(LANG_TO_TTS[lang]).catch(() => {});
      }
    }
  }, [i18n.language]);

  const speak = useCallback(
    (textOrKey: string, options?: {isKey?: boolean; params?: Record<string, any>}) => {
      if (audioMode !== 'full') return;
      if (!initialized.current) return;
      const text = options?.isKey ? t(textOrKey, options.params) : textOrKey;
      if (!text) return;
      Tts.stop()
        .then(() => Tts.speak(text))
        .catch(() => {});
    },
    [audioMode, t],
  );

  const speakKey = useCallback(
    (key: string, params?: Record<string, any>) => {
      speak(key, {isKey: true, params});
    },
    [speak],
  );

  const stop = useCallback(() => {
    Tts.stop().catch(() => {});
  }, []);

  return {speak, speakKey, stop, enabled: audioMode === 'full'};
}
