import { test, expect, type Page, type Locator } from '@playwright/test'
import { seedBooted } from './helpers/boot'

// Work-area geometry at Playwright's default 1280x720 viewport, computed
// from the same constants the store uses (pad: 8, menuBarHeight: 40):
//   left:  x8,  y40, w632,  h672   (half of the 1264px-wide work area)
//   right: x640, y40, w632, h672   (the other half - tiles exactly with left)
//   top:   x8,  y40, w1264, h672   (the full work area, same as maximize)
const LEFT_RECT = { x: 8, y: 40, width: 632, height: 672 }
const RIGHT_RECT = { x: 640, y: 40, width: 632, height: 672 }
const TOP_RECT = { x: 8, y: 40, width: 1264, height: 672 }

test.beforeEach(async ({ page }) => {
  await seedBooted(page)
  await page.goto('/')
  await expect(page.locator('.menu-bar')).toBeVisible()
  // Server-rendered markup is visible before client hydration attaches Vue's
  // event handlers; `.clock` is only populated from useClock()'s onMounted
  // hook, so waiting for non-empty text is a reliable hydration-done signal.
  await expect(page.locator('.clock')).not.toHaveText('')
})

/** boundingBox() rounded to whole pixels, to absorb sub-pixel layout noise. */
async function roundedBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const box = await locator.boundingBox()
  if (!box) return null
  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
}

/**
 * Open a single blank, resizable window via File > Open Window (menu bar).
 * Scoped to `.menu-left` since `.menu-item` is also the class used by
 * dropdown entries (which live in a `<Teleport to="body">`, not `.menu-left`).
 */
async function openBlankWindow(page: Page): Promise<Locator> {
  await page.locator('.menu-left').getByText('File', { exact: true }).click()
  const dropdown = page.locator('.menu-dropdown').first()
  await dropdown.getByText('Open Window', { exact: true }).click()

  const win = page.locator('.os-window').first()
  await expect(win).toBeVisible()
  // The window-open transition (WindowManager.vue's `.window-enter-active`
  // keyframe, scale 0.88 -> 1 over 0.25s) is still running right after
  // visibility - wait for it to settle at its resting geometry before any
  // test measures boundingBox(), or it'd read the animated (scaled-down) size.
  await expect.poll(() => roundedBox(win)).toEqual({ x: 60, y: 60, width: 360, height: 220 })
  return win
}

async function dragHeaderTo(page: Page, header: Locator, targetX: number, targetY: number): Promise<{ startX: number; startY: number }> {
  const headerBox = await header.boundingBox()
  expect(headerBox).not.toBeNull()
  const startX = headerBox!.x + headerBox!.width / 2
  const startY = headerBox!.y + headerBox!.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 10 })
  return { startX, startY }
}

test('dragging to the left edge snaps to the left half, with a preview appearing/disappearing as the pointer enters/leaves the zone', async ({ page }) => {
  const win = await openBlankWindow(page)
  const header = win.locator('.os-window-header')
  const preview = page.locator('.snap-preview')

  await dragHeaderTo(page, header, 400, 300) // mid-desktop first
  await expect(preview).toHaveCount(0)

  // Enter the left snap zone.
  await page.mouse.move(2, 300, { steps: 10 })
  await expect(preview).toBeVisible()
  await expect.poll(() => roundedBox(preview)).toEqual(LEFT_RECT)

  // Leave the zone - preview should disappear.
  await page.mouse.move(500, 300, { steps: 10 })
  await expect(preview).toHaveCount(0)

  // Re-enter and release.
  await page.mouse.move(2, 300, { steps: 10 })
  await expect(preview).toBeVisible()
  await page.mouse.up()

  await expect.poll(() => roundedBox(win), { timeout: 2000 }).toEqual(LEFT_RECT)
  await expect(preview).toHaveCount(0)
})

test('dragging to the right edge snaps to the right half', async ({ page }) => {
  const win = await openBlankWindow(page)
  const header = win.locator('.os-window-header')

  await dragHeaderTo(page, header, 1278, 300)
  await page.mouse.up()

  await expect.poll(() => roundedBox(win), { timeout: 2000 }).toEqual(RIGHT_RECT)
})

test('dragging to the top edge snaps to the full work area', async ({ page }) => {
  const win = await openBlankWindow(page)
  const header = win.locator('.os-window-header')

  await dragHeaderTo(page, header, 400, 1)
  await page.mouse.up()

  await expect.poll(() => roundedBox(win), { timeout: 2000 }).toEqual(TOP_RECT)
})

test('dragging a snapped window away restores its exact pre-snap size under the cursor', async ({ page }) => {
  const win = await openBlankWindow(page)
  const header = win.locator('.os-window-header')
  const before = await roundedBox(win)

  // Snap left first.
  await dragHeaderTo(page, header, 2, 300)
  await page.mouse.up()
  await expect.poll(() => roundedBox(win), { timeout: 2000 }).toEqual(LEFT_RECT)

  // Grab the snapped window's header and drag it away from the edge.
  const targetX = LEFT_RECT.x + LEFT_RECT.width / 2 + 300
  const targetY = LEFT_RECT.y + 60
  await dragHeaderTo(page, header, targetX, targetY)
  await page.mouse.up()

  const box = await roundedBox(win)
  expect(box).not.toBeNull()
  // Pre-snap size (the window's original open size) restored exactly.
  expect(box!.width).toBe(before!.width)
  expect(box!.height).toBe(before!.height)
  // Restored under the cursor: the release point stays within the window.
  expect(targetX).toBeGreaterThanOrEqual(box!.x)
  expect(targetX).toBeLessThanOrEqual(box!.x + box!.width)
  expect(targetY).toBeGreaterThanOrEqual(box!.y)
  expect(targetY).toBeLessThanOrEqual(box!.y + box!.height)
})

test('a plain mid-desktop drag moves the window without snapping', async ({ page }) => {
  const win = await openBlankWindow(page)
  const header = win.locator('.os-window-header')
  const before = await roundedBox(win)

  const headerBox = await header.boundingBox()
  const startX = headerBox!.x + headerBox!.width / 2
  const startY = headerBox!.y + headerBox!.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 150, startY + 80, { steps: 10 })
  await expect(page.locator('.snap-preview')).toHaveCount(0)
  await page.mouse.up()

  const after = await roundedBox(win)
  expect(after).toEqual({
    x: before!.x + 150,
    y: before!.y + 80,
    width: before!.width,
    height: before!.height,
  })
})
