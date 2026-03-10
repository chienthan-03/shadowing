# Realtime TTS Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable seamless, realtime updates to voice and speed while the text-to-speech (TTS) is actively reading.

**Architecture:** Use a "Restart from Current Position" strategy by tracking the current character index during playback and restarting the utterance with new settings when they change.

**Tech Stack:** React, Web Speech API (SpeechSynthesis).

---

### Task 1: Add current character index tracking

**Files:**
- Modify: `hooks/use-shadowing.ts`

**Step 1: Add `currentCharIndexRef` and update `onboundary`**

```typescript
// hooks/use-shadowing.ts
// ... existing imports ...
const currentCharIndexRef = useRef(0);

// Inside handleStart's utterance.onboundary:
utterance.onboundary = (event) => {
  if (event.name === 'word') {
    currentCharIndexRef.current = event.charIndex; // Store current position
    // ... existing word index logic ...
  }
};
```

**Step 2: Commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "feat: track current character index during TTS playback"
```

---

### Task 2: Refactor `handleStart` to support starting from an index

**Files:**
- Modify: `hooks/use-shadowing.ts`

**Step 1: Update `handleStart` signature and text slicing**

```typescript
// hooks/use-shadowing.ts
const handleStart = (startIndex = 0) => {
  if (!text) return;
  window.speechSynthesis.cancel();
  
  const remainingText = text.substring(startIndex);
  const utterance = new SpeechSynthesisUtterance(remainingText);
  // ... apply voice, speed, and onboundary/onend listeners ...
  // Note: Adjust onboundary's charIndex calculation to account for startIndex
};
```

**Step 2: Commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "refactor: allow handleStart to begin from a specific index"
```

---

### Task 3: Implement reactive updates for voice and speed

**Files:**
- Modify: `hooks/use-shadowing.ts`

**Step 1: Add `useEffect` to watch for `voice` and `speed` changes**

```typescript
// hooks/use-shadowing.ts
useEffect(() => {
  if (isPlaying) {
    handleStart(currentCharIndexRef.current);
  }
}, [voice, speed]);
```

**Step 2: Remove old speed-only effect**

```typescript
// Remove this:
// useEffect(() => {
//   if (utteranceRef.current) {
//     utteranceRef.current.rate = speed;
//   }
// }, [speed]);
```

**Step 3: Commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "feat: implement reactive restart on voice or speed change"
```

---

### Task 4: Final verification and cleanup

**Files:**
- Modify: `hooks/use-shadowing.ts`

**Step 1: Ensure `handleStop` and `onend` reset `currentCharIndexRef`**

```typescript
// hooks/use-shadowing.ts
const handleStop = () => {
  window.speechSynthesis.cancel();
  setIsPlaying(false);
  setCurrentWordIndex(0);
  currentCharIndexRef.current = 0; // Reset position
};
```

**Step 2: Verify logic and commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "fix: reset character index on stop/end"
```
