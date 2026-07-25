import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle } from '../../../app/utils/debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays invocation until wait has elapsed', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('collapses rapid successive calls into a single invocation with the latest args', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced('a')
    vi.advanceTimersByTime(200)
    debounced('b')
    vi.advanceTimersByTime(200)
    debounced('c')
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('cancel() prevents a pending invocation', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(1000)

    expect(fn).not.toHaveBeenCalled()
    expect(debounced.pending()).toBe(false)
  })

  it('flush() invokes immediately if a call is pending', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced('x')
    expect(debounced.pending()).toBe(true)
    debounced.flush()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('x')
    expect(debounced.pending()).toBe(false)

    // Flushing again with nothing pending is a no-op
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('pending() reflects whether an invocation is scheduled', () => {
    const debounced = debounce(vi.fn(), 500)
    expect(debounced.pending()).toBe(false)
    debounced()
    expect(debounced.pending()).toBe(true)
    vi.advanceTimersByTime(500)
    expect(debounced.pending()).toBe(false)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invokes immediately on the first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 200)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('suppresses calls within the wait window, then trails at most once', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 200)

    throttled('first')
    throttled('second')
    // Only the call that schedules the trailing timeout (the first one
    // inside the window) is queued - later calls within the same window are
    // dropped entirely, not merged, so 'third' never reaches fn.
    throttled('third')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('second')
  })
})
