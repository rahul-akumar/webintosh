import { test, expect } from '@playwright/test'
import { seedBooted } from './helpers/boot'

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  // The menubar/desktop markup is server-rendered, so it's visible before
  // client hydration attaches Vue's event handlers. `.clock` starts empty
  // and is only populated from useClock()'s onMounted hook, so waiting for
  // it to be non-empty is a reliable "hydration is done" signal.
  await expect(page.locator('.clock')).not.toHaveText('')
})

test('opens a menubar menu and invokes About Webintosh', async ({ page }) => {
  await page.locator('.menu-logo').click()

  const dropdown = page.locator('.menu-dropdown').first()
  await expect(dropdown).toBeVisible()

  // "About Webintosh" appears twice: the dedicated menu item, and again in
  // the app-launcher list (every registered app, including About itself, is
  // listed there) - either one opens the same About window, so take the first.
  await dropdown.getByText('About Webintosh', { exact: true }).first().click()

  const aboutWindow = page.locator('.os-window', {
    has: page.locator('.os-window-title', { hasText: 'About Webintosh' }),
  })
  await expect(aboutWindow).toBeVisible()
})

test('opens a context menu on the desktop', async ({ page }) => {
  await page.locator('.os-desktop').click({ button: 'right', position: { x: 400, y: 300 } })

  const ctxMenu = page.locator('.menu-dropdown').first()
  await expect(ctxMenu).toBeVisible()
  await expect(ctxMenu.getByText('Change Wallpaper...')).toBeVisible()
  await expect(ctxMenu.getByText('Clean Up Icons')).toBeVisible()
})
