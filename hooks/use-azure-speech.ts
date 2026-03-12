import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface AzureToken {
  token: string;
  region: string;
}

export const useAzureSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const tokenRef = useRef<AzureToken | null>(null);

  const fetchToken = async (): Promise<AzureToken> => {
    if (tokenRef.current) return tokenRef.current;

    const response = await fetch('/api/speech-token');
    if (!response.ok) throw new Error('Failed to fetch speech token');
    
    const data = await response.json();
    tokenRef.current = data;
    
    // Refresh token every 9 minutes (Azure tokens last 10)
    setTimeout(() => { tokenRef.current = null; }, 9 * 60 * 1000);
    
    return data;
  };

  const stopSpeak = useCallback(async () => {
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  const speak = useCallback(async (text: string, voiceName: string = 'en-US-AvaMultilingualNeural', rate: number = 1) => {
    try {
      await stopSpeak();
      const { token, region } = await fetchToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechSynthesisVoiceName = voiceName;
      
      const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
        }
        return c;
      });

      const escapedText = escapeXml(text);
      const ssmlPreamble = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voiceName}"><prosody rate="${rate}">`;
      const ssml = `${ssmlPreamble}${escapedText}</prosody></voice></speak>`;

      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
      synthesizerRef.current = synthesizer;

      synthesizer.wordBoundary = (s, e) => {
        // e.textOffset is the character offset in the SSML
        // We subtract the preamble length to get the offset in the text
        let effectiveOffset = e.textOffset - ssmlPreamble.length;
        if (effectiveOffset < 0) effectiveOffset = 0;
        
        // Use the escaped text to find the word index, as offsets match the escaped string
        const textBefore = escapedText.substring(0, effectiveOffset);
        const wordsBefore = textBefore.split(/\s+/).filter(w => w.length > 0);
        setCurrentWordIndex(wordsBefore.length);
      };

      setIsPlaying(true);
      
      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
          }
          synthesizer.close();
          synthesizerRef.current = null;
        },
        err => {
          console.error('Synthesis error:', err);
          setError(err);
          setIsPlaying(false);
          synthesizer.close();
          synthesizerRef.current = null;
        }
      );
    } catch (err: any) {
      setError(err.message);
      setIsPlaying(false);
    }
  }, [stopSpeak]);

  const startListening = useCallback(async () => {
    try {
      const { token, region } = await fetchToken();
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      recognizer.recognizing = (s, e) => {
        setInterimText(e.result.text);
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          setRecognizedText(prev => prev + ' ' + e.result.text);
          setInterimText('');
        }
      };

      recognizer.startContinuousRecognitionAsync(
        () => setIsListening(true),
        err => {
          console.error('Recognition start error:', err);
          setError('Microphone access denied or connection error');
          setIsListening(false);
        }
      );
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          recognizerRef.current?.close();
          recognizerRef.current = null;
          setIsListening(false);
        },
        err => {
          console.error('Stop recognition error:', err);
          setIsListening(false);
        }
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeak();
      stopListening();
    };
  }, [stopSpeak, stopListening]);

  return {
    isListening,
    recognizedText,
    interimText,
    isPlaying,
    currentWordIndex,
    error,
    speak,
    stopSpeak,
    startListening,
    stopListening,
    setRecognizedText,
  };
};
