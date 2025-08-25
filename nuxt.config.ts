// https://nuxt.com/docs/api/configuration/nuxt-config
const baseURL = process.env.NUXT_APP_BASE_URL || '/webintosh/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    // Dynamic base URL: uses environment variable for PR previews, defaults to /webintosh/ for production
    baseURL,
    head: {
      title: 'Webintosh',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: `${baseURL}icons/system/apple.png` }
      ]
    }
  },

  nitro: {
    // Ensures correct static output (404 fallback, asset paths) for GitHub Pages
    preset: 'github-pages'
  },

  css: [
    './app/assets/css/main.css'
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@pinia/nuxt'
  ]
})