/**
 * Every line the app speaks by id must exist — in the script and as a clip
 * in all three languages, on both platforms. The voice loader skips a
 * missing clip silently, so without this a world greeting or a sticker
 * name can go quiet with nothing failing. That is how High Five, Hungry
 * Monsters and Number Town shipped without a greeting.
 */
// Jest runs on Node; the project has no @types/node, so declare the two
// Node globals this file uses.
declare function require(id: string): any;
declare const __dirname: string;
const fs = require('fs');
const path = require('path');

import {VOICE_SCRIPT} from '../src/voice/script';
import {ADVENTURE_WORLDS, WORLD_VOICE_IDS} from '../src/config/adventureWorlds';
import {ALL_STICKERS, stickerVoiceId} from '../src/utils/rewardData';

const ROOT = path.resolve(__dirname, '..');
const LANGS = ['ro', 'en', 'de'] as const;
const SCRIPT_IDS = new Set(VOICE_SCRIPT.map(e => e.id));

function missingClips(id: string): string[] {
  const missing: string[] = [];
  for (const lang of LANGS) {
    const file = `voice_${lang}_${id}.mp3`;
    if (!fs.existsSync(path.join(ROOT, 'assets/audio', file))) {
      missing.push(`assets/audio/${file}`);
    }
    if (!fs.existsSync(path.join(ROOT, 'android/app/src/main/res/raw', file))) {
      missing.push(`res/raw/${file}`);
    }
  }
  return missing;
}

function expectSpoken(ids: string[]) {
  const notInScript = ids.filter(id => !SCRIPT_IDS.has(id));
  expect(notInScript).toEqual([]);
  expect(ids.flatMap(missingClips)).toEqual([]);
}

describe('voice coverage', () => {
  it('greets the child in every Adventure world', () => {
    expectSpoken(ADVENTURE_WORLDS.map(w => WORLD_VOICE_IDS[w.id]));
  });

  it('gives every sticker a spoken name', () => {
    expectSpoken(ALL_STICKERS.map(stickerVoiceId));
  });

  it('can ask for a parent at a crowned level', () => {
    expectSpoken(['ask_parent']);
  });

  it('writes every script entry in all three languages', () => {
    const incomplete = VOICE_SCRIPT.filter(e => !e.ro || !e.en || !e.de).map(e => e.id);
    expect(incomplete).toEqual([]);
  });
});
