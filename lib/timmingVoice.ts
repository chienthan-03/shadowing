import { MS_PER_CHAR_BASE, PAUSE_CLAUSE, PAUSE_SENTENCE, REMOTE_VOICE_INIT_DELAY } from "@/constants/timmingVoice";

export const isRemoteVoice = (v: SpeechSynthesisVoice | null): boolean =>
    v !== null && !v.localService;

const SENTENCE_ENDERS = new Set(['.', '!', '?', '…']);
const CLAUSE_ENDERS   = new Set([',', ';', ':']);

/** Returns the extra pause (ms at rate=1) based on the last punctuation of a word. */
const getPunctuationPause = (word: string): number => {
  const last = word.at(-1) ?? '';
  if (SENTENCE_ENDERS.has(last)) return PAUSE_SENTENCE;
  if (CLAUSE_ENDERS.has(last))   return PAUSE_CLAUSE;
  return 0;
};

/**
 * Pre-compute when each word should be highlighted.
 * Returns an array of timestamps (ms from speech start) indexed by word position.
 */
export const buildWordTimings = (words: string[], rate: number): number[] => {
  const timings: number[] = [];
  let t = REMOTE_VOICE_INIT_DELAY;
  for (const word of words) {
    timings.push(t);
    const speakDuration = Math.max(80, (word.length + 1) * MS_PER_CHAR_BASE);
    const punctPause    = getPunctuationPause(word);
    t += (speakDuration + punctPause) / rate;
  }
  return timings;
};