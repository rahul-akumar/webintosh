// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    // Dynamic base URL: uses environment variable for PR previews, defaults to /webintosh/ for production
    baseURL: process.env.NUXT_APP_BASE_URL || '/webintosh/'
  },

  nitro: {
    // Ensures correct static output (404 fallback, asset paths) for GitHub Pages
    preset: 'github-pages'
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@pinia/nuxt'
  ]
})