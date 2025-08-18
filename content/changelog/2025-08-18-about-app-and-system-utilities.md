# About App & System Utilities Architecture

**Date:** 2025-08-18  
**Version:** v0.1.3

## Features Added

### About App
- Created dedicated About app as a system utility
- Displays Webintosh version, description, tech stack, and repository link
- Clean, centered design following macOS About dialog aesthetic
- Accessible via "Webintosh > About" menu item

### System App Architecture
- Introduced `showOnDesktop` flag for app descriptors
- System utilities (About, Shortcuts) now hidden from desktop by default
- Apps can be registered as system-only, accessible via menu but not cluttering desktop

## Technical Changes

### Type System
- Added `showOnDesktop?: boolean` to `AppDescriptor` interface
- Defaults to `true` if not specified

### Components
- **AboutApp.vue**: New system app component with version info and branding
- **DesktopIcons.vue**: Updated to filter apps with `showOnDesktop: false`
- **systemMenu.ts**: Enabled About menu item with `system.showAbout` command
- **menuCommands.ts**: Added handler for launching About app

### App Registration
- About app: `showOnDesktop: false`, window size 400x420
- Shortcuts app: Also set to `showOnDesktop: false` for consistency

## Architecture Decision

System utilities are now separate apps rather than OS components, providing:
- Proper window management (minimize, maximize, close)
- Dock presence when running
- Consistent app lifecycle
- Menu bar integration when focused

This follows the macOS paradigm where system utilities are full applications with window management capabilities.
