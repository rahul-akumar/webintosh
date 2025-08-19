// Menu Templates Resolver (Phase 2)
import type { MenuTemplate } from '../../../../types/menu'
import { createSystemMenuTemplate } from './systemMenu'
import { createFinderMenuTemplate } from '../../apps/Finder/finderMenu'
import { createTextEditMenuTemplate } from '../../apps/TextEdit/textEditMenu'
import { createDockMenuForApp } from './dockMenu'

/**
 * Return the system (desktop) menu template.
 */
export function getSystemMenuTemplate(): MenuTemplate {
  return createSystemMenuTemplate()
}

/**
 * Resolve an app-specific menu template by appId.
 * Falls back to a system-like template with a custom title when unknown.
 */
export function getAppMenuTemplate(appId: string, appTitle?: string): MenuTemplate {
  switch ((appId || '').toLowerCase()) {
    case 'finder':
      return createFinderMenuTemplate()
    case 'textedit':
      return createTextEditMenuTemplate()
    case 'about':
      // About app shows the desktop menubar itself
      return createSystemMenuTemplate()
    default: {
      const base = createSystemMenuTemplate()
      return {
        ...base,
        id: `app-${appId || 'unknown'}`,
        title: appTitle ?? 'App'
      }
    }
  }
}

/**
 * Optional helper: list of known app ids with first-party menus.
 */
export const KnownMenuApps = new Set<string>(['finder', 'textedit'])

// Re-export Dock context menu builder
export { createDockMenuForApp }