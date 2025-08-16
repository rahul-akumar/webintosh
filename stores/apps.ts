import { defineStore } from 'pinia';
import type { AppDescriptor, AppId } from '../types/app';
import { useOSStore } from './os';

const PINS_KEY = 'webintosh:dock:v1:pins';

export interface AppsState {
  registry: Record<AppId, AppDescriptor>;
  pinned: AppId[];
}

export const useAppsStore = defineStore('apps', {
  state: (): AppsState => ({
    registry: {},
    pinned: []
  }),

  getters: {
    pinnedDescriptors(state): AppDescriptor[] {
      return state.pinned
        .map((id) => state.registry[id])
        .filter((d): d is AppDescriptor => !!d);
    }
  },

  actions: {
    registerApps(apps: AppDescriptor[]) {
      for (const a of apps) {
        this.registry[a.id] = {
          kind: 'app',
          ...a
        };
      }
    },

    loadPins() {
      if (typeof localStorage === 'undefined') return;
      try {
        const raw = localStorage.getItem(PINS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.pinned = parsed.filter((x: unknown) => typeof x === 'string');
        }
      } catch { /* ignore */ }
    },

    savePins() {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(this.pinned));
      } catch { /* ignore */ }
    },

    isPinned(id: AppId): boolean {
      return this.pinned.includes(id);
    },

    togglePin(id: AppId) {
      if (this.isPinned(id)) {
        this.pinned = this.pinned.filter((x) => x !== id);
      } else {
        this.pinned.push(id);
      }
      this.savePins();
    },

    pinApp(id: AppId) {
      if (!this.pinned.includes(id)) {
        this.pinned.push(id);
        this.savePins();
      }
    },

    unpinApp(id: AppId) {
      this.pinned = this.pinned.filter((x) => x !== id);
      this.savePins();
    },

    /**
     * Launch an app if none running; otherwise focus or restore the topmost window of that app.
     */
    launchOrFocus(id: AppId) {
      const os = useOSStore();
      const running = os.windows.filter((w) => w.appId === id);

      // Prefer topmost non-minimized
      const nonMin = [...running.filter(w => !w.minimized)]
        .sort((a, b) => b.zIndex - a.zIndex);
      const topNonMin = nonMin[0];
      if (topNonMin) {
        os.bringToFront(topNonMin.id);
        return;
      }

      // Otherwise restore topmost minimized
      const minimized = [...running.filter(w => !!w.minimized)]
        .sort((a, b) => b.zIndex - a.zIndex);
      const topMin = minimized[0];
      if (topMin) {
        os.restoreWindow(topMin.id);
        return;
      }

      // Launch a new window
      const d = this.registry[id];
      const title = d?.title ?? 'App';
      const rect = d?.defaultRect ?? {
        x: 80,
        y: os.menuBarHeight + 24,
        width: 520,
        height: 360
      };
      os.openWindow({
        appId: id,
        title,
        kind: d?.kind ?? 'app',
        rect
      });
    }
  }
});