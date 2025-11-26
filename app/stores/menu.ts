import { defineStore } from 'pinia'
import type { MenuTemplate } from '../types/menu'

export interface MenuState {
  /** Current menu open state */
  openType: 'none' | 'menubar' | 'context'
  /** Index of currently open menubar section (0 = Apple menu) */
  menubarIndex: number | null
  /** Active submenu path (indices of expanded submenus) */
  activePath: number[]
  /** Position of context menu (when openType === 'context') */
  contextPos: { x: number; y: number } | null
  /** Template for context menu (when openType === 'context') */
  contextTemplate: MenuTemplate | null
}

/**
 * Menu store handles menubar and context menu state.
 */
export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    openType: 'none',
    menubarIndex: null,
    activePath: [],
    contextPos: null,
    contextTemplate: null,
  }),

  getters: {
    /** Whether any menu is currently open */
    isMenuOpen: (state): boolean => state.openType !== 'none',

    /** Whether the menubar dropdown is open */
    isMenubarOpen: (state): boolean => state.openType === 'menubar',

    /** Whether a context menu is open */
    isContextOpen: (state): boolean => state.openType === 'context',
  },

  actions: {
    /**
     * Open a menubar dropdown at the specified section index.
     */
    openMenubar(index?: number): void {
      this.openType = 'menubar'
      this.menubarIndex = typeof index === 'number' ? index : 0
      this.activePath = []
      // Clear any context state
      this.contextPos = null
      this.contextTemplate = null
    },

    /**
     * Open a context menu at the specified position.
     */
    openContext(x: number, y: number, template: MenuTemplate): void {
      this.openType = 'context'
      this.menubarIndex = null
      this.activePath = []
      this.contextPos = { x, y }
      this.contextTemplate = template
    },

    /**
     * Set the active submenu path (for nested menus).
     */
    setActivePath(path: number[]): void {
      this.activePath = Array.isArray(path) ? [...path] : []
    },

    /**
     * Close all menus and reset state.
     */
    closeMenu(): void {
      this.openType = 'none'
      this.menubarIndex = null
      this.activePath = []
      this.contextPos = null
      this.contextTemplate = null
    },

    /**
     * Navigate to next section (for keyboard navigation).
     */
    nextSection(totalSections: number): void {
      if (this.openType !== 'menubar' || this.menubarIndex === null) return
      this.menubarIndex = (this.menubarIndex + 1) % totalSections
      this.activePath = []
    },

    /**
     * Navigate to previous section (for keyboard navigation).
     */
    prevSection(totalSections: number): void {
      if (this.openType !== 'menubar' || this.menubarIndex === null) return
      this.menubarIndex = (this.menubarIndex - 1 + totalSections) % totalSections
      this.activePath = []
    },
  },
})
