import type { AppDescriptor } from '../types/app';

/**
 * Core app registry for Webintosh
 * Defines all available applications with their metadata
 */
export const appRegistry: AppDescriptor[] = [
  {
    id: 'finder',
    title: 'Finder',
    icon: 'icons/system/finder.png',
    emoji: '🗂️',
    kind: 'system',
  },
  {
    id: 'textedit',
    title: 'TextEdit',
    icon: 'icons/apps/textEdit.png',
    emoji: '📝',
    kind: 'app',
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    icon: 'icons/system/shortcuts.png',
    emoji: '⌨️',
    kind: 'system',
    showOnDesktop: false,
  },
  {
    id: 'about',
    title: 'About Webintosh',
    icon: 'icons/system/about.svg',
    emoji: 'ℹ️',
    kind: 'system',
    defaultRect: { x: 100, y: 80, width: 400, height: 600 },
    showOnDesktop: false,
  },
  {
    id: 'settings',
    title: 'System Settings',
    icon: 'icons/system/settings.png',
    emoji: '⚙️',
    kind: 'system',
    defaultRect: { x: 100, y: 80, width: 900, height: 600 },
  },
  {
    id: 'typingtest',
    title: 'Typing Test 2000',
    icon: 'icons/apps/typingTest.png',
    emoji: '⌨️',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 900, height: 620 },
  },
  {
    id: 'keystation',
    title: 'KeyStation',
    icon: 'icons/apps/keyStation.png',
    emoji: '🎹',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 960, height: 600 },
  },
  {
    id: 'yahoomessenger',
    title: 'Yahoo! Messenger',
    icon: 'icons/apps/yahooMessenger.png',
    emoji: 'Yahoo!',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 960, height: 600 },
  },
  {
    id: 'whitenoise',
    title: 'Noise Mixer',
    icon: 'icons/apps/noiseMixer.png',
    emoji: '🎧',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 900, height: 700 },
  },
  {
    id: 'chess',
    title: 'Chess',
    icon: 'icons/apps/chess.png',
    emoji: '♟️',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 1000, height: 744 },
  },
];
