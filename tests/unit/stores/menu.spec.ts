import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMenuStore } from '../../../app/stores/menu'
import type { MenuTemplate } from '../../../app/types/menu'

const template: MenuTemplate = { id: 'app-test', title: 'Test', sections: [] }

describe('stores/menu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts closed', () => {
    const menu = useMenuStore()
    expect(menu.openType).toBe('none')
    expect(menu.isMenuOpen).toBe(false)
  })

  it('openMenubar opens the menubar and clears context state', () => {
    const menu = useMenuStore()
    menu.openContext(10, 20, template)
    menu.openMenubar(2)

    expect(menu.openType).toBe('menubar')
    expect(menu.isMenubarOpen).toBe(true)
    expect(menu.menubarIndex).toBe(2)
    expect(menu.activePath).toEqual([])
    expect(menu.contextPos).toBeNull()
    expect(menu.contextTemplate).toBeNull()
  })

  it('openMenubar defaults to index 0 when omitted', () => {
    const menu = useMenuStore()
    menu.openMenubar()
    expect(menu.menubarIndex).toBe(0)
  })

  it('openContext opens a context menu and clears menubar state', () => {
    const menu = useMenuStore()
    menu.openMenubar(1)
    menu.openContext(50, 60, template)

    expect(menu.openType).toBe('context')
    expect(menu.isContextOpen).toBe(true)
    expect(menu.menubarIndex).toBeNull()
    expect(menu.contextPos).toEqual({ x: 50, y: 60 })
    // Pinia wraps stored objects in a reactive proxy, so it won't be the same
    // reference as `template` - compare structurally instead.
    expect(menu.contextTemplate).toEqual(template)
  })

  it('setActivePath copies the given path, defaulting to empty for non-arrays', () => {
    const menu = useMenuStore()
    const path = [1, 2]
    menu.setActivePath(path)
    expect(menu.activePath).toEqual([1, 2])
    expect(menu.activePath).not.toBe(path) // copied, not aliased

    // @ts-expect-error - exercising runtime guard against non-array input
    menu.setActivePath(null)
    expect(menu.activePath).toEqual([])
  })

  it('closeMenu resets all menu state', () => {
    const menu = useMenuStore()
    menu.openContext(1, 2, template)
    menu.setActivePath([0])
    menu.closeMenu()

    expect(menu.openType).toBe('none')
    expect(menu.menubarIndex).toBeNull()
    expect(menu.activePath).toEqual([])
    expect(menu.contextPos).toBeNull()
    expect(menu.contextTemplate).toBeNull()
  })

  it('nextSection/prevSection cycle only while the menubar is open', () => {
    const menu = useMenuStore()
    // No-op while closed
    menu.nextSection(3)
    expect(menu.menubarIndex).toBeNull()

    menu.openMenubar(0)
    menu.nextSection(3)
    expect(menu.menubarIndex).toBe(1)
    menu.nextSection(3)
    expect(menu.menubarIndex).toBe(2)
    menu.nextSection(3)
    expect(menu.menubarIndex).toBe(0) // wraps around

    menu.prevSection(3)
    expect(menu.menubarIndex).toBe(2) // wraps backward
  })
})
