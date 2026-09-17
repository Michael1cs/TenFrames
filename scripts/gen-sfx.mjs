#!/usr/bin/env node
/**
 * Sound-effect candidates via ElevenLabs Sound Generation.
 *
 * The app's five UI sounds (tap / correct / wrong / star / levelup) were
 * generic synth blips. This writes a few candidates per sound to design/sfx/
 * so a human can audition them; the chosen ones are then converted to WAV
 * over ios/TenFrames/<id>.wav and android/app/src/main/res/raw/<id>.wav
 * (same names, so no project changes).
 *
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-sfx.mjs [--ids=tap,star] [--variants=2]
 *
 * Sonic identity: warm, soft, toy-like — wood, glockenspiel, celesta. Never
 * arcade buzzers; 'wrong' must sound kind (this app never scolds).
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('ELEVENLABS_API_KEY missing');
  process.exit(1);
}

const SFX = [
  {id: 'tap', seconds: 0.5, prompt: 'A single very short soft toy pop, like a smooth wooden bead dropping into a felt-lined tray. Warm, gentle, dry, no reverb, no music. One hit only, then silence.'},
  {id: 'correct', seconds: 1.0, prompt: 'A short bright happy chime of two ascending notes played on a toy glockenspiel, warm and friendly, for a young children\'s learning app. Clean, no reverb tail, no voices.'},
  {id: 'wrong', seconds: 0.8, prompt: 'A gentle, soft, low two-note "hmm" played on a wooden xylophone, kind and encouraging, like a friendly shrug. Not harsh, no buzzer, no alarm, quiet.'},
  {id: 'star', seconds: 0.8, prompt: 'A quick magical sparkle: a short light upward glissando on a celesta with a tiny shimmer, airy and delicate, for collecting a star in a children\'s game.'},
  {id: 'levelup', seconds: 1.6, prompt: 'A short joyful fanfare of four rising notes on a toy trumpet doubled by a glockenspiel, ending with a small sparkle shimmer. Cheerful and warm, for finishing a level in a young children\'s game. No crowd, no voices.'},
];

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const wanted = args.ids ? String(args.ids).split(',') : SFX.map(s => s.id);
const variants = Number(args.variants ?? 2);
const outDir = path.resolve('design/sfx');
fs.mkdirSync(outDir, {recursive: true});

let ok = 0, errors = 0;
for (const sfx of SFX.filter(s => wanted.includes(s.id))) {
  for (let v = 1; v <= variants; v++) {
    const out = path.join(outDir, `${sfx.id}_${v}.mp3`);
    process.stdout.write(`${sfx.id} v${v}: `);
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          text: sfx.prompt,
          duration_seconds: sfx.seconds,
          prompt_influence: 0.6,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${(fs.statSync(out).size / 1024).toFixed(1)}KB`);
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      errors++;
    }
  }
}
console.log(`\nDone. Generated: ${ok}, errors: ${errors}. Listen in ${outDir}`);
