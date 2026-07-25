import { defineAsyncComponent, type Component } from 'vue'
import type { AppDescriptor } from '../types/app'

/**
 * Core app registry for Webintosh
 * Defines all available applications with their metadata
 */
export const appRegistry: AppDescriptor[] = [
  {
    id: 'finder',
    title: 'Finder',
    icon: 'icons/system/finder.png',
    emoji: '🗂️',
    kind: 'system',
  },
  {
    id: 'textedit',
    title: 'TextEdit',
    icon: 'icons/apps/textEdit.png',
    emoji: '📝',
    kind: 'app',
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    icon: 'icons/system/shortcuts.png',
    emoji: '⌨️',
    kind: 'system',
    showOnDesktop: false,
  },
  {
    id: 'about',
    title: 'About Webintosh',
    icon: 'icons/system/about.svg',
    emoji: 'ℹ️',
    kind: 'system',
    defaultRect: { x: 100, y: 80, width: 400, height: 600 },
    showOnDesktop: false,
  },
  {
    id: 'settings',
    title: 'System Settings',
    icon: 'icons/system/settings.png',
    emoji: '⚙️',
    kind: 'system',
    defaultRect: { x: 100, y: 80, width: 900, height: 600 },
  },
  {
    id: 'keystation',
    title: 'KeyStation',
    icon: 'icons/apps/keyStation.png',
    emoji: '🎹',
    kind: 'app',
    defaultRect: { x: 100, y: 80, width: 960, height: 600 },
  },
];

/**
 * Registry mapping app IDs to their Vue component implementations.
 * Uses async components for code splitting.
 */
export const APP_COMPONENTS: Record<string, Component> = {
  finder: defineAsyncComponent(() => import('../components/apps/Finder/index.vue')),
  textedit: defineAsyncComponent(() => import('../components/apps/TextEdit/index.vue')),
  shortcuts: defineAsyncComponent(() => import('../components/apps/Shortcuts/index.vue')),
  about: defineAsyncComponent(() => import('../components/apps/About/index.vue')),
  settings: defineAsyncComponent(() => import('../components/apps/Settings/index.vue')),
  keystation: defineAsyncComponent(() => import('../components/apps/KeyStation/index.vue')),
}

/**
 * Get the component for a given app ID.
 * Returns undefined if the app is not registered.
 */
export function getAppComponent(appId: string | undefined): Component | undefined {
  if (!appId) return undefined
  return APP_COMPONENTS[appId.toLowerCase()]
}

/**
 * Check if an app has a registered component.
 */
export function hasAppComponent(appId: string | undefined): boolean {
  if (!appId) return false
  return appId.toLowerCase() in APP_COMPONENTS
}

/**
 * Register a new app component at runtime.
 * Useful for plugins or dynamically loaded apps.
 */
export function registerAppComponent(appId: string, component: Component): void {
  APP_COMPONENTS[appId.toLowerCase()] = component
}
