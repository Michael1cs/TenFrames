import {useCallback, useEffect, useRef, useState} from 'react';
import Sound from 'react-native-sound';
import {AudioMode} from '../types/game';

Sound.setCategory('Playback');

type SoundName = 'tap' | 'correct' | 'wrong' | 'levelup' | 'star';

const SOUNDS: {name: SoundName; file: string; volume: number}[] = [
  {name: 'tap', file: 'tap.wav', volume: 0.5},
  {name: 'correct', file: 'correct.wav', volume: 0.7},
  {name: 'wrong', file: 'wrong.wav', volume: 0.5},
  {name: 'levelup', file: 'levelup.wav', volume: 0.8},
  {name: 'star', file: 'star.wav', volume: 0.6},
];

export function useSound(audioMode: AudioMode = 'full') {
  const loaded = useRef<Map<SoundName, Sound>>(new Map());
  const [ready, setReady] = useState(false);
  const audioModeRef = useRef(audioMode);
  audioModeRef.current = audioMode;

  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;

    for (const {name, file, volume} of SOUNDS) {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.warn(`[Sound] Failed to load ${file}:`, error);
        } else {
          sound.setVolume(volume);
          if (mounted) {
            loaded.current.set(name, sound);
          }
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
    if (audioModeRef.current === 'mute') return;
    const sound = loaded.current.get(name);
    if (!sound) return;
    sound.stop(() => {
      sound.setCurrentTime(0);
      sound.play(success => {
        if (!success) {
          sound.reset();
        }
      });
    });
  }, []);

  return {play, ready};
}
