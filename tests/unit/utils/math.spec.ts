import { describe, it, expect, afterEach, vi } from 'vitest'
import { clamp, getViewport, lerp } from '../../../app/utils/math'

describe('clamp', () => {
  it('returns the value when within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the minimum when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to the maximum when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles inverted-looking edge (min === max)', () => {
    expect(clamp(50, 10, 10)).toBe(10)
  })
})

describe('lerp', () => {
  it('interpolates linearly between two values', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
  })
})

describe('getViewport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads dimensions from document.documentElement when window/document exist', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 768, configurable: true })

    expect(getViewport()).toEqual({ vw: 1024, vh: 768 })
  })

  it('falls back to SSR defaults when window is unavailable', () => {
    vi.stubGlobal('window', undefined)
    expect(getViewport()).toEqual({ vw: 1280, vh: 800 })
  })
})
