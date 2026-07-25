import { test, expect } from '@playwright/test'
import { isIgnorableConsoleText } from './helpers/boot'

// Deliberately does NOT seed the "already booted" flag - this is the one
// spec that pays for the full boot sequence (asset preload + typed
// animation) so the others don't have to.
test('boots past the boot screen to the desktop with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnorableConsoleText(msg.text())) {
      errors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')
  await expect(page.locator('.boot-screen')).toBeVisible()

  // Click to skip the typed animation rather than waiting out the full
  // multi-second sequence in every CI run.
  await page.locator('.boot-screen').click()

  await expect(page.locator('.boot-screen')).toBeHidden({ timeout: 15_000 })
  await expect(page.locator('.menu-bar')).toBeVisible()
  await expect(page.locator('.os-dock')).toBeVisible()

  expect(errors).toEqual([])
})
