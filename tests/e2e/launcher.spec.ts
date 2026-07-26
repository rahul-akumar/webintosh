import { test, expect } from '@playwright/test'
import { seedBooted } from './helpers/boot'

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  // Hydration-done signal (see windows.spec.ts): the clock only fills in
  // from a client-side onMounted hook.
  await expect(page.locator('.clock')).not.toHaveText('')
})

test('is hidden by default', async ({ page }) => {
  await expect(page.getByTestId('os-launcher')).toHaveCount(0)
})

test('Control+Space opens the launcher with the search input focused', async ({ page }) => {
  await page.keyboard.press('Control+Space')

  const launcher = page.getByTestId('os-launcher')
  await expect(launcher).toBeAttached()
  await expect(launcher).toBeVisible()

  await expect(page.getByTestId('os-launcher-input')).toBeFocused()
})

test('typing filters apps and ranks the best match first', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await page.getByTestId('os-launcher-input').fill('key')

  const rows = page.locator('.launcher-row')
  await expect(rows.first()).toBeVisible()
  await expect(rows.first()).toContainText('KeyStation')
})

test('a query with no matches shows the empty state', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await page.getByTestId('os-launcher-input').fill('zzz')

  await expect(page.locator('.launcher-empty')).toBeVisible()
  await expect(page.locator('.launcher-empty')).toHaveText('No results')
  await expect(page.locator('.launcher-row')).toHaveCount(0)
})

test('Enter launches the selected app and closes the launcher', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await page.getByTestId('os-launcher-input').fill('key')
  await expect(page.locator('.launcher-row').first()).toContainText('KeyStation')

  await page.keyboard.press('Enter')

  await expect(page.getByTestId('os-launcher')).toHaveCount(0)
  await expect(
    page.locator('.os-window', { has: page.locator('.os-window-title:has-text("KeyStation")') })
  ).toBeVisible()
})

test('ArrowDown/ArrowUp move the selection and wrap', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  const input = page.getByTestId('os-launcher-input')

  // Empty query -> full registry list; move down through it and back up
  // past the top to confirm wrap-around in both directions.
  const rows = page.locator('.launcher-row')
  const count = await rows.count()
  expect(count).toBeGreaterThan(1)

  await expect(rows.nth(0)).toHaveClass(/is-selected/)
  await input.press('ArrowUp')
  await expect(rows.nth(count - 1)).toHaveClass(/is-selected/)
  await input.press('ArrowDown')
  await expect(rows.nth(0)).toHaveClass(/is-selected/)
})

test('clicking a row launches that app', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await page.getByTestId('os-launcher-input').fill('key')
  await page.locator('.launcher-row', { hasText: 'KeyStation' }).click()

  await expect(page.getByTestId('os-launcher')).toHaveCount(0)
  await expect(
    page.locator('.os-window', { has: page.locator('.os-window-title:has-text("KeyStation")') })
  ).toBeVisible()
})

test('Escape closes the launcher', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await expect(page.getByTestId('os-launcher')).toBeAttached()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('os-launcher')).toHaveCount(0)
})

test('clicking the backdrop closes the launcher', async ({ page }) => {
  await page.keyboard.press('Control+Space')
  await expect(page.getByTestId('os-launcher')).toBeAttached()

  // Click near the top-left corner of the viewport - outside the centered
  // panel, but still inside the full-viewport backdrop.
  await page.mouse.click(5, 5)
  await expect(page.getByTestId('os-launcher')).toHaveCount(0)
})
