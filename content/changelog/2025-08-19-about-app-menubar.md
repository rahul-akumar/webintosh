# About App Menubar Update

**Date:** 2025-08-19  
**Version:** v0.1.3

## Changes

### About App Menu Behavior
- About app now shows the desktop menubar instead of its own menu
- When About window is focused, menubar displays "Webintosh" (system menu) instead of "About"
- Provides cleaner interface for simple informational windows

## Technical Implementation

### Menu System
- Modified `getAppMenuTemplate()` in `/app/components/os/menus/index.ts`
- Added special case for 'about' app to return system menu template
- Maintains consistent desktop menu when viewing About information

## Rationale

The About app is a simple informational dialog that doesn't require application-specific menu items. Using the system menu:
- Reduces UI complexity
- Follows convention for utility windows
- Provides all necessary window management commands
- Maintains desktop context while viewing app information
