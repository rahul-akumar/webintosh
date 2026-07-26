import { test, expect, type Page } from '@playwright/test'
import { seedBooted } from './helpers/boot'

// Seam spec for the OS overlay hotkey routing (launcher + app switcher).
// The overlay components are contractually identified by data-testid
// "os-launcher" and "os-app-switcher"; their visuals are owned by the
// feature packages, this spec only pins routing and state machine wiring.
//
// Real browsers never deliver macOS Cmd+Space/Cmd+Tab to the page, so the
// routing accepts any of meta/ctrl/alt; Playwright synthesizes Control
// combos regardless of host OS.

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

test.describe('launcher hotkey', () => {
  test('modifier+Space toggles the launcher and Escape closes it', async ({ page }) => {
    const launcher = page.getByTestId('os-launcher')
    await expect(launcher).toHaveCount(0)

    await page.keyboard.press('Control+Space')
    await expect(launcher).toBeAttached()

    // Toggle closed with the same combo
    await page.keyboard.press('Control+Space')
    await expect(launcher).toHaveCount(0)

    // Reopen, close with Escape
    await page.keyboard.press('Control+Space')
    await expect(launcher).toBeAttached()
    await page.keyboard.press('Escape')
    await expect(launcher).toHaveCount(0)
  })

  test('alt+Space also opens the launcher (any-modifier contract)', async ({ page }) => {
    await page.keyboard.press('Alt+Space')
    await expect(page.getByTestId('os-launcher')).toBeAttached()
    await page.keyboard.press('Escape')
  })
})

test.describe('app switcher hotkey', () => {
  test('does not appear when no windows are open', async ({ page }) => {
    await page.keyboard.down('Control')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('os-app-switcher')).toHaveCount(0)
    await page.keyboard.up('Control')
  })

  test('hold-modifier tab cycling commits on release and focuses the other app', async ({ page }) => {
    await openAppFromDesktop(page, 'TextEdit')
    await openAppFromDesktop(page, 'System Settings')

    // Settings is focused (opened last)
    const switcher = page.getByTestId('os-app-switcher')

    await page.keyboard.down('Control')
    await page.keyboard.press('Tab')
    await expect(switcher).toBeAttached()

    // Release commits: overlay gone, TextEdit (previous app) focused
    await page.keyboard.up('Control')
    await expect(switcher).toHaveCount(0)
    const focusedTitle = await page.evaluate(() => {
      const wins = Array.from(document.querySelectorAll('.os-window'))
      const top = wins.sort(
        (a, b) => Number((b as HTMLElement).style.zIndex) - Number((a as HTMLElement).style.zIndex)
      )[0]
      return top?.querySelector('.os-window-title')?.textContent ?? null
    })
    expect(focusedTitle).toBe('Untitled') // TextEdit's window
  })

  test('Escape cancels without changing focus', async ({ page }) => {
    await openAppFromDesktop(page, 'TextEdit')
    await openAppFromDesktop(page, 'System Settings')

    const switcher = page.getByTestId('os-app-switcher')
    await page.keyboard.down('Control')
    await page.keyboard.press('Tab')
    await expect(switcher).toBeAttached()
    await page.keyboard.press('Escape')
    await expect(switcher).toHaveCount(0)
    await page.keyboard.up('Control')

    // Focus unchanged: Settings still topmost
    const focusedTitle = await page.evaluate(() => {
      const wins = Array.from(document.querySelectorAll('.os-window'))
      const top = wins.sort(
        (a, b) => Number((b as HTMLElement).style.zIndex) - Number((a as HTMLElement).style.zIndex)
      )[0]
      return top?.querySelector('.os-window-title')?.textContent ?? null
    })
    expect(focusedTitle).toBe('System Settings')
  })
})

test.describe('KeyStation does not fight the overlays', () => {
  test('typing a launcher query plays no notes while KeyStation is open', async ({ page }) => {
    await openAppFromDesktop(page, 'KeyStation')
    await expect(page.locator('.key').first()).toBeVisible()

    // Sanity: with no overlay, letter keys DO light up piano keys.
    await page.keyboard.down('A')
    await expect(page.locator('.key.active').first()).toBeVisible()
    await page.keyboard.up('A')
    await expect(page.locator('.key.active')).toHaveCount(0)

    // With the launcher open, the same key must not play.
    await page.keyboard.press('Control+Space')
    await expect(page.getByTestId('os-launcher')).toBeAttached()
    await page.keyboard.down('A')
    await expect(page.locator('.key.active')).toHaveCount(0)
    await page.keyboard.up('A')
    await page.keyboard.press('Escape')
  })
})
