/**
 * Shared vitest setup for unit specs.
 *
 * Store specs run under plain vitest (happy-dom environment), not the full
 * Nuxt runtime, so Nuxt auto-imports aren't available. `useAssetUrl`
 * (app/composables/useAssetUrl.ts) calls `useNuxtApp()` internally, and
 * `stores/session.ts`'s `initDefaults()` - reached from `stores/os.ts`'s
 * `loadSession()` - depends on it. Rather than pull in `@nuxt/test-utils`'s
 * `environment: 'nuxt'` (which boots a real Nuxt/Vite SSR context per test
 * file and is comparatively slow/fragile), we stub the composable directly.
 * This keeps store tests fast, deterministic, and isolated.
 */
import { vi } from 'vitest'

vi.mock('../../app/composables/useAssetUrl', () => ({
  useAssetUrl: (path?: string): string | undefined => {
    if (!path) return undefined
    if (path.startsWith('http') || path.startsWith('data:')) return path
    return `/${path.startsWith('/') ? path.slice(1) : path}`
  },
}))
