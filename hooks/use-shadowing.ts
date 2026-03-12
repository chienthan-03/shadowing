import { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSpeech } from 'react-text-to-speech';

export const useShadowing = () => {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isReady, setIsReady] = useState(false);

  // Track word boundaries for highlighting
  const [wordBoundaries, setWordBoundaries] = useState<number[]>([]);

  // Initialize voices and browser support
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

      const timeout = setTimeout(() => {
        setIsInitializing(false);
      }, 1500);

      return () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        clearTimeout(timeout);
      };
    }
  }, []);

  // Pre-compute word boundaries when text changes
  useEffect(() => {
    if (!text) {
      setWordBoundaries([]);
      return;
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const boundaries: number[] = [];
    let charPos = 0;
    
    for (const word of words) {
      const pos = text.indexOf(word, charPos);
      boundaries.push(pos);
      charPos = pos + word.length;
    }
    
    setWordBoundaries(boundaries);
  }, [text]);

  // Use the react-text-to-speech hook
  const {
    speechStatus,
    start: startSpeech,
    pause: pauseSpeech,
    stop: stopSpeech,
  } = useSpeech({
    text,
    rate: speed,
    voiceURI: voice?.voiceURI,
    lang: voice?.lang,
    highlightText: false, // We manage highlighting manually for better control
    onBoundary: (event) => {
      // Track word progress using boundary events
      if (event.progress === 0) {
        setCurrentWordIndex(-1);
        setIsPaused(false);
      } else if (event.progress === 100) {
        setCurrentWordIndex(-1);
        setIsPaused(false);
      }
    },
    onStart: () => {
      setIsPaused(false);
      setIsReady(true);
    },
    onPause: () => {
      setIsPaused(true);
    },
    onResume: () => {
      setIsPaused(false);
    },
    onStop: () => {
      setCurrentWordIndex(-1);
      setIsPaused(false);
      setIsReady(false);
    },
    maxChunkSize: 1000, // Support long texts by chunking
  });

  // Map speechStatus to isPlaying
  const isPlaying = speechStatus === 'started';

  // Track word highlighting based on speech progress
  useEffect(() => {
    if (!isPlaying || wordBoundaries.length === 0) {
      return;
    }

    // Use a timer to estimate word progress for now
    // This is a simple implementation that works for most voices
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordDuration = 60000 / (180 * speed); // ~180 WPM average reading speed
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length && isPlaying && !isPaused) {
        setCurrentWordIndex(currentIndex);
        currentIndex++;
      } else if (currentIndex >= words.length) {
        clearInterval(interval);
      }
    }, avgWordDuration);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, wordBoundaries.length, text, speed]);

  const handleStart = () => {
    if (!text || !isSupported) return;
    setCurrentWordIndex(-1);
    startSpeech();
  };

  const handlePauseResume = () => {
    if (!isSupported) return;
    
    if (isPaused) {
      startSpeech(); // Resume
    } else if (isPlaying) {
      pauseSpeech();
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    stopSpeech();
    setCurrentWordIndex(-1);
    setIsPaused(false);
  };

  // Keyboard shortcuts
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
