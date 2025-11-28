/**
 * Boot state management composable.
 * Tracks whether the user has completed the boot sequence this session.
 */

const BOOT_KEY = 'webintosh_booted'

/**
 * Check if user has already booted this session.
 */
export function hasBooted(): boolean {
  if (typeof sessionStorage === 'undefined') return true
  return sessionStorage.getItem(BOOT_KEY) === 'true'
}

/**
 * Mark boot as complete for this session.
 */
export function markBooted(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(BOOT_KEY, 'true')
}

/**
 * Reset boot state (for testing).
 */
export function resetBoot(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(BOOT_KEY)
}
