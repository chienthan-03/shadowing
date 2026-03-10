# Keyboard Shortcuts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add keyboard shortcuts (Shift+Enter, Shift+Space, Shift+W) to control the shadowing application using `react-hotkeys-hook`.

**Architecture:** Integrate `react-hotkeys-hook` into the `useShadowing` hook to trigger existing handlers, ensuring shortcuts are disabled while typing in the textarea.

**Tech Stack:** React, Next.js, `react-hotkeys-hook`.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install `react-hotkeys-hook`**

Run: `npm install react-hotkeys-hook`
Expected: Package added to `dependencies`.

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add react-hotkeys-hook dependency"
```

---

### Task 2: Implement Shortcuts in `useShadowing` Hook

**Files:**
- Modify: `hooks/use-shadowing.ts`

**Step 1: Import and use `useHotkeys`**

```typescript
import { useHotkeys } from 'react-hotkeys-hook';

// Inside useShadowing hook:
useHotkeys('shift+enter', () => {
  if (text && !isPlaying) handleStart();
}, { enableOnFormTags: false });

useHotkeys('shift+space', () => {
  handlePauseResume();
}, { enableOnFormTags: false });

useHotkeys('shift+w', () => {
  handleStop();
}, { enableOnFormTags: false });
```

**Step 2: Verify logic**
Ensure `enableOnFormTags: false` is set to ignore shortcuts when the user is typing in the `Textarea`.

**Step 3: Commit**

```bash
git add hooks/use-shadowing.ts
git commit -m "feat: implement keyboard shortcuts in useShadowing hook"
```

---

### Task 3: Update UI with Shortcut Hints

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update button labels**

```tsx
// Start Button
<Button onClick={() => handleStart()} disabled={!text || isPlaying}>
  <Play className="mr-2 h-4 w-4" /> Start (Shift+Enter)
</Button>

// Pause/Resume Button
<Button variant="outline" onClick={handlePauseResume} ...>
  {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
  {isPlaying ? 'Pause (Shift+Space)' : 'Resume (Shift+Space)'}
</Button>

// Stop Button
<Button variant="destructive" onClick={handleStop}>
  <Square className="mr-2 h-4 w-4" /> Stop (Shift+W)
</Button>
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "ui: add keyboard shortcut hints to control buttons"
```
