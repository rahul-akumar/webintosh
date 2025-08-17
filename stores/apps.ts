import { defineStore } from 'pinia';
import type { AppDescriptor, AppId } from '../types/app';
import { useOSStore } from './os';

const PINS_KEY = 'webintosh:dock:v1:pins';
const MIN_ORDER_KEY = 'webintosh:dock:v1:minOrder';

export interface AppsState {
  registry: Record<AppId, AppDescriptor>;
  pinned: AppId[];
  minimizedOrder: AppId[];
}

export const useAppsStore = defineStore('apps', {
  state: (): AppsState => ({
    registry: {},
    pinned: [],
    minimizedOrder: []
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

    // ----- Dock (minimized apps) ordering persistence -----

    loadMinOrder() {
      if (typeof localStorage === 'undefined') return;
      try {
        const raw = localStorage.getItem(MIN_ORDER_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Keep only string ids
          this.minimizedOrder = parsed.filter((x: unknown) => typeof x === 'string');
        } else {
          // Guard against corrupt storage
          this.minimizedOrder = [];
        }
      } catch {
        // Ensure a safe fallback
        this.minimizedOrder = [];
      }
    },

    saveMinOrder() {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(MIN_ORDER_KEY, JSON.stringify(this.minimizedOrder));
      } catch { /* ignore */ }
    },

    /**
     * Return the provided ids ordered by current minimizedOrder, appending any new ids at the end.
     */
    orderMinimizedAppIds(ids: AppId[]): AppId[] {
      const set = new Set(ids);
      const ordered: AppId[] = [];

      // Guard for SSR/HMR or corrupt state
      const current: AppId[] = Array.isArray(this.minimizedOrder) ? this.minimizedOrder : [];

      // keep known order first
      for (const id of current) {
        if (set.has(id)) ordered.push(id);
      }
      // append any new ids
      for (const id of ids) {
        if (!ordered.includes(id)) ordered.push(id);
      }
      return ordered;
    },

    /**
     * Move app "source" before "target" in minimizedOrder. If target is missing, place at end.
     * Ensures both ids are represented and persists the order.
     */
    moveInMinOrder(source: AppId, target: AppId | null) {
      // No-op when dropping onto itself
      if (target != null && target === source) {
        this.saveMinOrder();
        return;
      }

      // Ensure array exists
      if (!Array.isArray(this.minimizedOrder)) {
        this.minimizedOrder = [];
      }

      // Ensure both source and target (when provided) exist in the order list
      if (!this.minimizedOrder.includes(source)) {
        this.minimizedOrder.push(source);
      }
      if (target && !this.minimizedOrder.includes(target)) {
        this.minimizedOrder.push(target);
      }

      // Remove source current position
      this.minimizedOrder = this.minimizedOrder.filter((x: AppId) => x !== source);

      if (target) {
        const idx = this.minimizedOrder.indexOf(target);
        if (idx >= 0) {
          // Insert source before target
          this.minimizedOrder.splice(idx, 0, source);
        } else {
          // Fallback: append to end when target not found
          this.minimizedOrder.push(source);
        }
      } else {
        // No target provided: append to end
        this.minimizedOrder.push(source);
      }

      this.saveMinOrder();
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