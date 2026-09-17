import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import Sound from 'react-native-sound';
import {useTranslation} from 'react-i18next';
import {VOICE_BY_ID} from '../voice/script';

Sound.setCategory('Playback', true); // mix with music

type Lang = 'ro' | 'en' | 'de';

// ─────────────────────────────────────────────────────────────────────
// Bounded voice cache.
//
// The library is 1275 clips per language (3810 mp3s bundled). Every
// `new Sound()` is a live AVAudioPlayer / MediaPlayer holding its file open,
// so caching them all — as this module used to, keyed by id and never
// released — grows without limit for as long as the app stays open, and
// eventually gets the process killed under memory pressure.
//
// A Map preserves insertion order, which is all an LRU needs: re-inserting on
// a hit moves the entry to the young end, so iteration starts at the coldest.
// ─────────────────────────────────────────────────────────────────────
const MAX_CACHED_SOUNDS = 48;

const cache = new Map<string, Sound>();
// Clips that failed to load. Booleans, not players, so this is safe to keep
// forever — and it stops us retrying a missing file on every playback.
const missing = new Set<string>();
// Loads in flight, so two enqueues of the same clip cannot allocate two players.
const inflight = new Map<string, Promise<Sound | null>>();

let globalEnabled = true;
let currentlyPlaying: Sound | null = null;

function cacheKey(lang: Lang, id: string) {
  return `${lang}:${id}`;
}

function evictDown(limit: number) {
  for (const [key, sound] of cache) {
    if (cache.size <= limit) return;
    // Never release the player that is mid-sentence — release() on a playing
    // AVAudioPlayer is exactly the kind of thing that crashes natively.
    if (sound === currentlyPlaying) continue;
    cache.delete(key);
    try {
      sound.release();
    } catch {
      // Already torn down by the platform — nothing left to do.
    }
  }
}

// A suspended app has no use for a warm audio cache, and iOS reclaims
// backgrounded apps by memory footprint. Hand it all back on the way out.
//
// clearVoiceQueue() first, and not just for tidiness: iOS suspends the process
// mid-clip, so react-native-sound's play completion callback never fires and
// the pump would stay flagged busy for the rest of the session — voice simply
// never returns until the child happens to navigate somewhere.
AppState.addEventListener('change', state => {
  if (state === 'background') {
    clearVoiceQueue();
    evictDown(0);
  }
});

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
    busyToken = null;
  }
}

function buildPath(lang: Lang, id: string) {
  // react-native-sound looks up file in MAIN_BUNDLE (iOS) or res/raw (Android).
  // After running scripts/gen-voice.mjs + react-native-asset, .mp3s are linked.
  return `voice_${lang}_${id}.mp3`;
}

function loadFile(lang: Lang, id: string): Promise<Sound | null> {
  const key = cacheKey(lang, id);

  const cached = cache.get(key);
  if (cached) {
    // Re-insert so this entry counts as the most recently used.
    cache.delete(key);
    cache.set(key, cached);
    return Promise.resolve(cached);
  }
  if (missing.has(key)) return Promise.resolve(null);

  const pending = inflight.get(key);
  if (pending) return pending;

  const load = new Promise<Sound | null>(resolve => {
    const file = buildPath(lang, id);
    const sound = new Sound(file, Sound.MAIN_BUNDLE, error => {
      inflight.delete(key);
      if (error) {
        // Audio file missing — fail gracefully, remember it so we don't retry.
        missing.add(key);
        resolve(null);
        return;
      }
      sound.setVolume(0.95);
      // Inserted last, so eviction reaches it only after every colder entry.
      cache.set(key, sound);
      evictDown(MAX_CACHED_SOUNDS);
      resolve(sound);
    });
  });

  inflight.set(key, load);
  return load;
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
// Identifies WHICH drain job owns `busy`. Without it, a job that discovers it
// has gone stale clears the flag out from under whichever newer job has since
// claimed the pump.
let busyToken: object | null = null;
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
  const token = {};
  busyToken = token;
  const gen = playGen;

  // Ends this job. It answers two questions the old code conflated into a
  // single `gen === playGen` check:
  //
  //  * Do we still OWN the pump? Only then may we clear `busy` and schedule
  //    the next clip. A clearVoiceQueue() in the meantime handed ownership to
  //    a newer job, and releasing the flag under it truncated that job's clip
  //    and dropped its onDone.
  //  * Is this job still CURRENT? Only then may onDone fire — onDone advances
  //    game state (Adventure records the answer from it), so a stale one would
  //    score the wrong problem.
  //
  // The pump restarts either way. Gating the restart on currency is what let a
  // clearPendingVoiceQueue() mid-clip strand every clip queued behind it until
  // some later enqueue happened to find the queue idle.
  const finish = () => {
    if (busyToken !== token) return;
    busyToken = null;
    busy = false;
    if (gen === playGen) next.onDone?.();
    drainTimer = setTimeout(drain, next.gapMs);
  };

  void loadFile(next.lang, next.id).then(sound => {
    if (gen !== playGen || !sound || !globalEnabled) {
      finish();
      return;
    }
    if (currentlyPlaying && currentlyPlaying !== sound) {
      currentlyPlaying.stop();
    }
    currentlyPlaying = sound;
    sound.stop(() => {
      if (gen !== playGen) {
        // Stopped in the window between sound.stop and sound.play. stop()
        // never fires the completion listener, so clear the pointer here or
        // it keeps naming a clip that will never play.
        if (currentlyPlaying === sound) currentlyPlaying = null;
        finish();
        return;
      }
      sound.setCurrentTime(0);
      sound.play(() => {
        if (currentlyPlaying === sound) currentlyPlaying = null;
        finish();
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
  busyToken = null;
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
  // Compare mode speaks about WHAT was compared rather than just cheering,
  // and rotates so a five-problem level never repeats itself.
  compareAsk: ['cmp_ask_1', 'cmp_ask_2', 'cmp_ask_3', 'cmp_ask_4'],
  compareYes: ['cmp_yes_1', 'cmp_yes_2', 'cmp_yes_3', 'cmp_yes_4'],
  compareSame: ['cmp_same_1', 'cmp_same_2'],
  // Mode-aware confirmations: praise that names what the child achieved,
  // mixed with the generic cheers so neither wears out.
  okCounting: ['ok_count_1', 'ok_total_2'],
  okAddition: ['ok_total_1', 'ok_total_2'],
  okSubtraction: ['ok_left_1'],
  okMemory: ['ok_memory_1'],
};
