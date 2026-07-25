import { test, expect } from '@playwright/test'
import { seedBooted } from './helpers/boot'

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  // Server-rendered markup is visible before client hydration attaches Vue's
  // event handlers; `.clock` is only populated from useClock()'s onMounted
  // hook, so waiting for non-empty text is a reliable hydration-done signal.
  await expect(page.locator('.clock')).not.toHaveText('')
})

test('opens an app from a desktop icon, drags, minimizes/restores via the dock, and closes it', async ({ page }) => {
  const icon = page.locator('.desktop-icon .icon-button[title="TextEdit"]')
  // .icon-button is pointer-events:none until its parent .desktop-icon is
  // hovered (by design, so the label/background hover affordance shows) -
  // Playwright's actionability hit-test runs before it moves the mouse
  // there, so it never resolves the target without force.
  await icon.dblclick({ force: true })

  const win = page.locator('.os-window').first()
  await expect(win).toBeVisible()
  await expect(win.locator('.os-window-title')).toHaveText('Untitled')

  // --- Drag the window by its header ---
  const before = await win.boundingBox()
  expect(before).not.toBeNull()
  const header = win.locator('.os-window-header')
  const headerBox = await header.boundingBox()
  expect(headerBox).not.toBeNull()

  await page.mouse.move(headerBox!.x + headerBox!.width / 2, headerBox!.y + headerBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(headerBox!.x + 150, headerBox!.y + 100, { steps: 10 })
  await page.mouse.up()

  const afterDrag = await win.boundingBox()
  expect(afterDrag).not.toBeNull()
  expect(afterDrag!.x).not.toBe(before!.x)

  // --- Minimize via the window control, then restore via the Dock ---
  await win.locator('.os-window-control.minimize').click()
  await expect(win).toHaveCount(0) // unmounted once the minimize animation settles

  const dockItem = page.locator('.dock-button[title="TextEdit"]')
  await expect(dockItem).toBeVisible()
  await dockItem.click()

  const restored = page.locator('.os-window').first()
  await expect(restored).toBeVisible()

  // --- Close it ---
  await restored.locator('.os-window-control.close').click()
  await expect(page.locator('.os-window')).toHaveCount(0)
  await expect(page.locator('.dock-button[title="TextEdit"]')).toHaveCount(0)
})
