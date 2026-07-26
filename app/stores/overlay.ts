import { defineStore } from 'pinia'
import type { AppId } from '../types/app'
import { useOSStore } from './os'
import { useAppsStore } from './apps'

export type OverlayKind = 'launcher' | 'switcher'

export interface OverlayState {
  /** Which full-screen overlay is active. Only one may be open at a time. */
  activeOverlay: OverlayKind | null
  /** Selected index into switcherCandidates while the switcher is active. */
  switcherIndex: number
  /**
   * Snapshot of candidate app ids taken at switcherStart(). Frozen during
   * cycling (like the real cmd+tab) so focus changes mid-cycle don't reorder
   * the row under the user.
   */
  switcherCandidates: AppId[]
}

/**
 * Overlay store - single state machine for the OS-level overlays
 * (Spotlight-style launcher and cmd+tab-style app switcher).
 *
 * Hotkey routing lives in useWindowEvents; presentation lives in
 * components/os/Launcher.vue and components/os/AppSwitcher.vue. This store
 * owns all overlay/cycling/commit logic so those components stay
 * presentation-only.
 */
export const useOverlayStore = defineStore('overlay', {
  state: (): OverlayState => ({
    activeOverlay: null,
    switcherIndex: 0,
    switcherCandidates: [],
  }),

  getters: {
    isLauncherOpen: (s): boolean => s.activeOverlay === 'launcher',
    isSwitcherOpen: (s): boolean => s.activeOverlay === 'switcher',
    switcherSelected: (s): AppId | null =>
      s.switcherCandidates[s.switcherIndex] ?? null,
  },

  actions: {
    // --- Launcher ---

    openLauncher(): void {
      this.resetSwitcher()
      this.activeOverlay = 'launcher'
      // An overlay and an open menu would fight for input; menus lose.
      useOSStore().closeMenu()
    },

    closeLauncher(): void {
      if (this.activeOverlay === 'launcher') this.activeOverlay = null
    },

    toggleLauncher(): void {
      if (this.activeOverlay === 'launcher') this.closeLauncher()
      else this.openLauncher()
    },

    // --- Switcher ---

    /**
     * Snapshot candidates (distinct appIds over ALL windows, including
     * minimized - real cmd+tab includes hidden apps) ordered by their
     * topmost window's zIndex, most recent first. Preselects the second
     * app when there is one (the "previous app", like real cmd+tab).
     * No-op when there are no candidate windows.
     */
    switcherStart(reverse = false): void {
      const os = useOSStore()
      const topZByApp = new Map<AppId, number>()
      for (const w of os.windows) {
        if (!w.appId) continue
        const z = topZByApp.get(w.appId)
        if (z === undefined || w.zIndex > z) topZByApp.set(w.appId, w.zIndex)
      }
      const candidates = [...topZByApp.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
      if (candidates.length === 0) return

      this.switcherCandidates = candidates
      this.switcherIndex =
        candidates.length > 1 ? (reverse ? candidates.length - 1 : 1) : 0
      this.activeOverlay = 'switcher'
      os.closeMenu()
    },

    /** Move the selection by delta, wrapping in both directions. */
    switcherNext(delta: number): void {
      if (this.activeOverlay !== 'switcher') return
      const len = this.switcherCandidates.length
      if (len === 0) return
      this.switcherIndex = (((this.switcherIndex + delta) % len) + len) % len
    },

    /**
     * Commit the selection (optionally overriding the index, e.g. a click
     * on a specific item): close the overlay and focus the app's topmost
     * window, restoring it if minimized.
     */
    switcherCommit(index?: number): void {
      if (this.activeOverlay !== 'switcher') return
      const i = index ?? this.switcherIndex
      const selected = this.switcherCandidates[i] ?? null
      this.resetSwitcher()
      this.activeOverlay = null
      if (selected) useAppsStore().launchOrFocus(selected)
    },

    /** Close the switcher without changing focus. */
    switcherCancel(): void {
      if (this.activeOverlay !== 'switcher') return
      this.resetSwitcher()
      this.activeOverlay = null
    },

    // --- Shared ---

    closeAll(): void {
      this.resetSwitcher()
      this.activeOverlay = null
    },

    resetSwitcher(): void {
      this.switcherIndex = 0
      this.switcherCandidates = []
    },
  },
})
