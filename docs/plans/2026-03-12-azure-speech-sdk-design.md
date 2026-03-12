# Azure Speech SDK Integration Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Microsoft Azure Cognitive Services Speech SDK for high-quality Text-to-Speech (TTS) and real-time Speech-to-Text (STT) for shadowing practice.

**Architecture:** 
- **Backend:** Next.js API route to securely fetch Azure auth tokens.
- **Frontend Hook:** `useAzureSpeech` to manage SDK lifecycle, TTS synthesis, and STT recognition.
- **UI Integration:** Update `useShadowing` to use Azure services instead of browser Web Speech API.

**Tech Stack:** 
- `microsoft-cognitiveservices-speech-sdk`
- Next.js (API Routes)
- React (Custom Hooks)

---

## 1. Backend: Token Security
- Create `app/api/speech-token/route.ts`.
- Environment variables: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`.
- Returns `{ token, region }` with a short TTL.

## 2. Core Hook: `useAzureSpeech`
- **State:** `synthesizer`, `recognizer`, `isListening`, `recognizedText`, `interimText`.
- **TTS Methods:** `speak(text)`, `stopSpeak()`.
- **STT Methods:** `startListening()`, `stopListening()`.
- **Events:** Handle `viseme` for precise word highlighting and `recognized` for final STT results.

## 3. UI Integration: `useShadowing`
- Replace `react-text-to-speech` logic.
- Bind Azure TTS to the "Play" button.
- Bind Azure STT to a new "Record/Shadow" button.
- Display `recognizedText` temporarily on the UI for user feedback.

## 4. Error Handling
- Handle microphone permission denials.
- Handle network errors during token fetch or Azure connection.
- Fallback to browser TTS if Azure fails (optional).
