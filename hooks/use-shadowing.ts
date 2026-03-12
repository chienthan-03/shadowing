import { buildWordTimings, isRemoteVoice } from '@/lib/timmingVoice';
import { useState, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export const useShadowing = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentCharIndexRef = useRef(0);

  // Timer-based highlight state (Google/remote voices only)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const virtualStartRef = useRef(0);  // Date.now() - elapsed_when_timer_started
  const pausedElapsedRef = useRef(0); // elapsed value captured at pause
  const wordTimingsRef = useRef<number[]>([]);
  const wordCharPositionsRef = useRef<number[]>([]);
  const usingTimerRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Start the interval-based word highlight ticker.
   * startElapsed: how many ms into the timing sequence we already are.
   */
  const runTimer = (startElapsed = 0) => {
    clearTimer();
    virtualStartRef.current = Date.now() - startElapsed;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - virtualStartRef.current;
      const timings = wordTimingsRef.current;

      let idx = -1;
      for (let i = 0; i < timings.length; i++) {
        if (elapsed >= timings[i]) idx = i;
        else break;
      }

      if (idx >= 0) {
        setCurrentWordIndex(idx);
        if (idx < wordCharPositionsRef.current.length) {
          currentCharIndexRef.current = wordCharPositionsRef.current[idx];
        }
      }

      // Auto-stop after all words are done
      if (timings.length > 0 && elapsed > timings[timings.length - 1] + 2000) {
        clearTimer();
      }
    }, 50);
  };

  useEffect(() => {
    const checkSupport = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setIsSupported(true);
        return true;
      }
      setIsSupported(false);
      setIsInitializing(false);
      return false;
    };

    const loadVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsInitializing(false);
        return;
      }
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      const defaultVoice = available.find(v => v.lang.startsWith('en')) ?? available[0] ?? null;
      setVoice(defaultVoice);
      
      if (available.length > 0) {
        setIsInitializing(false);
      }
    };

    if (checkSupport()) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      // Fallback in case onvoiceschanged never fires or voices list is empty
      const timeout = setTimeout(() => {
        setIsInitializing(false);
      }, 1500);

      return () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        clearTimeout(timeout);
        clearTimer();
      };
    }
  }, []);

  useEffect(() => {
    if (isPlaying) handleStart(currentCharIndexRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, speed]);

  const handleStart = (startIndex = 0) => {
    if (!text || !isSupported) return;
    clearTimer();

    const safeStart = typeof startIndex === 'number' && !isNaN(startIndex) ? startIndex : 0;
    window.speechSynthesis.cancel();
    setIsPaused(false);

    const words = text.split(/\s+/).filter(w => w.length > 0);

    // Pre-compute absolute char position for each word (needed for highlight + resume)
    const charPositions: number[] = [];
    let charPos = 0;
    for (const word of words) {
      const pos = text.indexOf(word, charPos);
      charPositions.push(pos);
      charPos = pos + word.length;
    }
    wordCharPositionsRef.current = charPositions;

    // Determine which word index we're resuming from
    let startWordIdx = 0;
    for (let i = 0; i < charPositions.length; i++) {
      if (charPositions[i] >= safeStart) {
        startWordIdx = i;
        break;
      }
      startWordIdx = i + 1;
    }
    if (startWordIdx >= words.length) startWordIdx = 0;

    const remainingText = text.substring(safeStart);
    const utterance = new SpeechSynthesisUtterance(remainingText);
    if (voice) utterance.voice = voice;
    utterance.rate = speed;

    const useTimer = isRemoteVoice(voice);
    usingTimerRef.current = useTimer;

    if (useTimer) {
      const timings = buildWordTimings(words, speed);
      wordTimingsRef.current = timings;

      // When audio starts, jump the timer cursor to the correct word position.
      // runTimer(timings[startWordIdx]) means elapsed = timings[startWordIdx] right now,
      // so word startWordIdx highlights immediately, then advances on schedule.
      utterance.onstart = () => {
        runTimer(timings[startWordIdx] ?? 0);
      };
    } else {
      // Native voices: use accurate onboundary events
      utterance.onboundary = (event) => {
        if (event.name !== 'word') return;

        const absoluteCharIdx = safeStart + event.charIndex;
        currentCharIndexRef.current = absoluteCharIdx;

        let foundIdx = -1;
        for (let i = 0; i < charPositions.length; i++) {
          if (charPositions[i] <= absoluteCharIdx) foundIdx = i;
        }
        if (foundIdx !== -1) setCurrentWordIndex(foundIdx);
      };
    }

    utterance.onend = () => {
      clearTimer();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      currentCharIndexRef.current = 0;
      pausedElapsedRef.current = 0;
    };

    utterance.onerror = (e) => {
      // 'interrupted' fires when cancel() is called intentionally — not an error
      if (e.error === 'interrupted') return;
      clearTimer();
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePauseResume = () => {
    if (!isSupported) return;
    
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      if (usingTimerRef.current) runTimer(pausedElapsedRef.current);
    } else {
      // Snapshot elapsed before stopping the timer
      pausedElapsedRef.current = Date.now() - virtualStartRef.current;
      clearTimer();
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    clearTimer();
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(0);
    currentCharIndexRef.current = 0;
    pausedElapsedRef.current = 0;
  };

  useHotkeys('shift+enter', () => {
    if (text && !isPlaying) handleStart();
  }, { enableOnFormTags: false });

  useHotkeys('shift+space', () => {
    handlePauseResume();
  }, { enableOnFormTags: false });

  useHotkeys('shift+w', () => {
    handleStop();
  }, { enableOnFormTags: false });

  return {
    text,
    setText,
    isPlaying,
    currentWordIndex,
    speed,
    setSpeed,
    voice,
    setVoice,
    voices,
    isSupported,
    isInitializing,
    isPaused,
    handleStart,
    handlePauseResume,
    handleStop,
  };
};
