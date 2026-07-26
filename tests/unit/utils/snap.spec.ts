import { describe, it, expect } from 'vitest'
import { getSnapZone, getSnapRect, SNAP_THRESHOLD } from '../../../app/utils/snap'

describe('getSnapZone', () => {
  it('returns "left" when the pointer is at or within the threshold of the left edge', () => {
    expect(getSnapZone(0, 400, 1200, SNAP_THRESHOLD)).toBe('left')
    expect(getSnapZone(SNAP_THRESHOLD, 400, 1200, SNAP_THRESHOLD)).toBe('left')
  })

  it('returns "right" when the pointer is at or within the threshold of the right edge', () => {
    expect(getSnapZone(1200, 400, 1200, SNAP_THRESHOLD)).toBe('right')
    expect(getSnapZone(1200 - SNAP_THRESHOLD, 400, 1200, SNAP_THRESHOLD)).toBe('right')
  })

  it('returns "top" when the pointer is at or within the threshold of the top edge', () => {
    expect(getSnapZone(600, 0, 1200, SNAP_THRESHOLD)).toBe('top')
    expect(getSnapZone(600, SNAP_THRESHOLD, 1200, SNAP_THRESHOLD)).toBe('top')
  })

  it('returns null just outside every threshold', () => {
    expect(getSnapZone(SNAP_THRESHOLD + 1, SNAP_THRESHOLD + 1, 1200, SNAP_THRESHOLD)).toBeNull()
    expect(getSnapZone(600, 400, 1200, SNAP_THRESHOLD)).toBeNull()
  })

  it('prefers the side zone over top at corners', () => {
    expect(getSnapZone(0, 0, 1200, SNAP_THRESHOLD)).toBe('left')
    expect(getSnapZone(1200, 0, 1200, SNAP_THRESHOLD)).toBe('right')
  })
})

describe('getSnapRect', () => {
  const viewport = { vw: 1200, vh: 800, pad: 8, menuBarHeight: 40, minW: 240, minH: 160 }

  it('top zone fills the exact work area (same rect as maximize)', () => {
    expect(getSnapRect('top', viewport)).toEqual({ x: 8, y: 40, width: 1184, height: 752 })
  })

  it('left and right halves tile the work area exactly with no gap or overlap', () => {
    const left = getSnapRect('left', viewport)
    const right = getSnapRect('right', viewport)

    expect(left).toEqual({ x: 8, y: 40, width: 592, height: 752 })
    expect(right.x).toBe(left.x + left.width)
    expect(right.x + right.width).toBe(viewport.vw - viewport.pad)
    expect(right.width).toBe(592)
    expect(right.height).toBe(752)
  })

  it('left and right halves still tile exactly on an odd work width', () => {
    const odd = { ...viewport, vw: 1201 }
    const left = getSnapRect('left', odd)
    const right = getSnapRect('right', odd)

    expect(left.width + right.width).toBe(odd.vw - odd.pad * 2)
    expect(right.x).toBe(left.x + left.width)
  })

  it('floors width/height at minW/minH on a viewport too small to halve cleanly', () => {
    const tiny = { vw: 300, vh: 300, pad: 8, menuBarHeight: 40, minW: 240, minH: 160 }
    const left = getSnapRect('left', tiny)

    expect(left.width).toBeGreaterThanOrEqual(tiny.minW)
    const top = getSnapRect('top', tiny)
    expect(top.height).toBeGreaterThanOrEqual(tiny.minH)
  })
})
