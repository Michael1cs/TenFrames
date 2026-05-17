import {useCallback, useEffect, useRef, useState} from 'react';
import Sound from 'react-native-sound';
import {useTranslation} from 'react-i18next';
import {VOICE_BY_ID} from '../voice/script';

Sound.setCategory('Playback', true); // mix with music

type Lang = 'ro' | 'en' | 'de';

const FILES_PER_LANG: Record<Lang, Record<string, Sound | null | undefined>> = {
  ro: {},
  en: {},
  de: {},
};

let globalEnabled = true;
let currentlyPlaying: Sound | null = null;

function buildPath(lang: Lang, id: string) {
  // react-native-sound looks up file in MAIN_BUNDLE (iOS) or res/raw (Android).
  // After running scripts/gen-voice.mjs + react-native-asset, .mp3s are linked.
  return `voice_${lang}_${id}.mp3`;
}

function loadFile(lang: Lang, id: string): Promise<Sound | null> {
  const cached = FILES_PER_LANG[lang][id];
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise(resolve => {
    const file = buildPath(lang, id);
    const sound = new Sound(file, Sound.MAIN_BUNDLE, error => {
      if (error) {
        // Audio file missing — fail gracefully, cache as null so we don't retry.
        FILES_PER_LANG[lang][id] = null;
        resolve(null);
        return;
      }
      sound.setVolume(0.95);
      FILES_PER_LANG[lang][id] = sound;
      resolve(sound);
    });
  });
}

export interface UseVoiceOptions {
  enabled?: boolean;
}

export function useVoice(opts: UseVoiceOptions = {}) {
  const {i18n} = useTranslation();
  const [ready, setReady] = useState(false);
  const enabledRef = useRef(opts.enabled ?? true);
  enabledRef.current = opts.enabled ?? true;

  useEffect(() => {
    globalEnabled = enabledRef.current;
  }, [opts.enabled]);

  useEffect(() => {
    setReady(true);
    return () => {
      currentlyPlaying?.stop();
      currentlyPlaying = null;
    };
  }, []);

  const play = useCallback(
    async (id: string, onDone?: () => void) => {
      if (!globalEnabled) {
        onDone?.();
        return;
      }
      const entry = VOICE_BY_ID[id];
      if (!entry) {
        console.warn(`[useVoice] Unknown voice id: ${id}`);
        onDone?.();
        return;
      }
      const lang = (
        i18n.language === 'ro' ? 'ro' :
        i18n.language === 'de' ? 'de' :
        'en'
      ) as Lang;
      const sound = await loadFile(lang, id);
      if (!sound) {
        onDone?.();
        return; // file not yet generated — silent fallback
      }

      // Interrupt previous clip
      if (currentlyPlaying && currentlyPlaying !== sound) {
        currentlyPlaying.stop();
      }
      currentlyPlaying = sound;
      sound.stop(() => {
        sound.setCurrentTime(0);
        sound.play(() => {
          if (currentlyPlaying === sound) currentlyPlaying = null;
          onDone?.();
        });
      });
    },
    [i18n.language],
  );

  const playRandom = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      play(ids[Math.floor(Math.random() * ids.length)]);
    },
    [play],
  );

  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelQueue = () => {
    if (queueTimerRef.current) {
      clearTimeout(queueTimerRef.current);
      queueTimerRef.current = null;
    }
  };

  // Chain via completion callback so the next clip never interrupts the
  // previous one, regardless of clip length. gapAfterMs is the silence
  // inserted between the end of one clip and the start of the next.
  // onAllDone fires after the last clip's playback (+ no trailing gap) finishes.
  const playSequence = useCallback(
    (ids: string[], gapAfterMs = 300, onAllDone?: () => void) => {
      cancelQueue();
      if (!ids.length) {
        onAllDone?.();
        return;
      }
      let i = 0;
      const next = () => {
        if (i >= ids.length) {
          onAllDone?.();
          return;
        }
        const id = ids[i++];
        play(id, () => {
          if (i < ids.length) {
            queueTimerRef.current = setTimeout(next, gapAfterMs);
          } else {
            onAllDone?.();
          }
        });
      };
      next();
    },
    [play],
  );

  const stop = useCallback(() => {
    cancelQueue();
    currentlyPlaying?.stop();
    currentlyPlaying = null;
  }, []);

  return {play, playRandom, playSequence, stop, ready};
}

// Predefined groups for random pickup
export const VOICE_GROUPS = {
  correct: ['fb_correct_1', 'fb_correct_2', 'fb_correct_3', 'fb_correct_4', 'fb_correct_5', 'fb_correct_6', 'fb_correct_7', 'fb_correct_8'],
  tryAgain: ['fb_again_1', 'fb_again_2', 'fb_again_3', 'fb_again_4', 'fb_again_5'],
};
