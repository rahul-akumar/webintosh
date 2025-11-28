/**
 * Shared math utilities for the OS.
 * Extracted to avoid duplication across stores.
 */

/**
 * Clamp a number between min and max bounds.
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Get viewport dimensions.
 * Returns fallback values during SSR.
 */
export function getViewport(): { vw: number; vh: number } {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const docEl = document.documentElement
    return { vw: docEl.clientWidth, vh: docEl.clientHeight }
  }
  // SSR fallback
  return { vw: 1280, vh: 800 }
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
