import { useState, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, speed]);

  const handleStart = (startIndex = 0) => {
    if (!text) return;
    const safeStartIndex = typeof startIndex === 'number' && !isNaN(startIndex) ? startIndex : 0;
    window.speechSynthesis.cancel();
    
    const remainingText = text.substring(safeStartIndex);
    const utterance = new SpeechSynthesisUtterance(remainingText);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = speed;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const absoluteCharIndex = safeStartIndex + event.charIndex;
        currentCharIndexRef.current = absoluteCharIndex;
        
        const allWords = text.split(/\s+/).filter(w => w.length > 0);
        let foundIndex = -1;
        let currentPos = 0;
        
        for (let i = 0; i < allWords.length; i++) {
          const wordStart = text.indexOf(allWords[i], currentPos);
          if (wordStart !== -1) {
            if (absoluteCharIndex >= wordStart) {
              foundIndex = i;
            }
            currentPos = wordStart + allWords[i].length;
          }
        }
        
        if (foundIndex !== -1) {
          setCurrentWordIndex(foundIndex);
        }
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
    handleStart,
    handlePauseResume,
    handleStop,
  };
};
