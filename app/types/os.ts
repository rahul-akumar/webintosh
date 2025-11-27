import type { MenuTemplate } from './menu';

export type WindowId = number;

export interface OSWindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type OSWindowKind = 'blank' | 'system' | 'app';

/**
 * Display state for a window (mutually exclusive states).
 */
export type WindowDisplayState = 'normal' | 'minimized' | 'maximized';

/**
 * Animation state for window transitions.
 */
export type WindowAnimationState = 'none' | 'opening' | 'closing' | 'minimizing' | 'restoring' | 'maximizing' | 'unmaximizing';

/**
 * Valid resize edge directions.
 */
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface OSWindowModel {
  id: WindowId;
  title: string;
  kind: OSWindowKind;
  rect: OSWindowRect;
  zIndex: number;

  // App linkage (Phase 2)
  appId?: string;

  // Window Management v1 flags
  resizable?: boolean;      // default true for app windows
  minimizable?: boolean;    // default true for app windows
  maximizable?: boolean;    // default true for app windows
  closable?: boolean;       // default true

  // Display state (replaces boolean flags)
  displayState: WindowDisplayState;

  // Animation state for transitions
  animationState?: WindowAnimationState;

  // For restore from maximize
  lastNormalRect?: OSWindowRect;

  // Custom metadata for app initialization
  metadata?: Record<string, unknown>;
}

/**
 * Window interaction state machine.
 * Uses discriminated union to ensure only one interaction mode at a time.
 */
export type WindowInteractionState =
  | { mode: 'idle' }
  | {
      mode: 'dragging';
      windowId: WindowId;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      mode: 'resizing';
      windowId: WindowId;
      edge: ResizeEdge;
      startX: number;
      startY: number;
      originRect: OSWindowRect;
    };

export interface OSMenuState {
  // Generic menu open state
  openType: 'none' | 'menubar' | 'context';
  menubarIndex?: number | null;
  activePath: number[];

  // Context menu positioning and template (for reuse by context menus)
  contextPos?: { x: number; y: number } | null;
  contextTemplate?: MenuTemplate | null;
}

export interface OSState {
  windows: OSWindowModel[];
  nextWindowId: number;
  nextZ: number;
  interaction: WindowInteractionState;
  menu: OSMenuState;
  focusedId?: WindowId | null;
  clock: string;

  /**
   * Pixels reserved at the top of the screen for the menu bar (used for drag bounds).
   */
  menuBarHeight: number;
  /**
   * Padding inside the desktop to keep windows from hugging edges.
   */
  desktopPadding: number;
  /**
   * Distance in px from an edge to trigger snap.
   */
  snapThreshold: number;
  /**
   * Desktop wallpaper object with type and value or null for default background
   */
  wallpaper?: { type: string; value: string } | null;
  /**
   * Current theme name (e.g., 'glassmorphic-light', 'oldschool-dark')
   */
  theme: string;
}