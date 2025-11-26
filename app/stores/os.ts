import { defineStore } from "pinia";
import type {
  OSState,
  OSWindowModel,
  OSWindowRect,
  WindowId,
} from "../types/os";
import type { MenuTemplate } from "../types/menu";
import { STORAGE_KEYS } from "../constants/storage-keys";

const MIN_W = 240;
const MIN_H = 160;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getViewport() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const docEl = document.documentElement;
    // Use clientWidth/Height to exclude scrollbars and avoid 1–2px overflow
    return { vw: docEl.clientWidth, vh: docEl.clientHeight };
  }
  // SSR/defaults
  return { vw: 1280, vh: 800 };
}

export const useOSStore = defineStore("os", {
  state: (): OSState => ({
    windows: [],
    nextWindowId: 1,
    nextZ: 100,
    drag: {
      active: false,
      windowId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      // resize fields
      resizing: false,
      edge: null,
      originW: 0,
      originH: 0,
    },
    menu: {
      openType: "none",
      menubarIndex: null,
      activePath: [],
      contextPos: null,
      contextTemplate: null,
    },
    focusedId: null,
    clock: "",
    menuBarHeight: 40,
    desktopPadding: 8,
    snapThreshold: 16,
    wallpaper: null,
    theme: "glassmorphic-light",
  }),

  getters: {
    orderedWindows: (s): OSWindowModel[] =>
      [...s.windows]
        .filter((w) => !w.minimized)
        .sort((a, b) => a.zIndex - b.zIndex),

    focused: (s): OSWindowModel | null =>
      s.windows.find((w) => w.id === s.focusedId) ?? null,

    activeAppId(): string | null {
      return this.focused?.appId ?? null;
    },

    activeMenuTemplate(): MenuTemplate {
      // Phase 1 stub: replaced in Phase 2 with real templates
      return {
        id: "system-stub",
        title: this.activeAppId ? "App" : "Webintosh",
        sections: [],
      };
    },
  },

  actions: {
    // ---------- Helpers ----------
    saveSession() {
      if (typeof localStorage === "undefined") return;
      const snapshot = {
        windows: this.windows.map((w) => ({
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
          maximized: !!w.maximized,
          minimized: !!w.minimized,
          lastNormalRect: w.lastNormalRect ?? null,
        })),
        nextWindowId: this.nextWindowId,
        nextZ: this.nextZ,
        wallpaper: this.wallpaper,
        theme: this.theme,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(snapshot));
      } catch {
        /* ignore */
      }
    },

    loadSession() {
      if (typeof localStorage === "undefined") return;
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (!raw) {
          // First time - set default wallpaper with proper base URL
          const baseURL =
            typeof window !== "undefined" &&
            window.location.pathname.includes("/webintosh/")
              ? "/webintosh/"
              : "/";
          this.wallpaper = {
            type: "video",
            value: useAssetUrl("wallpapers/end-of-daylight.mp4"),
          };
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.windows)) {
          this.windows = parsed.windows as OSWindowModel[];
        }
        if (typeof parsed?.nextWindowId === "number")
          this.nextWindowId = parsed.nextWindowId;
        if (typeof parsed?.nextZ === "number") this.nextZ = parsed.nextZ;
        // Always load wallpaper if it exists in the session
        if ("wallpaper" in parsed) {
          this.wallpaper = parsed.wallpaper;
        } else {
          // No wallpaper in saved session - set default with proper base URL
          const baseURL =
            typeof window !== "undefined" &&
            window.location.pathname.includes("/webintosh/")
              ? "/webintosh/"
              : "/";
          this.wallpaper = {
            type: "video",
            value: `${baseURL}wallpapers/end-of-daylight.mp4`,
          };
        }
        if (typeof parsed?.theme === "string") {
          this.theme = parsed.theme;
          this.applyTheme(parsed.theme);
        }

        // Ensure we have a sane focused window after loading
        this.focusTopMost();
      } catch {
        /* ignore */
      }
    },

    setFocused(id: WindowId | null) {
      this.focusedId = id;
    },

    /**
     * Set focus to the current top-most non-minimized window, or null if none.
     */
    focusTopMost() {
      const candidates = this.windows
        .filter((w) => !w.minimized)
        .sort((a, b) => a.zIndex - b.zIndex);
      const top = candidates[candidates.length - 1] ?? null;
      this.focusedId = top ? top.id : null;
    },

    ensureBounds(w: OSWindowModel) {
      const { vw, vh } = getViewport();
      const pad = this.desktopPadding;
      const minX = pad;
      const minY = this.menuBarHeight;

      // Maximum size that fits within the viewport (respecting menu bar and padding)
      const maxWidth = Math.max(MIN_W, vw - pad * 2);
      const maxHeight = Math.max(MIN_H, vh - this.menuBarHeight - pad);

      // Clamp size first and snap to integer pixels to avoid subpixel overflow
      const clampedW = clamp(w.rect.width, MIN_W, maxWidth);
      const clampedH = clamp(w.rect.height, MIN_H, maxHeight);
      w.rect.width = Math.floor(clampedW);
      w.rect.height = Math.floor(clampedH);

      // Then clamp position so the rect remains fully visible; snap to integer pixels
      const maxX = vw - w.rect.width - pad;
      const maxY = vh - w.rect.height - pad;
      w.rect.x = Math.round(clamp(w.rect.x, minX, Math.max(minX, maxX)));
      w.rect.y = Math.round(clamp(w.rect.y, minY, Math.max(minY, maxY)));
    },

    // ---------- Clock ----------
    tickClock() {
      const d = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const day = days[d.getDay()];
      const date = d.getDate();
      const month = months[d.getMonth()];
      const time = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      this.clock = `${day} ${date} ${month} ${time}`;
    },

    // ---------- Windows ----------
    openWindow(partial?: Partial<OSWindowModel> & { title?: string }) {
      const id = this.nextWindowId++;
      const baseWidth = partial?.rect?.width ?? 360;
      const baseHeight = partial?.rect?.height ?? 220;
      const offset = (this.windows.length % 6) * 24;

      const w: OSWindowModel = {
        id,
        title: partial?.title ?? `Window ${id}`,
        kind: partial?.kind ?? "blank",
        rect: {
          x: (partial?.rect?.x ?? 60) + offset,
          y: (partial?.rect?.y ?? this.menuBarHeight + 20) + offset,
          width: baseWidth,
          height: baseHeight,
        },
        zIndex: this.nextZ++,
        appId: partial?.appId,
        resizable: partial?.resizable ?? true,
        minimizable: partial?.minimizable ?? true,
        maximizable: partial?.maximizable ?? true,
        closable: partial?.closable ?? true,
        maximized: false,
        minimized: false,
      };

      this.windows.push(w);
      this.bringToFront(w.id);
      this.saveSession();
      return w.id;
    },

    closeWindow(id: WindowId) {
      this.windows = this.windows.filter((w) => w.id !== id);
      if (this.drag.windowId === id) {
        this.endDrag();
      }
      if (this.focusedId === id) {
        this.focusTopMost();
      }
      this.saveSession();
    },

    bringToFront(id: WindowId) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      w.zIndex = this.nextZ++;
      this.setFocused(id);
      if (this.nextZ > 10000) {
        this.normalizeZOrder();
      }
      this.saveSession();
    },

    // ---------- Dragging ----------
    startDrag(id: WindowId, clientX: number, clientY: number) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      this.drag.active = true;
      this.drag.resizing = false;
      this.drag.windowId = id;
      this.drag.startX = clientX;
      this.drag.startY = clientY;
      this.drag.originX = w.rect.x;
      this.drag.originY = w.rect.y;
      this.bringToFront(id);
    },

    dragTo(clientX: number, clientY: number) {
      if (!this.drag.active || this.drag.windowId == null || this.drag.resizing)
        return;
      const w = this.windows.find((w) => w.id === this.drag.windowId);
      if (!w) return;

      const dx = clientX - this.drag.startX;
      const dy = clientY - this.drag.startY;

      w.rect.x = this.drag.originX + dx;
      w.rect.y = this.drag.originY + dy;
      this.ensureBounds(w);
    },

    endDrag() {
      this.drag.active = false;
      this.drag.resizing = false;
      this.drag.windowId = null;
      this.drag.edge = null;
      this.saveSession();
    },

    // ---------- Resizing ----------
    startResize(
      id: WindowId,
      edge: OSState["drag"]["edge"],
      clientX: number,
      clientY: number
    ) {
      const w = this.windows.find((w) => w.id === id);
      if (!w || w.resizable === false) return;
      this.drag.active = true;
      this.drag.resizing = true;
      this.drag.edge = edge ?? null;
      this.drag.windowId = id;
      this.drag.startX = clientX;
      this.drag.startY = clientY;
      this.drag.originX = w.rect.x;
      this.drag.originY = w.rect.y;
      this.drag.originW = w.rect.width;
      this.drag.originH = w.rect.height;
      this.bringToFront(id);
    },

    resizeTo(clientX: number, clientY: number) {
      if (
        !this.drag.active ||
        !this.drag.resizing ||
        this.drag.windowId == null
      )
        return;
      const w = this.windows.find((w) => w.id === this.drag.windowId);
      if (!w) return;

      const dx = clientX - this.drag.startX;
      const dy = clientY - this.drag.startY;

      const originX = this.drag.originX;
      const originY = this.drag.originY;
      const originW = this.drag.originW ?? w.rect.width;
      const originH = this.drag.originH ?? w.rect.height;

      // Viewport constraints
      const { vw, vh } = getViewport();
      const pad = this.desktopPadding;
      const minX = pad;
      const minY = this.menuBarHeight;

      // Anchors (fixed opposite edges)
      const eastEdge = originX + originW;
      const southEdge = originY + originH;

      // Start with original geometry
      let x = originX;
      let y = originY;
      let width = originW;
      let height = originH;

      const edge = this.drag.edge;

      // East: grow to the right, cap to viewport
      if (edge?.includes("e")) {
        const maxWidthE = Math.max(MIN_W, vw - pad - originX);
        width = clamp(originW + dx, MIN_W, maxWidthE);
      }

      // South: grow downward, cap to viewport
      if (edge?.includes("s")) {
        const maxHeightS = Math.max(MIN_H, vh - pad - originY);
        height = clamp(originH + dy, MIN_H, maxHeightS);
      }

      // West: shrink left, keep east edge anchored, cap so left doesn't cross minX
      if (edge?.includes("w")) {
        const maxWidthW = Math.max(MIN_W, eastEdge - minX);
        width = clamp(originW - dx, MIN_W, maxWidthW);
        x = eastEdge - width;
      }

      // North: shrink up, keep south edge anchored, cap so top doesn't cross minY
      if (edge?.includes("n")) {
        const maxHeightN = Math.max(MIN_H, southEdge - minY);
        height = clamp(originH - dy, MIN_H, maxHeightN);
        y = southEdge - height;
      }

      // Final safety clamp on position with resolved size (should be no-ops if above caps are correct)
      const maxX = vw - width - pad;
      const maxY = vh - height - pad;
      x = clamp(x, minX, Math.max(minX, maxX));
      y = clamp(y, minY, Math.max(minY, maxY));

      // Snap final geometry to integer pixels to prevent 1–2px page overflow
      w.rect = {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.floor(width),
        height: Math.floor(height),
      };
    },

    endResize() {
      // alias of endDrag currently
      this.endDrag();
    },

    // ---------- Maximize / Minimize ----------
    toggleMaximize(id: WindowId) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      const { vw, vh } = getViewport();
      const pad = this.desktopPadding;

      if (!w.maximized) {
        w.lastNormalRect = { ...w.rect };
        w.rect.x = pad;
        w.rect.y = this.menuBarHeight;
        w.rect.width = Math.floor(Math.max(MIN_W, vw - pad * 2));
        w.rect.height = Math.floor(
          Math.max(MIN_H, vh - this.menuBarHeight - pad)
        );
        w.maximized = true;
      } else {
        if (w.lastNormalRect) {
          w.rect = { ...w.lastNormalRect };
        }
        w.maximized = false;
      }
      this.bringToFront(id);
      this.saveSession();
    },

    minimizeWindow(id: WindowId) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      w.minimized = true;
      if (this.focusedId === id) this.focusTopMost();
      this.saveSession();
    },

    restoreWindow(id: WindowId) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      w.minimized = false;
      this.bringToFront(id);
      this.saveSession();
    },

    toggleMinimize(id: WindowId) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      if (w.minimized) this.restoreWindow(id);
      else this.minimizeWindow(id);
    },

    setWindowRect(id: WindowId, rect: Partial<OSWindowRect>) {
      const w = this.windows.find((w) => w.id === id);
      if (!w) return;
      w.rect = { ...w.rect, ...rect };
      this.ensureBounds(w);
      this.saveSession();
    },

    /**
     * Re-apply bounds to all windows (e.g., when the viewport size changes).
     * Performs a single save after adjustments.
     */
    realignAllToBounds() {
      for (const w of this.windows) {
        this.ensureBounds(w);
      }
      this.saveSession();
    },

    /**
     * Compact z-index ordering to avoid runaway growth.
     * Preserves current stacking order.
     */
    normalizeZOrder() {
      const base = 100;
      const sorted = [...this.windows].sort((a, b) => a.zIndex - b.zIndex);
      let z = base;
      for (const w of sorted) {
        w.zIndex = z++;
      }
      this.nextZ = z;
    },

    // ---------- Menu ----------
    openMenubar(index?: number) {
      this.menu.openType = "menubar";
      this.menu.menubarIndex = typeof index === "number" ? index : 0;
      this.menu.activePath = [];
      // Clear any context state
      this.menu.contextPos = null;
      this.menu.contextTemplate = null;
    },

    openContext(x: number, y: number, template: MenuTemplate) {
      this.menu.openType = "context";
      this.menu.menubarIndex = null;
      this.menu.activePath = [];
      this.menu.contextPos = { x, y };
      this.menu.contextTemplate = template;
    },

    setActivePath(path: number[]) {
      this.menu.activePath = Array.isArray(path) ? [...path] : [];
    },

    closeMenu() {
      this.menu.openType = "none";
      this.menu.menubarIndex = null;
      this.menu.activePath = [];
      this.menu.contextPos = null;
      this.menu.contextTemplate = null;
    },

    // ---------- Wallpaper ----------
    setWallpaper(wallpaper: { type: string; value: string } | null) {
      this.wallpaper = wallpaper;
      this.saveSession();
    },

    // ---------- Theme ----------
    setTheme(theme: string) {
      this.theme = theme;
      this.applyTheme(theme);
      this.saveSession();
    },

    applyTheme(theme: string) {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
    },

    initTheme() {
      // Apply theme on initialization
      this.applyTheme(this.theme);
    },
  },
});
