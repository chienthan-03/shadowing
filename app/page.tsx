'use client';

import { useShadowing } from '@/hooks/use-shadowing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Play, Square, Mic, MicOff, Trash2 } from 'lucide-react';

const AZURE_VOICES = [
  { name: 'Ava (Multilingual)', value: 'en-US-AvaMultilingualNeural' },
  { name: 'Andrew (Multilingual)', value: 'en-US-AndrewMultilingualNeural' },
  { name: 'Emma (Multilingual)', value: 'en-US-EmmaMultilingualNeural' },
  { name: 'Brian (Multilingual)', value: 'en-US-BrianMultilingualNeural' },
];

export default function ShadowingPage() {
  const {
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
    handleStart,
    handleStop,
    handleToggleListening,
    setRecognizedText,
    isSupported,
    isInitializing,
    error,
  } = useShadowing();

  const words = text.split(/\s+/).filter(w => w.length > 0);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Shadowing Webapp</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                {error}
              </div>
            )}
            <Textarea
              placeholder="Enter your text here for shadowing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] max-h-[400px] overflow-y-auto mb-4"
            />
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Azure Voice</Label>
                <Select
                  value={voice}
                  onValueChange={(val) => setVoice(val ?? '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {AZURE_VOICES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Label>Speed: {speed}x</Label>
                <Slider
                  value={[speed]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(val) => setSpeed(Array.isArray(val) ? val[0] : val)}
                />
              </div>
              <div className="flex gap-2">
                {!isPlaying ? (
                  <Button onClick={handleStart} disabled={!text}>
                    <Play className="mr-2 h-4 w-4" /> Start
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStop}>
                    <Square className="mr-2 h-4 w-4" /> Stop
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {text && (
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between items-center">
                  <span>Reader {currentWordIndex + 1} / {words.length}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant={isListening ? "destructive" : "default"} 
                      onClick={handleToggleListening}
                    >
                      {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                      {isListening ? 'Stop Shadowing' : 'Start Shadowing'}
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl leading-relaxed p-4 bg-muted rounded-lg mb-4">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block mr-1 px-1 rounded transition-colors ${
                      index === currentWordIndex
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>

              {(recognizedText || interimText) && (
                <div className="mt-4 p-4 border rounded-lg bg-background">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-muted-foreground">Shadowing Transcript</Label>
                    <Button variant="ghost" size="sm" onClick={() => setRecognizedText('')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-lg italic">
                    {recognizedText}
                    <span className="text-muted-foreground">{interimText}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
