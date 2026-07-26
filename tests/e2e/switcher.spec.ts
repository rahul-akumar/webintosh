import { test, expect, type Page } from '@playwright/test'
import { seedBooted } from './helpers/boot'

// Package C: the cmd+tab-style app switcher UI. Routing, cycling and commit
// logic are seam-owned (verified by overlay-hotkeys.spec.ts) - this spec
// pins the switcher's own presentation: cells, selection highlight, and
// click-to-commit.

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  // Hydration-done signal (see windows.spec.ts): the clock only fills in
  // from a client-side onMounted hook.
  await expect(page.locator('.clock')).not.toHaveText('')
})

async function openAppFromDesktop(page: Page, title: string) {
  const icon = page.locator(`.desktop-icon .icon-button[title="${title}"]`)
  // force: the button is pointer-events:none until its parent is hovered.
  await icon.dblclick({ force: true })
  await expect(
    page.locator('.os-window', { has: page.locator(`.os-window-title:has-text("${title === 'TextEdit' ? 'Untitled' : title}")`) })
  ).toBeVisible()
}

async function focusedWindowTitle(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const wins = Array.from(document.querySelectorAll('.os-window'))
    const top = wins.sort(
      (a, b) => Number((b as HTMLElement).style.zIndex) - Number((a as HTMLElement).style.zIndex)
    )[0]
    return top?.querySelector('.os-window-title')?.textContent ?? null
  })
}

test.describe('app switcher UI', () => {
  test('shows one cell per open app with the previous app preselected, cycles and wraps', async ({ page }) => {
    await openAppFromDesktop(page, 'TextEdit')
    await openAppFromDesktop(page, 'System Settings')

    const switcher = page.getByTestId('os-app-switcher')
    const cells = switcher.locator('.switcher-cell')
    const selected = switcher.locator('.switcher-cell.is-selected')

    await page.keyboard.down('Control')
    await page.keyboard.press('Tab')
    await expect(switcher).toBeVisible()
    await expect(cells).toHaveCount(2)
    // Preselects the previous app (TextEdit, opened before Settings).
    await expect(selected).toHaveText(/TextEdit/)

    // Cycling forward wraps to the first candidate (System Settings).
    await page.keyboard.press('Tab')
    await expect(selected).toHaveText(/System Settings/)

    // Shift+Tab reverses.
    await page.keyboard.press('Shift+Tab')
    await expect(selected).toHaveText(/TextEdit/)

    // Releasing the modifier commits the current selection.
    await page.keyboard.up('Control')
    await expect(switcher).toHaveCount(0)
    expect(await focusedWindowTitle(page)).toBe('Untitled') // TextEdit's window
  })

  test('Escape while holding cancels with focus unchanged', async ({ page }) => {
    await openAppFromDesktop(page, 'TextEdit')
    await openAppFromDesktop(page, 'System Settings')

    const switcher = page.getByTestId('os-app-switcher')
    await page.keyboard.down('Control')
    await page.keyboard.press('Tab')
    await expect(switcher).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(switcher).toHaveCount(0)
    await page.keyboard.up('Control')

    expect(await focusedWindowTitle(page)).toBe('System Settings')
  })

  test('clicking a cell commits to that app', async ({ page }) => {
    await openAppFromDesktop(page, 'TextEdit')
    await openAppFromDesktop(page, 'System Settings')

    const switcher = page.getByTestId('os-app-switcher')
    // Alt rather than Control: on macOS, Chromium treats a held-Control
    // left-click as a secondary click (no `click` event fires at all), so
    // holding Control while clicking a cell can never work in that browser.
    // Alt is unaffected and is the real macOS switcher modifier anyway (the
    // seam accepts any of meta/ctrl/alt - see overlay-hotkeys.spec.ts).
    await page.keyboard.down('Alt')
    await page.keyboard.press('Tab')
    await expect(switcher).toBeVisible()

    // Click the System Settings cell (not the preselected one).
    await switcher.locator('.switcher-cell', { hasText: 'System Settings' }).click()
    await expect(switcher).toHaveCount(0)
    await page.keyboard.up('Alt')

    expect(await focusedWindowTitle(page)).toBe('System Settings')
  })
})
