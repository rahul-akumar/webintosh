---
title: Yahoo Messenger - Notifications & Classic Theme
date: 2025-08-23
category: feature
tags: [yahoo-messenger, notifications, theming, firebase]
---

# Yahoo Messenger Improvements

## 🔔 Smart Notification System

### Desktop Notifications
- **Direct Messages Only**: Implemented global notification system that shows desktop notifications for DMs when Yahoo Messenger is closed
- **No Channel Spam**: Disabled notifications for channel messages to reduce notification fatigue
- **Click to Open**: Clicking on a notification automatically opens Yahoo Messenger to the relevant conversation
- **Smart Detection**: Only notifies for truly new messages (within 10 seconds) to avoid duplicate notifications from old messages

### Unread Message Badges
- **Channel Badges**: Added red unread count badges for channels with new messages
- **Smart Tracking**: Tracks last read timestamp per channel to accurately count unread messages
- **Auto Clear**: Badge clears when you open the channel
- **Visual Distinction**: Active channel shows badge in yellow/gold color

## 🎨 Classic Yahoo Theme
- **Nostalgic Design**: Created `yahooClassic.css` with authentic early 2000s Yahoo Messenger styling
- **Purple Gradient Headers**: Classic purple gradient backgrounds for headers and user info sections
- **Speech Bubble Messages**: Messages styled as speech bubbles with arrow pointers
- **3D Buttons**: Classic gradient buttons with hover and active states
- **Gold Accents**: Yellow/gold user avatars and highlights for that authentic Yahoo feel
- **Windows XP Era**: Inset borders, gradients, and classic scrollbar styling

## 🧹 Message Management
- **Clear Functions**: Added utilities to clear channel messages for testing cleanup
- **Firebase Console Access**: Direct links to Firebase console for manual message management
- **Safe Approach**: Removed dangerous UI buttons in favor of console-only clearing

## 🛠️ Technical Improvements
- **Global Chat Listener**: `useGlobalChat.ts` composable monitors messages at OS level
- **Session Persistence**: Unread counts and last read timestamps persist across sessions
- **Performance**: Optimized Firebase queries by removing unnecessary orderBy clauses
- **Error Handling**: Added proper error handling and console logging for debugging

## Bug Fixes
- Fixed global listener detecting old messages on startup
- Fixed notification state not properly syncing between app open/closed states
- Resolved Firebase index issues by simplifying queries
- Fixed duplicate notification issues with processed message tracking

## Files Modified
- `/app/composables/useGlobalChat.ts` - Global notification listener
- `/app/components/apps/YahooMessenger/index.vue` - Unread badges and monitoring
- `/app/components/apps/YahooMessenger/yahooClassic.css` - Classic theme styling
- `/app/composables/clearChatData.ts` - Message cleanup utilities
- `/app/app.vue` - Initialize global listeners on app mount

## Next Steps
- Add sound toggle for notifications
- Implement user status (Away, Busy, Invisible)
- Add typing indicators
- Consider adding notification settings per channel
