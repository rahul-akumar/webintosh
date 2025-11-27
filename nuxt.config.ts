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
  devtools: { enabled: isDev },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Webintosh',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A retro-inspired web desktop (Webintosh) with apps like Typing Test and an ambient noise mixer.' },
        { name: 'theme-color', content: '#007AFF' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Webintosh' },
        { property: 'og:description', content: 'A retro-inspired web desktop with classic UI vibes.' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Webintosh' },
        { name: 'twitter:description', content: 'A retro-inspired web desktop with classic UI vibes.' }
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
    isDev ? '@nuxt/eslint' : undefined,
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-gtag'
  ].filter(Boolean),

  image: {
    screens: { sm: 640, md: 768, lg: 1024, xl: 1280 }
  },

  gtag: {
    id: 'G-1V0QJF0D55',
    config: { anonymize_ip: true }
  }
})
