<template>
  <ClientOnly>
    <Analytics />
  </ClientOnly>
  <div>
    <!-- Markup shared across all pages, ex: NavBar -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
</script>
