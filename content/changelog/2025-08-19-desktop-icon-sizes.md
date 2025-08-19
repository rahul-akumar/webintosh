---
title: Desktop Icon Size Options
version: 0.2.2
date: 2025-08-19
description: Add configurable desktop icon sizes with Small, Medium, and Large options
---

## Added

### Icon Size Settings
- Desktop icons can now be resized to Small, Medium, or Large
- Size preference accessible via desktop context menu
- Settings persist across sessions via localStorage
- Visual checkmark indicator shows currently selected size

### Context Menu Enhancement
- New "Icon Size" submenu in desktop context menu under Icons section
- Three size options available:
  - **Small**: Compact 22px icons with 11px labels
  - **Medium**: Default 28px icons with 12px labels  
  - **Large**: Expanded 36px icons with 13px labels

## Component Updates

### DesktopIcon.vue
- Dynamic CSS classes based on selected icon size
- Responsive icon and label sizing
- Updated drag bounds calculation for different icon dimensions
- Size-specific styling for optimal visual balance

### Desktop.vue
- Added Icon Size submenu to context menu structure
- Checkmark indicators for active size selection

### Apps Store
- New `iconSize` state property (defaults to 'medium')
- `setIconSize()` action for updating size preference
- Persistent storage in localStorage under `webintosh:desktop:v1:iconLayout`

### Menu Commands
- New `desktop.setIconSize` command handler
- Validates size parameter ('small', 'medium', 'large')

## Technical Details

### Icon Dimensions
| Size   | Icon  | Label | Total Width | Margin |
|--------|-------|-------|-------------|--------|
| Small  | 22px  | 11px  | 72px        | 6px    |
| Medium | 28px  | 12px  | 88px        | 8px    |
| Large  | 36px  | 13px  | 104px       | 10px   |

### Implementation
- Icon size affects both SVG and emoji icons
- Drag boundaries automatically adjust based on icon size
- No breaking changes to existing icon positioning system
- Works seamlessly with icon direction and sorting options

## User Experience
- Right-click on desktop to access context menu
- Navigate to Icons → Icon Size
- Select desired size option
- Icons immediately resize without page refresh
- Setting persists across browser sessions
