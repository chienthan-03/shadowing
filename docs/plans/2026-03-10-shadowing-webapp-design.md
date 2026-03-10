# Shadowing Webapp Design Document

**Date:** 2026-03-10
**Topic:** Shadowing Webapp with Next.js, TailwindCSS, and ShadcnUI

## 1. Overview
A web application designed to help users practice "shadowing" (repeating after a speaker) by providing high-quality Text-to-Speech (TTS) and synchronized word highlighting.

## 2. Architecture
- **Frontend:** Next.js (App Router)
- **Styling:** TailwindCSS + ShadcnUI
- **TTS Engine:** Web Speech API (for precise word-level highlighting and free usage)
- **State Management:** React Hooks (`useState`, `useRef`, `useEffect`)

## 3. Components
- `ShadowingContainer`: The main wrapper managing the app state.
- `TextInputSection`: Area for users to input or paste their text.
- `ReaderDisplay`: Renders the text with each word wrapped in a `<span>`. Highlights the current word based on the TTS progress.
- `Controls`: 
    - Play/Pause toggle.
    - Stop/Reset button.
    - Speed Slider (0.5x to 2.0x).
    - Voice/Language Selector (English & Vietnamese).

## 4. Data Flow & Logic
1. **Input:** User enters text and selects a language/voice.
2. **Initialization:** On "Start", the text is split into an array of words.
3. **Speech Synthesis:** 
    - Use `window.speechSynthesis` and `SpeechSynthesisUtterance`.
    - Set `pitch`, `rate`, and `voice` based on user settings.
4. **Synchronization:**
    - Listen to the `onboundary` event of the `SpeechSynthesisUtterance`.
    - The `onboundary` event provides the `charIndex`, which we use to determine which word is currently being spoken.
    - Update the `currentWordIndex` state to trigger a re-render and highlight the corresponding `<span>`.
5. **Controls:**
    - `pause()` and `resume()` methods of `window.speechSynthesis`.
    - `cancel()` to stop.
    - Update `rate` property for speed control.

## 5. UI/UX Design
- Clean, minimalist interface using ShadcnUI components.
- Smooth transitions for highlighting.
- Responsive design for mobile and desktop.
- Accessibility: ARIA labels, keyboard navigation for controls.

## 6. Future Enhancements
- Recording user's voice and comparing with the original (AI evaluation).
- Saving practice history.
- Dark mode support.
