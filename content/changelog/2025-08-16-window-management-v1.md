---
title: Window Management v1
version: 0.1.0
date: 2025-08-16
description: Initial OS shell with MenuBar, Desktop, WindowManager and Window, plus resizing, maximize/minimize, keyboard shortcuts, persistence, and a temporary Minimized Shelf overlay.
---

Added
- OS domain types with window management flags in [types/os.ts](types/os.ts:1)
- Pinia OS store with window management API: [useOSStore()](stores/os.ts:24)
  - Open/close/bringToFront, focus tracking, drag/move with bounds
  - Resize start/move/end with edge-aware logic and min sizes
  - Maximize/restore (double-click titlebar) with lastNormalRect
  - Minimize/restore and session persistence (load/save)
- Components (neutral CSS)
  - Menu bar with clock and menu toggle: [MenuBar.vue](app/components/os/MenuBar.vue)
  - Desktop surface with test button and menu-close on background click: [Desktop.vue](app/components/os/Desktop.vue)
  - Absolute overlay Window Manager with global mouse/keyboard handlers and minimized shelf: [WindowManager.vue](app/components/os/WindowManager.vue)
  - Window with titlebar controls (close/minimize/maximize), drag and 8 resize handles: [Window.vue](app/components/os/Window.vue)
- Session loading in app bootstrap: [default export](app/app.vue:15) initializes from store.loadSession()

Changed
- Overlay behaviour so window layer covers desktop while allowing underlying UI clicks
  - Root overlay uses pointer-events: none; children re-enable with pointer-events: auto in [WindowManager.vue](app/components/os/WindowManager.vue:39)
- Architecture document updated with Window Management v1 behaviours and overlay rules: [repo-structure.md](repo-structure.md)

Fixed
- Windows previously rendered below desktop; now WindowManager overlays desktop (position: absolute; inset: 0; z-index: 2) in [WindowManager.vue](app/components/os/WindowManager.vue:39)
- “Open Test Window” button blocked by overlay; resolved via pointer-events strategy in [WindowManager.vue](app/components/os/WindowManager.vue:47)

Removed
- Tailwind usage from architecture and implementation (neutral CSS only)
- Desktop-local “minimized shelf” approach; unified shelf rendered by WindowManager overlay

Notes
- Keyboard shortcuts in [onKeyDown()](app/components/os/WindowManager.vue:26)
  - ESC: cancel drag/resize, close menus
  - Cmd/Ctrl+M: minimize focused
  - Cmd/Ctrl+W: close focused
  - Cmd/Ctrl+` (backtick): cycle focus/bring to front
- Bounds respect menuBarHeight and desktopPadding; min window size is 240x160 as constants in [stores/os.ts](stores/os.ts:9)