// OS Component Constants
// Centralized configuration for layout, sizing, and z-index values

export const LAYOUT = {
  /** Height of the top menu bar in pixels */
  MENU_BAR_HEIGHT: 40,
  /** Padding from desktop edges for icons */
  DESKTOP_PADDING: 8,
  /** Top padding for desktop icons */
  DESKTOP_TOP_PADDING: 20,
  /** Default icon height including margin for layout calculations */
  ICON_GRID_HEIGHT: 100,
  /** Default icon width including margin for layout calculations */
  ICON_GRID_WIDTH: 100,
} as const

export const ICON_SIZES = {
  small: {
    width: 72,
    height: 68,
    iconSize: 22,
    fontSize: 11,
    margin: 6,
    padding: { x: 4, y: 6 },
  },
  medium: {
    width: 88,
    height: 80,
    iconSize: 28,
    fontSize: 12,
    margin: 8,
    padding: { x: 6, y: 8 },
  },
  large: {
    width: 104,
    height: 92,
    iconSize: 36,
    fontSize: 13,
    margin: 10,
    padding: { x: 8, y: 10 },
  },
} as const

export type IconSize = keyof typeof ICON_SIZES

export const DOCK = {
  /** Size of dock item buttons */
  BUTTON_SIZE: 48,
  /** Size of icons within dock buttons */
  ICON_SIZE: 26,
  /** Gap between dock items */
  GAP: 10,
  /** Dock padding */
  PADDING: { x: 12, y: 8 },
  /** Border radius of dock container */
  BORDER_RADIUS: 16,
} as const

export const WINDOW = {
  /** Default minimum window dimensions */
  MIN_WIDTH: 200,
  MIN_HEIGHT: 150,
  /** Window header height */
  HEADER_HEIGHT: 32,
  /** Size of resize handles */
  RESIZE_HANDLE_SIZE: 8,
  /** Corner resize handle size */
  CORNER_HANDLE_SIZE: 12,
} as const

export const Z_INDEX = {
  /** Base z-index for windows */
  WINDOWS: 100,
  /** Active window z-index boost */
  WINDOW_ACTIVE: 200,
  /** Dock z-index */
  DOCK: 500,
  /** Menu dropdown z-index */
  MENU_DROPDOWN: 1000,
  /** Context menu overlay z-index */
  CONTEXT_MENU: 9999,
  /** Notification z-index */
  NOTIFICATIONS: 9999,
} as const

export const ANIMATION = {
  /** Fast transition duration in ms */
  FAST: 120,
  /** Normal transition duration in ms */
  NORMAL: 200,
  /** Slow transition duration in ms */
  SLOW: 300,
} as const
