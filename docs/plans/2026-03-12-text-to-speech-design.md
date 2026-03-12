# Design Doc: Integrate react-text-to-speech

**Date:** 2026-03-12
**Topic:** Text-to-Speech Integration
**Status:** Approved

## Summary
Replace the current custom Web Speech API implementation in `use-shadowing.ts` with the `react-text-to-speech` library. This will improve stability for long texts, handle browser inconsistencies, and simplify the codebase.

## Architecture
- **Hook-based Integration:** Refactor `use-shadowing.ts` to wrap the `useSpeech` hook from `react-text-to-speech`.
- **State Management:** Map library states (`speechStatus`, `start`, `pause`, `stop`) to existing UI states to minimize changes in `app/page.tsx`.
- **Highlighting:** Use the library's built-in highlighting or `onBoundary` events to track `currentWordIndex`.

## Components
- `ShadowingPage` (`app/page.tsx`): Continues to consume the `useShadowing` hook.
- `useShadowing` (`hooks/use-shadowing.ts`): Internal implementation changes to use `react-text-to-speech`.

## Data Flow
1. User enters text and selects voice/speed.
2. `useShadowing` passes these values to `useSpeech`.
3. `useSpeech` handles audio synthesis and chunking.
4. `useShadowing` listens for boundary events or status changes to update the UI (highlighting, play/pause state).

## Testing
- Verify playback starts/pauses/stops correctly.
- Verify word highlighting syncs with audio.
- Verify voice and speed changes are applied.
- Test with long text (1000+ words) to ensure no cut-offs.
