/**
 * Session store handles wallpaper and theme persistence.
 * The main os.ts store delegates to this for session-related state.
 */
import { defineStore } from 'pinia'
import { useAssetUrl } from '../composables/useAssetUrl'

export interface SessionState {
  wallpaper: { type: string; value: string } | null
  theme: string
}

/**
 * Session store for wallpaper and theme state.
 * Persistence is handled by the main OS store.
 */
export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    wallpaper: null,
    theme: 'glassmorphic-light',
  }),

  actions: {
    /**
     * Set wallpaper.
     */
    setWallpaper(wallpaper: { type: string; value: string } | null): void {
      this.wallpaper = wallpaper
    },

    /**
     * Set theme and apply to DOM.
     */
    setTheme(theme: string): void {
      this.theme = theme
      this.applyTheme(theme)
    },

    /**
     * Apply theme to document element.
     */
    applyTheme(theme: string): void {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme)
      }
    },

    /**
     * Initialize with default wallpaper.
     */
    initDefaults(): void {
      if (!this.wallpaper) {
        this.wallpaper = {
          type: 'video',
          value: useAssetUrl('wallpapers/end-of-daylight.mp4') ?? '/wallpapers/end-of-daylight.mp4',
        }
      }
    },

    /**
     * Load state from parsed session data.
     */
    loadFromSnapshot(data: { wallpaper?: { type: string; value: string } | null; theme?: string }): void {
      if (data.wallpaper) {
        this.wallpaper = data.wallpaper
      } else {
        this.initDefaults()
      }
      if (typeof data.theme === 'string') {
        this.theme = data.theme
        this.applyTheme(data.theme)
      }
    },

    /**
     * Get current state for persistence.
     */
    getSnapshot(): { wallpaper: { type: string; value: string } | null; theme: string } {
      return {
        wallpaper: this.wallpaper,
        theme: this.theme,
      }
    },
  },
})
