import {useCallback, useEffect, useState} from 'react';
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

// Module-level setter so any component (Settings, GameShell) can flip the
// global voice on/off without needing the same useVoice instance.
export function setVoiceEnabled(enabled: boolean) {
  globalEnabled = enabled;
  if (!enabled) {
    playGen++;
    queue.length = 0;
    currentlyPlaying?.stop();
    currentlyPlaying = null;
    busy = false;
  }
}

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

// ─────────────────────────────────────────────────────────────────────
// Module-level voice queue. Every play / playRandom / playSequence call
// pushes into this single FIFO so clips never overlap, even when they
// originate from different useVoice instances (GameShell, Adventure
// screens, ModeChoice — each previously had its own queue). The gap is
// inserted AFTER each clip finishes; tweak via DEFAULT_GAP_MS.
// ─────────────────────────────────────────────────────────────────────
const DEFAULT_GAP_MS = 250;

type Job = {
  lang: Lang;
  id: string;
  onDone?: () => void;
  gapMs: number;
};
const queue: Job[] = [];
let busy = false;
let drainTimer: ReturnType<typeof setTimeout> | null = null;
// Bumped on every stop(). A load-in-flight Promise captures the value at
// drain time and bails when it resolves into a stale generation — otherwise
// a `voice.stop()` issued WHILE the next clip is still loading lets the
// clip play anyway when the load finally resolves.
let playGen = 0;

function drain() {
  if (busy) return;
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  const next = queue.shift();
  if (!next) return;
  busy = true;
  const gen = playGen;
  void loadFile(next.lang, next.id).then(sound => {
    if (gen !== playGen) {
      // We were stopped while loading. Don't play, don't fire onDone, don't
      // chain — the new queue (if any) drains itself.
      busy = false;
      return;
    }
    if (!sound || !globalEnabled) {
      busy = false;
      next.onDone?.();
      drainTimer = setTimeout(drain, next.gapMs);
      return;
    }
    if (currentlyPlaying && currentlyPlaying !== sound) {
      currentlyPlaying.stop();
    }
    currentlyPlaying = sound;
    sound.stop(() => {
      if (gen !== playGen) {
        // Also catches the window between sound.stop and sound.play.
        busy = false;
        return;
      }
      sound.setCurrentTime(0);
      sound.play(() => {
        if (currentlyPlaying === sound) currentlyPlaying = null;
        busy = false;
        // Only chain if we're still on the same generation; otherwise the
        // stop() already cleared the queue and we'd be advancing nothing.
        if (gen === playGen) {
          next.onDone?.();
          drainTimer = setTimeout(drain, next.gapMs);
        }
      });
    });
  });
}

function enqueue(lang: Lang, id: string, onDone?: () => void, gapMs = DEFAULT_GAP_MS) {
  if (!globalEnabled) {
    onDone?.();
    return;
  }
  queue.push({lang, id, onDone, gapMs});
  drain();
}

export function clearVoiceQueue() {
  playGen++;
  queue.length = 0;
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  currentlyPlaying?.stop();
  currentlyPlaying = null;
  busy = false;
}

// Like clearVoiceQueue but lets the CURRENTLY PLAYING clip finish naturally.
// Only the pending items are dropped (their gen will mismatch when the
// playing clip's onDone fires, so the chain stops). Use this when you want
// to invalidate "stale" upcoming clips (e.g. leftover instruction from the
// previous problem) without cutting off legitimate praise mid-sentence.
export function clearPendingVoiceQueue() {
  playGen++;
  queue.length = 0;
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
}

export interface UseVoiceOptions {
  enabled?: boolean;
}

export function useVoice(opts: UseVoiceOptions = {}) {
  const {i18n} = useTranslation();
  const [ready, setReady] = useState(false);

  // When an explicit `enabled` prop is supplied, drive the module-level
  // flag from it. Hooks called without opts (most components) just observe
  // whatever the latest explicit setter wrote — that's how the global voice
  // toggle in Settings reaches every consumer.
  useEffect(() => {
    if (opts.enabled !== undefined) {
      setVoiceEnabled(opts.enabled);
    }
  }, [opts.enabled]);

  useEffect(() => {
    setReady(true);
    return () => {
      // Don't tear down the shared queue when a single consumer unmounts —
      // other screens may still be using it. Only stop the in-flight clip.
    };
  }, []);

  const langOf = useCallback((): Lang => {
    return (i18n.language === 'ro'
      ? 'ro'
      : i18n.language === 'de'
      ? 'de'
      : 'en') as Lang;
  }, [i18n.language]);

  const play = useCallback(
    (id: string, onDone?: () => void) => {
      const entry = VOICE_BY_ID[id];
      if (!entry) {
        console.warn(`[useVoice] Unknown voice id: ${id}`);
        onDone?.();
        return;
      }
      enqueue(langOf(), id, onDone);
    },
    [langOf],
  );

  const playRandom = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      play(ids[Math.floor(Math.random() * ids.length)]);
    },
    [play],
  );

  // playSequence is now just N enqueue calls — the global FIFO handles
  // ordering and the gap between them.
  const playSequence = useCallback(
    (ids: string[], gapAfterMs = DEFAULT_GAP_MS, onAllDone?: () => void) => {
      if (!ids.length) {
        onAllDone?.();
        return;
      }
      const lang = langOf();
      ids.forEach((id, i) => {
        const isLast = i === ids.length - 1;
        enqueue(lang, id, isLast ? onAllDone : undefined, gapAfterMs);
      });
    },
    [langOf],
  );

  const stop = useCallback(() => {
    clearVoiceQueue();
  }, []);

  return {play, playRandom, playSequence, stop, ready};
}

// Predefined groups for random pickup
export const VOICE_GROUPS = {
  correct: ['fb_correct_1', 'fb_correct_2', 'fb_correct_3', 'fb_correct_4', 'fb_correct_5', 'fb_correct_6', 'fb_correct_7', 'fb_correct_8'],
  tryAgain: ['fb_again_1', 'fb_again_2', 'fb_again_3', 'fb_again_4', 'fb_again_5'],
};
