import { defineAsyncComponent, type Component } from 'vue'

/**
 * Registry mapping app IDs to their component implementations.
 * Uses async components for code splitting.
 */
export const APP_COMPONENTS: Record<string, Component> = {
  finder: defineAsyncComponent(() => import('../apps/Finder/index.vue')),
  textedit: defineAsyncComponent(() => import('../apps/TextEdit/index.vue')),
  shortcuts: defineAsyncComponent(() => import('../apps/Shortcuts/index.vue')),
  about: defineAsyncComponent(() => import('../apps/About/index.vue')),
  settings: defineAsyncComponent(() => import('../apps/Settings/index.vue')),
  typingtest: defineAsyncComponent(() => import('../apps/TypingTest/index.vue')),
  keystation: defineAsyncComponent(() => import('../apps/key-station/index.vue')),
  yahoomessenger: defineAsyncComponent(() => import('../apps/YahooMessenger/index.vue')),
  whitenoise: defineAsyncComponent(() => import('../apps/WhiteNoise/index.vue')),
  chess: defineAsyncComponent(() => import('../apps/Chess/index.vue')),
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
