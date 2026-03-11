// Tuned for Google TTS at rate=1 (~150 WPM average)
export const MS_PER_CHAR_BASE = 58;
// Network latency before Google voice starts producing audio
export const REMOTE_VOICE_INIT_DELAY = 350;
// Extra pause after sentence-ending punctuation (. ! ? …) at rate=1
export const PAUSE_SENTENCE = 420;
// Extra pause after clause-breaking punctuation (, ; :) at rate=1
export const PAUSE_CLAUSE = 200;
