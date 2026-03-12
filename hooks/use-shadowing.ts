import { useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAzureSpeech } from './use-azure-speech';

export const useShadowing = () => {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<string>('en-US-AvaMultilingualNeural');
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  const {
    isPlaying,
    isListening,
    recognizedText,
    interimText,
    speak,
    stopSpeak,
    startListening,
    stopListening,
    currentWordIndex: azureCurrentWordIndex,
    setRecognizedText,
    error: azureError,
  } = useAzureSpeech();

  // Handle word index updates from Azure
  useEffect(() => {
    setCurrentWordIndex(azureCurrentWordIndex);
  }, [azureCurrentWordIndex]);

  // Pre-compute word boundaries when text changes - unused for now but kept for reference
  // const [wordBoundaries, setWordBoundaries] = useState<number[]>([]);

  // useEffect(() => {
  //   if (!text) {
  //     setWordBoundaries([]);
  //     return;
  //   }

  //   const words = text.split(/\s+/).filter(w => w.length > 0);
  //   const boundaries: number[] = [];
  //   let charPos = 0;
  //   
  //   for (const word of words) {
  //     const pos = text.indexOf(word, charPos);
  //     boundaries.push(pos);
  //     charPos = pos + word.length;
  //   }
  //   
  //   setWordBoundaries(boundaries);
  // }, [text]);

  const handleStart = useCallback(() => {
    if (!text) return;
    setCurrentWordIndex(-1);
    speak(text, voice, speed);
  }, [text, voice, speed, speak]);

  const handleStop = useCallback(() => {
    stopSpeak();
    setCurrentWordIndex(-1);
  }, [stopSpeak]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Keyboard shortcuts
  useHotkeys('shift+enter', () => {
    if (text && !isPlaying) handleStart();
  }, { enableOnFormTags: false });

  useHotkeys('shift+w', () => {
    handleStop();
  }, { enableOnFormTags: false });

  return {
    text,
    setText,
    isPlaying,
    isListening,
    recognizedText,
    interimText,
    currentWordIndex,
    speed,
    setSpeed,
    voice,
    setVoice,
    isSupported: true, // Azure SDK is supported in most modern browsers
    isInitializing,
    handleStart,
    handleStop,
    handleToggleListening,
    setRecognizedText,
    error: azureError,
  };
};
