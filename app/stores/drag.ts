import { defineStore } from 'pinia'
import type { WindowInteractionState, WindowId, ResizeEdge, OSWindowRect } from '../types/os'
import { clamp } from '../utils/math'

/**
 * Drag store manages window drag and resize interactions using a state machine.
 * The discriminated union ensures only one interaction mode at a time.
 */
export const useDragStore = defineStore('drag', {
  state: (): { interaction: WindowInteractionState } => ({
    interaction: { mode: 'idle' },
  }),

  getters: {
    /** Whether any interaction is active */
    isActive: (state): boolean => state.interaction.mode !== 'idle',

    /** Whether currently dragging a window */
    isDragging: (state): boolean => state.interaction.mode === 'dragging',

    /** Whether currently resizing a window */
    isResizing: (state): boolean => state.interaction.mode === 'resizing',

    /** Get the window ID being interacted with (if any) */
    activeWindowId: (state): WindowId | null => {
      if (state.interaction.mode === 'idle') return null
      return state.interaction.windowId
    },

    /** Get resize edge (if resizing) */
    resizeEdge: (state): ResizeEdge | null => {
      if (state.interaction.mode === 'resizing') {
        return state.interaction.edge
      }
      return null
    },
  },

  actions: {
    /**
     * Start dragging a window.
     */
    startDrag(windowId: WindowId, clientX: number, clientY: number, originX: number, originY: number): void {
      this.interaction = {
        mode: 'dragging',
        windowId,
        startX: clientX,
        startY: clientY,
        originX,
        originY,
      }
    },

    /**
     * Start resizing a window.
     */
    startResize(windowId: WindowId, edge: ResizeEdge, clientX: number, clientY: number, originRect: OSWindowRect): void {
      this.interaction = {
        mode: 'resizing',
        windowId,
        edge,
        startX: clientX,
        startY: clientY,
        originRect: { ...originRect },
      }
    },

    /**
     * Calculate new position during drag.
     * Returns null if not dragging.
     */
    calculateDragPosition(clientX: number, clientY: number): { x: number; y: number } | null {
      if (this.interaction.mode !== 'dragging') return null

      const { startX, startY, originX, originY } = this.interaction
      const dx = clientX - startX
      const dy = clientY - startY

      return {
        x: originX + dx,
        y: originY + dy,
      }
    },

    /**
     * Calculate new geometry during resize.
     * Returns null if not resizing.
     */
    calculateResizeGeometry(
      clientX: number,
      clientY: number,
      constraints: {
        minW: number
        minH: number
        maxX: number
        maxY: number
        minX: number
        minY: number
        vw: number
        vh: number
        pad: number
      }
    ): OSWindowRect | null {
      if (this.interaction.mode !== 'resizing') return null

      const { edge, startX, startY, originRect } = this.interaction
      const { minW, minH, minX, minY, vw, vh, pad } = constraints

      const dx = clientX - startX
      const dy = clientY - startY

      // Anchors (fixed opposite edges)
      const eastEdge = originRect.x + originRect.width
      const southEdge = originRect.y + originRect.height

      // Start with original geometry
      let x = originRect.x
      let y = originRect.y
      let width = originRect.width
      let height = originRect.height

      // East: grow to the right, cap to viewport
      if (edge.includes('e')) {
        const maxWidthE = Math.max(minW, vw - pad - originRect.x)
        width = clamp(originRect.width + dx, minW, maxWidthE)
      }

      // South: grow downward, cap to viewport
      if (edge.includes('s')) {
        const maxHeightS = Math.max(minH, vh - pad - originRect.y)
        height = clamp(originRect.height + dy, minH, maxHeightS)
      }

      // West: shrink left, keep east edge anchored
      if (edge.includes('w')) {
        const maxWidthW = Math.max(minW, eastEdge - minX)
        width = clamp(originRect.width - dx, minW, maxWidthW)
        x = eastEdge - width
      }

      // North: shrink up, keep south edge anchored
      if (edge.includes('n')) {
        const maxHeightN = Math.max(minH, southEdge - minY)
        height = clamp(originRect.height - dy, minH, maxHeightN)
        y = southEdge - height
      }

      // Final safety clamp on position
      const finalMaxX = vw - width - pad
      const finalMaxY = vh - height - pad
      x = clamp(x, minX, Math.max(minX, finalMaxX))
      y = clamp(y, minY, Math.max(minY, finalMaxY))

      // Snap to integer pixels
      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.floor(width),
        height: Math.floor(height),
      }
    },

    /**
     * End any active interaction.
     */
    endInteraction(): void {
      this.interaction = { mode: 'idle' }
    },

    /**
     * Check if we're interacting with a specific window.
     */
    isInteractingWith(windowId: WindowId): boolean {
      if (this.interaction.mode === 'idle') return false
      return this.interaction.windowId === windowId
    },
  },
})
