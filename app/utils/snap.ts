/**
 * Pure geometry for window edge-snapping. No DOM, no store access - callers
 * pass in viewport/pointer numbers and get back a zone or a rect.
 */
import type { OSWindowRect, SnapZone } from '../types/os'

/** Distance in px from a viewport edge that counts as "in the zone". */
export const SNAP_THRESHOLD = 12

/**
 * Determine which snap zone (if any) a pointer position falls in.
 * Pointer-position based (like Aero Snap), not window-position based.
 * Side zones win over top at corners.
 */
export function getSnapZone(clientX: number, clientY: number, vw: number, threshold: number): SnapZone | null {
  if (clientX <= threshold) return 'left'
  if (clientX >= vw - threshold) return 'right'
  if (clientY <= threshold) return 'top'
  return null
}

/** Viewport/layout inputs needed to compute a snap zone's target rect. */
export interface SnapViewport {
  vw: number
  vh: number
  pad: number
  menuBarHeight: number
  minW: number
  minH: number
}

/**
 * Compute the target rect for a snap zone.
 * - `top` fills the whole work area (same rect as maximize).
 * - `left`/`right` split the work area into two halves that tile exactly
 *   (no gap/overlap, including on odd work widths), floored at minW/minH.
 */
export function getSnapRect(zone: SnapZone, viewport: SnapViewport): OSWindowRect {
  const { vw, vh, pad, menuBarHeight, minW, minH } = viewport
  const workX = pad
  const workY = menuBarHeight
  const workWidth = Math.floor(Math.max(minW, vw - pad * 2))
  const workHeight = Math.floor(Math.max(minH, vh - menuBarHeight - pad))

  if (zone === 'top') {
    return { x: workX, y: workY, width: workWidth, height: workHeight }
  }

  const leftWidth = Math.max(minW, Math.floor(workWidth / 2))
  if (zone === 'left') {
    return { x: workX, y: workY, width: leftWidth, height: workHeight }
  }

  // Right gets whatever's left of the work area after the left half, so the
  // two tile exactly under normal conditions (only the min-size floor above
  // can break exact tiling, on a viewport too small to halve cleanly).
  const rightWidth = Math.max(minW, workWidth - leftWidth)
  const rightX = workX + workWidth - rightWidth
  return { x: rightX, y: workY, width: rightWidth, height: workHeight }
}
