export type WindowId = number;

export interface OSWindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type OSWindowKind = 'blank' | 'system' | 'app';

export interface OSWindowModel {
  id: WindowId;
  title: string;
  kind: OSWindowKind;
  rect: OSWindowRect;
  zIndex: number;

  // Window Management v1 flags
  resizable?: boolean;      // default true for app windows
  minimizable?: boolean;    // default true for app windows
  maximized?: boolean;      // runtime
  minimized?: boolean;      // runtime
  closable?: boolean;       // default true

  // For restore from maximize
  lastNormalRect?: OSWindowRect;
}

export interface DragState {
  active: boolean;
  windowId: WindowId | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;

  // Resize support
  resizing?: boolean;
  edge?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
  originW?: number;
  originH?: number;
}

export interface OSMenuState {
  isAppleOpen: boolean;
}

export interface OSState {
  windows: OSWindowModel[];
  nextWindowId: number;
  nextZ: number;
  drag: DragState;
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
}