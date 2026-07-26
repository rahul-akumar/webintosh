import { test, expect } from '@playwright/test'
import { seedBooted, isIgnorableConsoleText } from './helpers/boot'

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
})

test('the app shell and a previously-visited app keep working after going offline', async ({ page, context }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnorableConsoleText(msg.text())) {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  await expect(page.locator('.os-dock')).toBeVisible()

  // Wait for the service worker to be active and controlling this page.
  // The very first load of a page isn't controlled by the SW that just
  // registered on it (no "controllerchange" yet on first install), so a
  // reload may be needed before `navigator.serviceWorker.controller` is set.
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.ready
    return !!reg.active
  })

  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload()
    await expect(page.locator('.menu-bar')).toBeVisible()
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  }

  // Force one more *online* reload now that the SW is confirmed to be
  // controlling the page. This guarantees every asset the initial render
  // depends on - desktop icon chunks/styles, the dock, etc. - is actually
  // requested (and cached, via stale-while-revalidate) through the SW,
  // rather than relying on whichever subset happened to load during the
  // page's first, possibly-uncontrolled navigation above. `networkidle`
  // then gives the SW's cache writes (kicked off from its fetch handler,
  // not awaited by the page) time to settle before we go offline - under
  // parallel test workers the dev server can be slow enough that going
  // offline immediately after the *visible* render, but before those
  // writes land, caches a partial app and breaks the offline reload below.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.menu-bar')).toBeVisible()
  await expect(page.locator('.os-dock')).toBeVisible()
  // Matches the registry's desktop-visible apps (Finder, TextEdit, System
  // Settings, KeyStation - Shortcuts/About opt out via showOnDesktop).
  await expect(page.locator('.desktop-icon')).toHaveCount(4)

  // Open TextEdit while the SW controls the page, so its async component
  // chunk is fetched through the SW and cached (stale-while-revalidate).
  const icon = page.locator('.desktop-icon .icon-button[title="TextEdit"]')
  await icon.dblclick({ force: true })
  const win = page.locator('.os-window').first()
  await expect(win).toBeVisible()
  await page.waitForLoadState('networkidle')
  await win.locator('.os-window-control.close').click()
  await expect(page.locator('.os-window')).toHaveCount(0)
  await page.waitForLoadState('networkidle')

  await context.setOffline(true)
  try {
    await page.reload()

    await expect(page.locator('.menu-bar')).toBeVisible()
    await expect(page.locator('.os-dock')).toBeVisible()
    await expect(page.locator('.desktop-icon')).toHaveCount(4)

    const offlineIcon = page.locator('.desktop-icon .icon-button[title="TextEdit"]')
    await offlineIcon.dblclick({ force: true })
    const offlineWin = page.locator('.os-window').first()
    await expect(offlineWin).toBeVisible()

    expect(consoleErrors).toEqual([])
  } finally {
    await context.setOffline(false)
  }
})
