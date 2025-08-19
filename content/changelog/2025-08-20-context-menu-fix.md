---
title: Context Menu Close Behavior Fix
version: 0.2.3
date: 2025-08-20
description: Fixed context menu not closing after clicking menu items or submenu items
---

## Fixed

### Context Menu Auto-Close
- Context menu now properly closes after clicking any menu item
- Submenu items now correctly trigger menu closure when clicked
- Fixed missing event handler for `executed` event in main app component

## Technical Details

### Root Cause
- The `ContextMenu` component was emitting an `executed` event when menu items were clicked
- However, the parent component (`app.vue`) wasn't listening for this event
- This caused the menu to remain open after performing actions, especially from submenus

### Solution
- Added `@executed="store.closeMenu()"` handler to `OsContextMenu` in `app.vue`
- Now properly handles the event bubble from nested `MenuDropdown` components
- Ensures consistent close behavior for both top-level and nested menu items

## Component Updates

### app.vue
- Added `@executed` event handler to `OsContextMenu` component
- Menu now closes immediately after any menu action is performed
- Works alongside existing `@request-close` handler for backdrop clicks and ESC key

## User Experience
- Right-click context menus now close automatically after selecting an option
- Submenu selections (like wallpaper changes, icon sizes) trigger immediate menu closure
- More intuitive behavior matching native OS context menu patterns
- No need to manually click away or press ESC after making a selection
