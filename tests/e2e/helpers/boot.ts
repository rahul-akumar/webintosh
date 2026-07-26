import type { Page } from '@playwright/test'

/**
 * Matches the sessionStorage key read by app/composables/useBoot.ts.
 * Duplicated here (rather than imported) so e2e specs stay decoupled from
 * app source and can run against a built/deployed server too.
 */
const BOOT_KEY = 'webintosh_booted'

/**
 * Seed the "already booted" flag before the app's first script runs, so the
 * boot screen (OsBootScreen.vue - asset preload + typed animation) is
 * skipped entirely. Only the dedicated boot spec should pay for the real
 * boot sequence; every other spec should call this first.
 */
export async function seedBooted(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    window.sessionStorage.setItem(key, 'true')
  }, BOOT_KEY)
}

/**
 * Console messages that are expected dev-time noise, unrelated to the OS
 * under test (analytics/gtag scripts warning or failing to load locally).
 *
 * The last three entries are dev-server-only noise surfaced by the offline
 * e2e spec (tests/e2e/offline.spec.ts): with the network simulated offline,
 * Vite's HMR client can't reach its websocket, and any resource the service
 * worker deliberately doesn't cache (e.g. the large wallpaper .mp4s) fails
 * to load - both expected, neither indicating an app bug. Scoped to the
 * literal browser-level failure text so a real app console.error still
 * fails the assertion.
 */
const IGNORED_CONSOLE_PATTERNS = [
  /gtag/i,
  /vercel\/analytics/i,
  /analytics/i,
  /\[vite\] failed to connect to websocket/i,
  /WebSocket connection to '.*\/_nuxt\/.*' failed/i,
  /net::ERR_INTERNET_DISCONNECTED/,
]

export function isIgnorableConsoleText(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))
}
