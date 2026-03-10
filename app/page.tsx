'use client';

import { useShadowing } from '@/hooks/use-shadowing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square } from 'lucide-react';

export default function ShadowingPage() {
  const {
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
            <Textarea
              placeholder="Enter your text here for shadowing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] max-h-[400px] overflow-y-auto mb-4"
            />
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Voice</Label>
                <Select
                  value={voice?.name || ''}
                  onValueChange={(name) => setVoice(voices.find(v => v.name === name) || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.name} value={v.name}>
                        {v.name} ({v.lang})
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
              <Button onClick={() => handleStart()} disabled={!text || isPlaying}>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            </div>
          </CardContent>
        </Card>

        {text && (
          <Card>
            <CardHeader>
              <CardTitle>Reader</CardTitle>
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
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handlePauseResume} disabled={!isPlaying && window.speechSynthesis.paused === false && currentWordIndex === -1}>
                  {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="destructive" onClick={handleStop}>
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
