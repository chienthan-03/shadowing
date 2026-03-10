# Keyboard Shortcuts for Shadowing Controls Design

## Goal
Implement keyboard shortcuts for the shadowing application to improve user efficiency and accessibility.

## Architecture
- **Library**: `react-hotkeys-hook` for robust shortcut management.
- **Integration**: Shortcuts will be integrated into the `useShadowing` hook to maintain encapsulation.
- **Scope**: Shortcuts will be globally active except when the user is typing in a form element (e.g., the main text input).

## Shortcut Mapping
- `Shift + Enter`: Start shadowing (calls `handleStart`).
- `Shift + Space`: Pause or Resume shadowing (calls `handlePauseResume`).
- `Shift + W`: Stop shadowing (calls `handleStop`).

## UI Enhancements
- Update button labels in `app/page.tsx` to include shortcut hints.
  - "Start (Shift+Enter)"
  - "Pause/Resume (Shift+Space)"
  - "Stop (Shift+W)"

## Error Handling & Edge Cases
- **Form Focus**: Shortcuts are disabled when typing in `textarea` or `input` to prevent accidental triggers.
- **State Check**: Shortcuts will respect the same `disabled` states as the buttons (e.g., Start is disabled if text is empty).
