/**
 * Session store - NOTE: This store is currently unused.
 * The main os.ts store inlines all session persistence for SSR compatibility.
 * This file is kept for reference and potential future modular refactoring.
 */
import { defineStore } from 'pinia'
import { debounce } from '../utils/debounce'
import { STORAGE_KEYS } from '../constants/storage-keys'
import type { OSWindowModel } from '../types/os'
import { useAssetUrl } from '../composables/useAssetUrl'

export interface SessionSnapshot {
  windows: OSWindowModel[]
  nextWindowId: number
  nextZ: number
  wallpaper: { type: string; value: string } | null
  theme: string
}

export interface SessionState {
  wallpaper: { type: string; value: string } | null
  theme: string
}

// Debounce delay for session saves (ms)
const SAVE_DEBOUNCE_MS = 500

// Module-level debounced save function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let debouncedSaveFn: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDebouncedSave(): any {
  if (!debouncedSaveFn) {
    debouncedSaveFn = debounce((
      writeToStorage: (snapshot: SessionSnapshot) => void,
      getSnapshot: () => SessionSnapshot
    ) => {
      writeToStorage(getSnapshot())
    }, SAVE_DEBOUNCE_MS)
  }
  return debouncedSaveFn
}

/**
 * Session store handles persistence of OS state to localStorage.
 * Uses debouncing to reduce writes during rapid interactions.
 */
export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    wallpaper: null,
    theme: 'glassmorphic-light',
  }),

  actions: {
    /**
     * Save session state to localStorage (debounced).
     * Call this for frequent operations like drag/resize.
     */
    saveSession(getSnapshot: () => SessionSnapshot): void {
      const debouncedSave = getDebouncedSave()
      debouncedSave((snapshot: SessionSnapshot) => this._writeToStorage(snapshot), getSnapshot)
    },

    /**
     * Save session immediately without debouncing.
     * Use for critical operations like window close, app quit.
     */
    saveSessionImmediate(snapshot: SessionSnapshot): void {
      const debouncedSave = getDebouncedSave()
      debouncedSave.cancel()
      this._writeToStorage(snapshot)
    },

    /**
     * Flush any pending debounced save.
     */
    flushPendingSave(): void {
      const debouncedSave = getDebouncedSave()
      debouncedSave.flush()
    },

    /**
     * Cancel any pending debounced save.
     */
    cancelPendingSave(): void {
      const debouncedSave = getDebouncedSave()
      debouncedSave.cancel()
    },

    /**
     * Load session from localStorage.
     * Returns partial snapshot data (windows are loaded by window store).
     */
    loadSession(): Partial<SessionSnapshot> | null {
      if (typeof localStorage === 'undefined') return null

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
        if (!raw) {
          // First time - set default wallpaper
          this._setDefaultWallpaper()
          return null
        }

        const parsed = JSON.parse(raw) as Partial<SessionSnapshot>

        // Load wallpaper
        if ('wallpaper' in parsed && parsed.wallpaper) {
          this.wallpaper = parsed.wallpaper
        } else {
          this._setDefaultWallpaper()
        }

        // Load theme
        if (typeof parsed.theme === 'string') {
          this.theme = parsed.theme
          this.applyTheme(parsed.theme)
        }

        return parsed
      } catch {
        return null
      }
    },

    /**
     * Set wallpaper and trigger save.
     */
    setWallpaper(wallpaper: { type: string; value: string } | null, getSnapshot: () => SessionSnapshot): void {
      this.wallpaper = wallpaper
      this.saveSessionImmediate(getSnapshot())
    },

    /**
     * Set theme and apply to DOM.
     */
    setTheme(theme: string, getSnapshot: () => SessionSnapshot): void {
      this.theme = theme
      this.applyTheme(theme)
      this.saveSessionImmediate(getSnapshot())
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
     * Initialize theme on app start.
     */
    initTheme(): void {
      this.applyTheme(this.theme)
    },

    // --- Private helpers ---

    _setDefaultWallpaper(): void {
      this.wallpaper = {
        type: 'video',
        value: useAssetUrl('wallpapers/end-of-daylight.mp4') ?? '/wallpapers/end-of-daylight.mp4',
      }
    },

    _writeToStorage(snapshot: SessionSnapshot): void {
      if (typeof localStorage === 'undefined') return

      const data = {
        windows: snapshot.windows.map((w) => ({
          id: w.id,
          title: w.title,
          kind: w.kind,
          rect: w.rect,
          zIndex: w.zIndex,
          appId: w.appId ?? null,
          resizable: w.resizable ?? true,
          minimizable: w.minimizable ?? true,
          maximizable: w.maximizable ?? true,
          closable: w.closable ?? true,
          displayState: w.displayState,
          lastNormalRect: w.lastNormalRect ?? null,
        })),
        nextWindowId: snapshot.nextWindowId,
        nextZ: snapshot.nextZ,
        wallpaper: this.wallpaper,
        theme: this.theme,
      }

      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(data))
      } catch {
        /* ignore quota errors */
      }
    },
  },
})
