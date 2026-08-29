import {useCallback, useEffect, useRef, useState} from 'react';
import Sound from 'react-native-sound';

// Must match useVoice.ts: setCategory is a process-wide AVAudioSession call,
// so whichever of the two modules imports last would otherwise win. Passing
// mixWithOthers keeps a parent's music or podcast playing underneath.
Sound.setCategory('Playback', true);

type SoundName = 'tap' | 'correct' | 'wrong' | 'levelup' | 'star';

const SOUNDS: {name: SoundName; file: string; volume: number}[] = [
  {name: 'tap', file: 'tap.wav', volume: 0.5},
  {name: 'correct', file: 'correct.wav', volume: 0.7},
  {name: 'wrong', file: 'wrong.wav', volume: 0.5},
  {name: 'levelup', file: 'levelup.wav', volume: 0.8},
  {name: 'star', file: 'star.wav', volume: 0.6},
];

export function useSound() {
  const loaded = useRef<Map<SoundName, Sound>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;

    for (const {name, file, volume} of SOUNDS) {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.warn(`[Sound] Failed to load ${file}:`, error);
        } else if (mounted) {
          sound.setVolume(volume);
          loaded.current.set(name, sound);
        } else {
          // Unmounted while this clip was still decoding. The cleanup below
          // has already run, so it will never be reached again — release it
          // here or the player and its open file handle leak for the rest of
          // the process's life.
          sound.release();
        }
        loadedCount++;
        if (loadedCount === SOUNDS.length && mounted) {
          setReady(true);
        }
      });
    }

    return () => {
      mounted = false;
      for (const sound of loaded.current.values()) {
        sound.release();
      }
      loaded.current.clear();
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    const sound = loaded.current.get(name);
    if (!sound) return;
    // Stop any current playback and replay from start
    sound.stop(() => {
      sound.setCurrentTime(0);
      sound.play(success => {
        if (!success) {
          // Reset on failure (Android audio focus lost)
          sound.reset();
        }
      });
    });
  }, []);

  return {play, ready};
}
