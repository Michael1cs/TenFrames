/**
 * Bilingual voice script for ElevenLabs generation.
 *
 * Each entry produces 2 audio files: assets/audio/{ro,en}/{id}.mp3
 * Run scripts/gen-voice.mjs with ELEVENLABS_API_KEY to batch-generate.
 *
 * Structure: flat dictionary of { id: {ro, en} } so file naming is consistent.
 */

export interface VoiceEntry {
  id: string;
  ro: string;
  en: string;
  // Optional ElevenLabs voice override per entry; otherwise default per language.
  voiceId?: string;
}

export const VOICE_SCRIPT: VoiceEntry[] = [
  // ── Numbers 0-10 (rostite clar, copilul aude când umple celulele) ──
  {id: 'num_0', ro: 'zero', en: 'zero'},
  {id: 'num_1', ro: 'unu', en: 'one'},
  {id: 'num_2', ro: 'doi', en: 'two'},
  {id: 'num_3', ro: 'trei', en: 'three'},
  {id: 'num_4', ro: 'patru', en: 'four'},
  {id: 'num_5', ro: 'cinci', en: 'five'},
  {id: 'num_6', ro: 'șase', en: 'six'},
  {id: 'num_7', ro: 'șapte', en: 'seven'},
  {id: 'num_8', ro: 'opt', en: 'eight'},
  {id: 'num_9', ro: 'nouă', en: 'nine'},
  {id: 'num_10', ro: 'zece', en: 'ten'},

  // ── Numărare ritmică ──
  {id: 'count_to_5', ro: 'unu, doi, trei, patru, cinci!', en: 'one, two, three, four, five!'},
  {id: 'count_to_10', ro: 'unu, doi, trei, patru, cinci, șase, șapte, opt, nouă, zece!', en: 'one, two, three, four, five, six, seven, eight, nine, ten!'},

  // ── Instrucțiuni per mod (kid-friendly, foarte scurte) ──
  {id: 'instr_counting', ro: 'Apasă căsuțele și numără bilele!', en: 'Tap the boxes and count the dots!'},
  {id: 'instr_addition_easy', ro: 'Mai pune câteva bile!', en: 'Add a few more dots!'},
  {id: 'instr_addition', ro: 'Câte bile sunt în total?', en: 'How many dots in total?'},
  {id: 'instr_subtraction_easy', ro: 'Apasă pe bile să le iei!', en: 'Tap the dots to take them away!'},
  {id: 'instr_subtraction', ro: 'Câte bile rămân?', en: 'How many dots are left?'},
  {id: 'instr_puzzle', ro: 'Câte bile mai trebuie până la zece?', en: 'How many more dots to reach ten?'},

  // ── Feedback corect (8 variante, jucate aleator) ──
  {id: 'fb_correct_1', ro: 'Bravo!', en: 'Yes!'},
  {id: 'fb_correct_2', ro: 'Așa e!', en: "That's right!"},
  {id: 'fb_correct_3', ro: 'Super!', en: 'Awesome!'},
  {id: 'fb_correct_4', ro: 'Foarte bine!', en: 'Very good!'},
  {id: 'fb_correct_5', ro: 'Excelent!', en: 'Excellent!'},
  {id: 'fb_correct_6', ro: 'Genial!', en: 'Great!'},
  {id: 'fb_correct_7', ro: 'Hopa, ce repede!', en: 'Wow, so fast!'},
  {id: 'fb_correct_8', ro: 'Da! Așa!', en: 'Yes! Like that!'},

  // ── Feedback încearcă din nou (5 variante, fără cuvântul „greșit") ──
  {id: 'fb_again_1', ro: 'Aproape!', en: 'Almost!'},
  {id: 'fb_again_2', ro: 'Mai încearcă!', en: 'Try again!'},
  {id: 'fb_again_3', ro: 'Hai, poți!', en: 'Come on, you can!'},
  {id: 'fb_again_4', ro: 'Aproape acolo!', en: 'Almost there!'},
  {id: 'fb_again_5', ro: 'Încă o dată!', en: 'One more time!'},

  // ── Mascotă Zee (intro, reacții, încurajare) ──
  {id: 'zee_greeting', ro: 'Salut! Eu sunt Zee. Hai să ne jucăm cu numerele!', en: "Hi! I'm Zee. Let's play with numbers!"},
  {id: 'zee_cheer', ro: 'Hopa, ce bine ai făcut!', en: 'Wow, you did so well!'},
  {id: 'zee_encourage', ro: 'Te descurci de minune!', en: "You're doing amazing!"},
  {id: 'zee_thinking', ro: 'Hmm, gândește-te puțin...', en: 'Hmm, think for a moment...'},
  {id: 'zee_surprised', ro: 'Oho! Uite ce ai găsit!', en: 'Oho! Look what you found!'},
  {id: 'zee_wave_bye', ro: 'Pa-pa! Ne vedem curând!', en: 'Bye-bye! See you soon!'},

  // ── Onboarding helpers (auto-play la young) ──
  {id: 'welcome', ro: 'Bun venit la Matematica cu Zâmbete!', en: 'Welcome to Math with Smiles!'},
  {id: 'ask_age', ro: 'Câți ani ai?', en: 'How old are you?'},
  {id: 'ask_theme', ro: 'Alege tema preferată!', en: 'Choose your favorite theme!'},

  // ── Intro mini-povești per lume Adventure (~6 sec fiecare) ──
  {id: 'world_counting', ro: 'În Lunca Numerelor numărăm bilele magice. Hai să găsim toate!', en: 'In Counting Meadow we count magic dots. Let\'s find them all!'},
  {id: 'world_addition', ro: 'Pe Insula Adunării punem comori în cufăr. Câte sunt împreună?', en: 'On Addition Island we put treasures in the chest. How many together?'},
  {id: 'world_subtraction', ro: 'Pe Muntele Scăderii eliberăm păsările. Câte rămân?', en: 'On Subtraction Mountain we set birds free. How many are left?'},

  // ── Recompense (achievements, stickers, level complete) ──
  {id: 'reward_sticker', ro: 'Ai un sticker nou!', en: 'You got a new sticker!'},
  {id: 'reward_achievement', ro: 'Realizare nouă deblocată!', en: 'New achievement unlocked!'},
  {id: 'reward_level_perfect', ro: 'Perfect! Trei stele!', en: 'Perfect! Three stars!'},
  {id: 'reward_level_great', ro: 'Foarte bine! Două stele!', en: 'Great job! Two stars!'},
  {id: 'reward_level_good', ro: 'Bravo! O stea câștigată!', en: 'Well done! One star earned!'},
  {id: 'reward_streak', ro: 'Joci de mai multe zile la rând! Bravo!', en: "You're playing many days in a row! Awesome!"},
  {id: 'reward_milestone_10', ro: 'Zece stele! Ești pe drumul cel bun!', en: 'Ten stars! You\'re on the right path!'},
  {id: 'reward_milestone_25', ro: 'Douăzeci și cinci de stele! Continuă așa!', en: 'Twenty-five stars! Keep it up!'},
  {id: 'reward_milestone_50', ro: 'Cincizeci de stele! Ești incredibil!', en: 'Fifty stars! You\'re amazing!'},
  {id: 'reward_milestone_100', ro: 'O sută de stele! Ești campion!', en: 'A hundred stars! You\'re a champion!'},
];

export type VoiceId = (typeof VOICE_SCRIPT)[number]['id'];

export const VOICE_BY_ID: Record<string, VoiceEntry> = Object.fromEntries(
  VOICE_SCRIPT.map(e => [e.id, e]),
);
