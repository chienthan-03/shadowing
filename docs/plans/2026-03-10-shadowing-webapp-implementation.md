# Shadowing Webapp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a webapp for shadowing practice with high-quality TTS and synchronized word highlighting using Next.js, TailwindCSS, and ShadcnUI.

**Architecture:** A single-page application (SPA) built with Next.js App Router. It uses the Web Speech API for Text-to-Speech (TTS) and precise word-level highlighting through the `onboundary` event.

**Tech Stack:** Next.js, TailwindCSS, ShadcnUI, Lucide React (icons), Web Speech API.

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Initialize the project with Next.js and TailwindCSS**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"`
Expected: PASS

**Step 2: Install ShadcnUI and required components**

Run: `npx shadcn-ui@latest init`
Run: `npx shadcn-ui@latest add button textarea slider select card label`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "chore: initialize project with nextjs, tailwind, and shadcnui"
```

---

### Task 2: Implement Shadowing Logic Hook

**Files:**
- Create: `hooks/use-shadowing.ts`

**Step 1: Write the hook with basic TTS functionality**

```typescript
import { useState, useRef, useEffect } from 'react';

export const useShadowing = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      setVoice(defaultVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleStart = () => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = speed;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const words = text.substring(0, charIndex).trim().split(/\s+/);
        setCurrentWordIndex(words.length === 1 && words[0] === '' ? 0 : words.length);
      }
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
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
    setCurrentWordIndex(-1);
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
```

**Step 2: Commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "feat: add useShadowing hook for TTS logic"
```

---

### Task 3: Build the UI Components

**Files:**
- Modify: `app/page.tsx`

**Step 1: Implement the main dashboard UI**

```tsx
'use client';

import { useShadowing } from '@/hooks/use-shadowing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

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

  const words = text.split(/\s+/);

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
              className="min-h-[200px] mb-4"
            />
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Voice</Label>
                <Select
                  value={voice?.name}
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
                  onValueChange={([val]) => setSpeed(val)}
                />
              </div>
              <Button onClick={handleStart} disabled={!text || isPlaying}>
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
                <Button variant="outline" onClick={handlePauseResume}>
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
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement main shadowing dashboard UI"
```

---

### Task 4: Final Polish and Testing

**Step 1: Test the application**

- Open the app in the browser.
- Enter a text in English and Vietnamese.
- Select different voices and speeds.
- Verify that the word highlighting is synchronized with the speech.
- Test Play, Pause, Resume, and Stop functionality.

**Step 2: Commit**

```bash
git commit -m "docs: update readme and final polish"
```
