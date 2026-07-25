import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../../../app/stores/session'

describe('stores/session', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to no wallpaper and the glassmorphic-light theme', () => {
    const session = useSessionStore()
    expect(session.wallpaper).toBeNull()
    expect(session.theme).toBe('glassmorphic-light')
  })

  it('setWallpaper stores the wallpaper object', () => {
    const session = useSessionStore()
    const wallpaper = { type: 'image', value: '/wallpapers/foo.jpg' }
    session.setWallpaper(wallpaper)
    expect(session.wallpaper).toEqual(wallpaper)

    session.setWallpaper(null)
    expect(session.wallpaper).toBeNull()
  })

  it('setTheme updates state and applies the theme to the document', () => {
    const session = useSessionStore()
    session.setTheme('oldschool-dark')
    expect(session.theme).toBe('oldschool-dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('oldschool-dark')
  })

  it('applyTheme sets the data-theme attribute without touching state', () => {
    const session = useSessionStore()
    session.applyTheme('retro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('retro')
    expect(session.theme).toBe('glassmorphic-light') // unchanged
  })

  it('initDefaults assigns a default video wallpaper only when unset', () => {
    const session = useSessionStore()
    session.initDefaults()
    expect(session.wallpaper).toEqual({
      type: 'video',
      value: '/wallpapers/end-of-daylight.mp4',
    })

    const custom = { type: 'image', value: '/wallpapers/custom.jpg' }
    session.setWallpaper(custom)
    session.initDefaults()
    expect(session.wallpaper).toEqual(custom) // not overwritten
  })

  describe('loadFromSnapshot', () => {
    it('restores wallpaper and theme from a snapshot', () => {
      const session = useSessionStore()
      session.loadFromSnapshot({
        wallpaper: { type: 'color', value: '#000' },
        theme: 'oldschool-dark',
      })

      expect(session.wallpaper).toEqual({ type: 'color', value: '#000' })
      expect(session.theme).toBe('oldschool-dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('oldschool-dark')
    })

    it('falls back to default wallpaper when snapshot has none', () => {
      const session = useSessionStore()
      session.loadFromSnapshot({})
      expect(session.wallpaper).toEqual({
        type: 'video',
        value: '/wallpapers/end-of-daylight.mp4',
      })
    })

    it('leaves theme untouched when snapshot omits it', () => {
      const session = useSessionStore()
      session.loadFromSnapshot({ wallpaper: { type: 'color', value: '#111' } })
      expect(session.theme).toBe('glassmorphic-light')
    })
  })

  it('getSnapshot returns the current wallpaper and theme', () => {
    const session = useSessionStore()
    session.setWallpaper({ type: 'color', value: '#fff' })
    session.setTheme('retro')

    expect(session.getSnapshot()).toEqual({
      wallpaper: { type: 'color', value: '#fff' },
      theme: 'retro',
    })
  })
})
