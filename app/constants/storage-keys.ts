/**
 * Centralized localStorage keys for Webintosh
 * All storage keys should be defined here to avoid magic strings
 */
export const STORAGE_KEYS = {
  // Dock state
  DOCK_PINS: 'webintosh:dock:v1:pins',
  DOCK_MIN_ORDER: 'webintosh:dock:v1:minOrder',

  // Desktop icon state
  ICON_POSITIONS: 'webintosh:desktop:v1:iconPositions',
  ICON_LAYOUT: 'webintosh:desktop:v1:iconLayout',

  // OS session state
  SESSION: 'webintosh:session:v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
