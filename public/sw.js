// Hand-rolled offline service worker for Webintosh.
//
// Strategy:
// - Navigation requests (page loads/reloads) -> network-first, falling back
//   to the cached app shell when the network is unavailable. The shell is
//   cached on install and refreshed on every successful navigation fetch, so
//   it never goes stale under normal (online) use.
// - All other same-origin GET requests (JS/CSS chunks, icons, JSON, etc.)
//   -> stale-while-revalidate: serve from cache immediately if present while
//   refreshing the cache in the background, falling back to network when
//   nothing is cached yet.
// - Only same-origin GET requests are handled at all; everything else
//   (cross-origin, POST, etc.) passes straight through to the network.
// - `.mp4` wallpapers are skipped entirely - too large to be worth caching.
// - Only `response.ok` responses are ever written to the cache.
//
// The shell URL is derived from `self.registration.scope` rather than a
// hardcoded '/', so this keeps working when the app is deployed under a
// non-root baseURL (e.g. GitHub Pages' `/webintosh/`).

const CACHE_VERSION = 'v1'
const CACHE_NAME = `webintosh-${CACHE_VERSION}`

function getShellUrl() {
  return self.registration.scope
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        await cache.add(getShellUrl())
      } catch {
        // Best-effort: if the network is unavailable at install time, the
        // shell simply isn't cached yet - it will be on the first
        // successful navigation fetch instead.
      }
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('webintosh-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function shouldSkipCaching(url) {
  return url.pathname.endsWith('.mp4')
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      await cache.put(getShellUrl(), response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(getShellUrl())
    if (cached) return cached
    throw new Error('offline and no cached app shell available')
  }
}

// Some dev-server URLs (Vue SFC `<style>` blocks under Vite) serve different
// content for the identical URL depending on *how* they're requested - once
// as a real stylesheet (`<link rel="stylesheet">`) and once as a JS module
// that injects the style (an `import` from another module, for HMR). The
// Cache API keys purely by URL, so caching both variants under the same key
// would let whichever was cached first clobber the other. Namespacing the
// cache key by `request.destination` keeps them independent while the real
// network fetch (below) still uses the untouched request.
function cacheKeyFor(request) {
  const key = new URL(request.url)
  if (request.destination) key.searchParams.set('__swdest', request.destination)
  return key.toString()
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cacheKey = cacheKeyFor(request)
  const cached = await cache.match(cacheKey)

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(cacheKey, response.clone())
      }
      return response
    })
    .catch(() => undefined)

  if (cached) {
    // Refresh in the background; don't make the caller wait on it.
    networkFetch.catch(() => {})
    return cached
  }

  const networked = await networkFetch
  if (networked) return networked
  throw new Error('offline and no cached response available')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (!isSameOrigin(url)) return
  if (shouldSkipCaching(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})
