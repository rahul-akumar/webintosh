import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppsStore } from '../../../app/stores/apps'
import { useOSStore } from '../../../app/stores/os'
import type { AppDescriptor } from '../../../app/types/app'

const descriptors: AppDescriptor[] = [
  { id: 'finder', title: 'Finder', kind: 'system' },
  { id: 'textedit', title: 'TextEdit', kind: 'app' },
]

describe('stores/apps', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('registerApps', () => {
    it('populates the registry, defaulting kind to "app"', () => {
      const apps = useAppsStore()
      apps.registerApps([{ id: 'finder', title: 'Finder' }, ...descriptors])

      expect(apps.registry.finder).toEqual({ id: 'finder', title: 'Finder', kind: 'system' })
      expect(apps.registry.textedit.kind).toBe('app')
    })
  })

  describe('pin / unpin / togglePin', () => {
    it('togglePin adds then removes an id, persisting to localStorage', () => {
      const apps = useAppsStore()
      apps.togglePin('finder')
      expect(apps.isPinned('finder')).toBe(true)
      expect(JSON.parse(localStorage.getItem('webintosh:dock:v1:pins')!)).toEqual(['finder'])

      apps.togglePin('finder')
      expect(apps.isPinned('finder')).toBe(false)
      expect(JSON.parse(localStorage.getItem('webintosh:dock:v1:pins')!)).toEqual([])
    })

    it('pinApp is idempotent', () => {
      const apps = useAppsStore()
      apps.pinApp('finder')
      apps.pinApp('finder')
      expect(apps.pinned).toEqual(['finder'])
    })

    it('unpinApp removes an id even if never pinned', () => {
      const apps = useAppsStore()
      apps.pinApp('finder')
      apps.unpinApp('textedit')
      expect(apps.pinned).toEqual(['finder'])
      apps.unpinApp('finder')
      expect(apps.pinned).toEqual([])
    })
  })

  describe('pinnedDescriptors', () => {
    it('filters out pinned ids with no matching registry entry', () => {
      const apps = useAppsStore()
      apps.registerApps(descriptors)
      apps.pinApp('finder')
      apps.pinApp('deleted-app') // unknown id, e.g. a culled app left in storage

      expect(apps.pinnedDescriptors).toEqual([apps.registry.finder])
    })
  })

  describe('icon positions', () => {
    it('loadIconPositions reads valid JSON from localStorage', () => {
      const apps = useAppsStore()
      localStorage.setItem('webintosh:desktop:v1:iconPositions', JSON.stringify({ finder: { x: 10, y: 20 } }))
      apps.loadIconPositions()
      expect(apps.iconPositions).toEqual({ finder: { x: 10, y: 20 } })
    })

    it('loadIconPositions tolerates corrupt JSON by leaving state untouched', () => {
      const apps = useAppsStore()
      localStorage.setItem('webintosh:desktop:v1:iconPositions', '{not valid json')
      expect(() => apps.loadIconPositions()).not.toThrow()
      expect(apps.iconPositions).toEqual({})
    })

    it('setIconPosition updates state and persists immediately', () => {
      const apps = useAppsStore()
      apps.setIconPosition('finder', 5, 6)
      expect(apps.iconPositions.finder).toEqual({ x: 5, y: 6 })
      expect(JSON.parse(localStorage.getItem('webintosh:desktop:v1:iconPositions')!)).toEqual({
        finder: { x: 5, y: 6 },
      })
    })

    it('cleanUpIcons clears all positions', () => {
      const apps = useAppsStore()
      apps.setIconPosition('finder', 5, 6)
      apps.cleanUpIcons()
      expect(apps.iconPositions).toEqual({})
      expect(JSON.parse(localStorage.getItem('webintosh:desktop:v1:iconPositions')!)).toEqual({})
    })
  })

  describe('icon layout', () => {
    it('loadIconLayout only accepts known enum values', () => {
      const apps = useAppsStore()
      localStorage.setItem(
        'webintosh:desktop:v1:iconLayout',
        JSON.stringify({ direction: 'bogus', sortBy: 'name', size: 'huge' })
      )
      apps.loadIconLayout()

      // Invalid enum values are ignored, valid ones applied
      expect(apps.iconLayoutDirection).toBe('left')
      expect(apps.iconSortBy).toBe('name')
      expect(apps.iconSize).toBe('medium')
    })

    it('loadIconLayout tolerates corrupt JSON', () => {
      const apps = useAppsStore()
      localStorage.setItem('webintosh:desktop:v1:iconLayout', '{bad')
      expect(() => apps.loadIconLayout()).not.toThrow()
    })
  })

  describe('minimized order', () => {
    it('loadMinOrder falls back to an empty array on corrupt JSON', () => {
      const apps = useAppsStore()
      localStorage.setItem('webintosh:dock:v1:minOrder', 'not json')
      apps.loadMinOrder()
      expect(apps.minimizedOrder).toEqual([])
    })

    it('orderMinimizedAppIds preserves known order and appends new ids', () => {
      const apps = useAppsStore()
      apps.minimizedOrder = ['b', 'a']
      expect(apps.orderMinimizedAppIds(['a', 'b', 'c'])).toEqual(['b', 'a', 'c'])
    })

    it('moveInMinOrder inserts source before target', () => {
      const apps = useAppsStore()
      apps.minimizedOrder = ['a', 'b', 'c']
      apps.moveInMinOrder('c', 'a')
      expect(apps.minimizedOrder).toEqual(['c', 'a', 'b'])
    })

    it('moveInMinOrder appends to the end when target is null', () => {
      const apps = useAppsStore()
      apps.minimizedOrder = ['a', 'b']
      apps.moveInMinOrder('a', null)
      expect(apps.minimizedOrder).toEqual(['b', 'a'])
    })
  })

  describe('getSortedAppList', () => {
    it('sorts by name when iconSortBy is "name"', () => {
      const apps = useAppsStore()
      apps.registerApps([
        { id: 'z', title: 'Zeta' },
        { id: 'a', title: 'Alpha' },
      ])
      apps.iconSortBy = 'name'
      expect(apps.getSortedAppList().map((a) => a.id)).toEqual(['a', 'z'])
    })

    it('returns registration order when iconSortBy is "none"', () => {
      const apps = useAppsStore()
      apps.registerApps([
        { id: 'z', title: 'Zeta' },
        { id: 'a', title: 'Alpha' },
      ])
      apps.iconSortBy = 'none'
      expect(apps.getSortedAppList().map((a) => a.id)).toEqual(['z', 'a'])
    })
  })

  describe('launchOrFocus', () => {
    it('opens a new window using the app default rect when none is running', () => {
      const apps = useAppsStore()
      const os = useOSStore()
      apps.registerApps([{ id: 'textedit', title: 'TextEdit', defaultRect: { x: 1, y: 2, width: 300, height: 200 } }])
      apps.launchOrFocus('textedit')

      expect(os.windows).toHaveLength(1)
      expect(os.windows[0]!.appId).toBe('textedit')
      expect(os.windows[0]!.title).toBe('Untitled') // textedit special-cased
    })

    it('brings an existing non-minimized window to front instead of opening a new one', () => {
      const apps = useAppsStore()
      const os = useOSStore()
      apps.registerApps([{ id: 'textedit', title: 'TextEdit' }])

      const id = os.openWindow({ appId: 'textedit', title: 'Doc' })
      apps.launchOrFocus('textedit')

      expect(os.windows).toHaveLength(1)
      expect(os.focusedId).toBe(id)
    })
  })
})
