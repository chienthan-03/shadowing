# Realtime TTS Controls Design

## Goal
Enable seamless, realtime updates to voice and speed while the text-to-speech (TTS) is actively reading.

## Architecture
Since the Web Speech API (`SpeechSynthesisUtterance`) doesn't support changing properties like `voice` or `rate` on an active utterance, we will implement a "Restart from Current Position" strategy.

1.  **State Management**: Use a `useRef` to track the current character index (`currentCharIndexRef`) during playback via the `onboundary` event.
2.  **Reactive Updates**: Use `useEffect` to watch for changes in `voice` or `speed`. If `isPlaying` is true, we will:
    *   Stop the current speech.
    *   Immediately start a new speech session starting from the last known `currentCharIndexRef`.
3.  **Seamless Transition**: By immediately calling `speak()` after `cancel()`, the transition feels near-instant to the user.

## Components & Hooks
*   `useShadowing` hook:
    *   `currentCharIndexRef`: Stores the last `charIndex` from the `onboundary` event.
    *   `handleStart(startIndex = 0)`: Modified to accept an optional starting point.
    *   `useEffect([voice, speed])`: Triggers a restart if `isPlaying` is true.

## Error Handling
*   Ensure `onend` correctly resets state even after multiple restarts.
*   Handle edge cases where `charIndex` might be at the very end of the text.
