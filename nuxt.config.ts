// https://nuxt.com/docs/api/configuration/nuxt-config

// Environment-aware configuration
const isDev = process.env.NODE_ENV === 'development'
const isVercel = process.env.VERCEL === '1'
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || (!isDev && !isVercel && process.env.NUXT_APP_BASE_URL === '/webintosh/')

// Dynamic base URL based on environment
let baseURL = '/'
if (isGitHubPages) {
  baseURL = process.env.NUXT_APP_BASE_URL || '/webintosh/'
} else if (process.env.NUXT_APP_BASE_URL) {
  baseURL = process.env.NUXT_APP_BASE_URL
}

// Dynamic nitro preset based on environment
let nitroPreset: string | undefined = undefined
if (isGitHubPages) {
  nitroPreset = 'github-pages'
} else if (isVercel) {
  nitroPreset = 'vercel'
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    baseURL,
    head: {
      title: 'Webintosh',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: `${baseURL}icons/system/apple.png` }
      ],
    }
  },

  nitro: nitroPreset ? { preset: nitroPreset } : {},

  css: [
    './app/assets/css/main.css'
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-gtag'
  ],

  // Google Analytics configuration
  // @ts-ignore - nuxt-gtag module types
  gtag: {
    id: 'G-1V0QJF0D55'
  }
})