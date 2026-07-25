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
 */
const IGNORED_CONSOLE_PATTERNS = [/gtag/i, /vercel\/analytics/i, /analytics/i]

export function isIgnorableConsoleText(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))
}
