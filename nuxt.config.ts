// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    // Required for GitHub Project Pages at https://rahul-akumar.github.io/webintosh/
    baseURL: '/webintosh/'
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