// Registers the offline service worker (public/sw.js).
//
// Gated to production and Playwright (`navigator.webdriver`) so local dev
// stays SW-free - a service worker intercepting fetches would fight with
// Vite's HMR websocket/module reloads during `nuxt dev`.
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return
  if (!(import.meta.env.PROD || navigator.webdriver)) return

  const { app } = useRuntimeConfig()
  const baseURL = app.baseURL

  navigator.serviceWorker.register(`${baseURL}sw.js`, { scope: baseURL })
})
