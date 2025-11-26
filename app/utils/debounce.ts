/**
 * Debounce utility with cancel and flush support.
 * Used primarily for session persistence to avoid excessive localStorage writes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /** Call the debounced function */
  (...args: Parameters<T>): void
  /** Cancel any pending invocation */
  cancel(): void
  /** Immediately invoke if there's a pending call */
  flush(): void
  /** Check if there's a pending invocation */
  pending(): boolean
}

/**
 * Creates a debounced version of a function that delays invoking until
 * after `wait` milliseconds have elapsed since the last call.
 * 
 * @param fn - The function to debounce
 * @param wait - Milliseconds to wait before invoking (default: 500)
 * @returns Debounced function with cancel, flush, and pending methods
 * 
 * @example
 * const debouncedSave = debounce(() => saveToStorage(), 500)
 * debouncedSave() // Schedules save
 * debouncedSave() // Resets timer, only one save will occur
 * debouncedSave.flush() // Immediately saves if pending
 * debouncedSave.cancel() // Cancels pending save
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 500
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  function debounced(...args: Parameters<T>): void {
    lastArgs = args

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      if (lastArgs !== null) {
        fn(...lastArgs)
        lastArgs = null
      }
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
    }
  }

  debounced.flush = (): void => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      const args = lastArgs
      lastArgs = null
      fn(...args)
    }
  }

  debounced.pending = (): boolean => {
    return timeoutId !== null
  }

  return debounced
}

/**
 * Creates a throttled version of a function that only invokes at most
 * once per `wait` milliseconds.
 * 
 * @param fn - The function to throttle
 * @param wait - Minimum milliseconds between invocations
 * @returns Throttled function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now()
    const remaining = wait - (now - lastCall)

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn(...args)
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(...args)
      }, remaining)
    }
  }
}
