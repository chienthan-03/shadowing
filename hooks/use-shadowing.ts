import { useState, useRef, useEffect } from 'react';

export const useShadowing = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentCharIndexRef = useRef(0);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      setVoice(defaultVoice || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      handleStart(currentCharIndexRef.current);
    }
  }, [voice, speed]);

  const handleStart = (startIndex = 0) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    
    const remainingText = text.substring(startIndex);
    const utterance = new SpeechSynthesisUtterance(remainingText);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = speed;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const absoluteCharIndex = startIndex + event.charIndex;
        currentCharIndexRef.current = absoluteCharIndex; // Store current position
        const wordsBefore = text.substring(0, absoluteCharIndex).trim().split(/\s+/);
        setCurrentWordIndex(wordsBefore.length === 1 && wordsBefore[0] === '' ? 0 : wordsBefore.length);
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      currentCharIndexRef.current = 0;
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePauseResume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(0);
    currentCharIndexRef.current = 0;
  };

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
    handleStart,
    handlePauseResume,
    handleStop,
  };
};
