---
title: SVG Icon Support with Emoji Fallback
version: 0.2.1
date: 2025-08-18
description: Add support for SVG icons in apps with automatic emoji fallback
---

## Added

### SVG Icon System
- Apps can now display custom SVG icons instead of emojis
- Automatic fallback to emoji when no SVG icon is provided
- SVG icons provide better visual quality and scalability
- Support for both system and app icons

### Type Updates
- **AppDescriptor**: Added optional `icon` property for SVG icon paths
- Icons are served from `/public/icons/` directory structure

### Component Updates
- **DockItem.vue**: Renders SVG icons when available, falls back to emoji
- **DesktopIcon.vue**: Same SVG/emoji display logic with proper sizing
- **Dock.vue**: Passes icon prop to DockItem components
- **DesktopIcons.vue**: Passes icon prop to DesktopIcon components

### App Configurations
- Finder now uses `/icons/system/finder.svg`
- TextEdit configured for `/icons/apps/textEdit.svg`
- Shortcuts configured for `/icons/system/shortcuts.svg`
- About configured for `/icons/system/about.svg`

## Technical Implementation
- SVG icons are 26x26px in Dock, 28x28px on Desktop
- Icons stored in `/public/icons/system/` and `/public/icons/apps/`
- Backward compatible - apps without SVG icons continue using emojis
- No breaking changes to existing functionality

## Migration Guide
To add SVG icons to apps:
1. Place SVG file in `/public/icons/system/` or `/public/icons/apps/`
2. Update app registration with `icon: '/icons/path/to/icon.svg'`
3. Keep `emoji` property as fallback
