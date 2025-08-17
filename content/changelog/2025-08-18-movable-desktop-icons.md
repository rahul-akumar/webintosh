---
title: Movable Desktop Icons
version: 0.2.0
date: 2025-08-18
description: Implement drag-and-drop functionality for desktop icons with position persistence
---

## Added

### Draggable Desktop Icons
- Icons can now be freely moved around the desktop via drag-and-drop
- Visual feedback during drag (opacity changes to 0.6)
- Positions are saved to localStorage and persist across page refreshes
- Icons default to grid layout if no saved position exists

### Store Updates (`stores/apps.ts`)
- Added `iconPositions` state to track x,y coordinates for each app icon
- Added `loadIconPositions()` to restore positions from localStorage on startup
- Added `setIconPosition()` to save icon position immediately when moved

### Component Changes
- **DesktopIcon.vue**: Now accepts x,y props and emits move events when dragged
- **DesktopIcons.vue**: Manages icon positions and persists them to store
- **app.vue**: Loads saved icon positions on mount

## Technical Implementation
- Simple drag-and-drop using mouse events
- Positions stored as `{appId: {x, y}}` in localStorage
- Fallback to calculated grid positions (8 icons per row, 100px spacing)
- All existing functionality preserved (double-click to open, right-click context menu)
