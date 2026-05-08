#!/usr/bin/env node
// Batch generator for voice clips via ElevenLabs API.
//
// Usage:
//   ELEVENLABS_API_KEY=sk_xxx node scripts/gen-voice.mjs [opts]
// Options:
//   --lang=ro|en|both       (default: both)
//   --force                  re-generate even if file exists
//   --sample                 generate a curated 10-entry diverse subset (QA pass)
//   --limit=N                generate first N entries from VOICE_SCRIPT
//   --ids=id1,id2,id3        generate only these exact IDs
//
// Output: assets/audio/voice_{lang}_{id}.mp3 — flat namespace so
//   react-native-asset can link without subfolder gymnastics.
//
// After generation, run:
//   npx react-native-asset && cd ios && pod install && cd ..
//
// Voice IDs (ElevenLabs default voices):
//   - Charlotte (RO-friendly, female, warm)
//   - Bella (EN, child-friendly, female)
// Override via VOICE_ID_RO / VOICE_ID_EN env vars.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'audio');
const SCRIPT_TS = path.join(ROOT, 'src', 'voice', 'script.ts');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY env var.');
  console.error('Get one at https://elevenlabs.io/ → Profile → API Keys');
  process.exit(1);
}

const VOICE_ID_RO = process.env.VOICE_ID_RO || 'XB0fDUnXU5powFXDhCwa'; // Charlotte
const VOICE_ID_EN = process.env.VOICE_ID_EN || 'EXAVITQu4vr4xnSDxMaL'; // Bella
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

const args = new Set(process.argv.slice(2));
const lang = [...args].find(a => a.startsWith('--lang='))?.split('=')[1] || 'both';
const force = args.has('--force');
const sample = args.has('--sample');
const limitArg = [...args].find(a => a.startsWith('--limit='))?.split('=')[1];
const idsArg = [...args].find(a => a.startsWith('--ids='))?.split('=')[1];
const langs = lang === 'both' ? ['ro', 'en'] : [lang];

// Curated 10-entry diverse subset for quality QA pass.
// Covers: short words with diacritics, longer numbers, exclamations,
// gentle phrases, and full mascot narration.
const SAMPLE_IDS = [
  'num_3',           // RO: "trei" — clear short
  'num_5',           // RO: "cinci" — diacritic-free
  'num_8',           // RO: "opt" — shortest
  'num_9',           // RO: "nouă" — diacritic ă
  'count_to_5',      // exclamation in sequence
  'fb_correct_3',    // "Super!" — energetic
  'fb_again_2',      // "Mai încearcă!" — diacritic î + ă, gentle
  'zee_greeting',    // longest narration
  'world_counting',  // story-style with "Lunca Numerelor"
  'instr_addition_easy', // imperative, short
];

// Parse VOICE_SCRIPT array literal from src/voice/script.ts
const scriptSrc = fs.readFileSync(SCRIPT_TS, 'utf8');
const arrMatch = scriptSrc.match(/VOICE_SCRIPT:\s*VoiceEntry\[\]\s*=\s*\[([\s\S]*?)\n\];/);
if (!arrMatch) {
  console.error('Could not parse VOICE_SCRIPT from script.ts');
  process.exit(1);
}
const entries = [];
const entryRe = /\{\s*id:\s*'([^']+)'\s*,\s*ro:\s*(?:'([^']*(?:\\.[^']*)*)'|"([^"]*(?:\\.[^"]*)*)")\s*,\s*en:\s*(?:'([^']*(?:\\.[^']*)*)'|"([^"]*(?:\\.[^"]*)*)")/g;
let m;
while ((m = entryRe.exec(arrMatch[1])) !== null) {
  const ro = (m[2] ?? m[3] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
  const en = (m[4] ?? m[5] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
  entries.push({id: m[1], ro, en});
}
// Apply selection filters
let selectedEntries = entries;
if (idsArg) {
  const wantedIds = new Set(idsArg.split(','));
  selectedEntries = entries.filter(e => wantedIds.has(e.id));
} else if (sample) {
  const wantedIds = new Set(SAMPLE_IDS);
  selectedEntries = entries.filter(e => wantedIds.has(e.id));
} else if (limitArg) {
  selectedEntries = entries.slice(0, parseInt(limitArg, 10));
}

console.log(`Parsed ${entries.length} entries; will generate ${selectedEntries.length} per language (${langs.join(', ')}).`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, {recursive: true});

async function tts(voiceId, text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {stability: 0.55, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true},
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateAll() {
  let total = 0, skipped = 0, errors = 0;
  for (const language of langs) {
    const voiceId = language === 'ro' ? VOICE_ID_RO : VOICE_ID_EN;
    for (const entry of selectedEntries) {
      const text = entry[language];
      const filename = `voice_${language}_${entry.id}.mp3`;
      const outPath = path.join(OUT_DIR, filename);
      if (!force && fs.existsSync(outPath)) {
        skipped++;
        continue;
      }
      try {
        process.stdout.write(`[${language}] ${entry.id}: ${text.slice(0, 50)}... `);
        const buf = await tts(voiceId, text);
        fs.writeFileSync(outPath, buf);
        console.log(`✓ ${(buf.length / 1024).toFixed(1)}KB`);
        total++;
        // Politeness rate-limit
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        console.error(`✗ ${e.message}`);
        errors++;
      }
    }
  }
  console.log(`\nDone. Generated: ${total}, skipped: ${skipped}, errors: ${errors}`);
  console.log('\nNext steps:');
  console.log('  npx react-native-asset && cd ios && pod install && cd ..');
}

generateAll().catch(e => {
  console.error(e);
  process.exit(1);
});
