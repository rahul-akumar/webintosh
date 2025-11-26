<template>
  <div class="os-root">
    <!-- Wallpaper layer - full viewport background -->
    <div
      class="os-wallpaper"
      :class="{ 'has-wallpaper': !!wallpaperData }"
      :style="wallpaperStyle"
    >
      <!-- Video wallpaper -->
      <video
        v-if="wallpaperType === 'video'"
        :src="wallpaperSrc"
        autoplay
        loop
        muted
        playsinline
        class="wallpaper-video"
      />
      <!-- GIF wallpaper -->
      <img
        v-else-if="wallpaperType === 'gif'"
        :src="wallpaperSrc"
        class="wallpaper-image"
      />
    </div>

    <!-- MenuBar positioned over wallpaper -->
    <OsMenuBar />

    <!-- Desktop area with apps and windows -->
    <main class="os-desktop-area">
      <OsDesktop />
      <OsWindowManager />
      <OsDock />
      <OsContextMenu
        v-if="
          store.menu.openType === 'context' &&
          store.menu.contextTemplate &&
          store.menu.contextPos
        "
        :sections="store.menu.contextTemplate.sections"
        :origin="store.menu.contextPos"
        :z="3000"
        @executed="store.closeMenu()"
        @request-close="store.closeMenu()"
      />
      <OsNotifications />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from "../stores/os";
import { useAppsStore } from "../stores/apps";
import { onMounted, computed } from "vue";
import { registerDefaultCommands } from "../composables/menuCommands";
import { useGlobalChat } from "../composables/useGlobalChat";
import { appRegistry } from "../config/apps";

defineOptions({ name: "AppRoot" });

const store = useOSStore();
const apps = useAppsStore();

// Parse wallpaper data
const wallpaperData = computed(() => {
  // wallpaper is now always an object or null from the store
  return store.wallpaper;
});

// Determine wallpaper type
const wallpaperType = computed(() => {
  if (!wallpaperData.value) return null;
  return wallpaperData.value.type;
});

// Extract source URL for video/gif
const wallpaperSrc = computed(() => {
  if (!wallpaperData.value) return "";
  return wallpaperData.value.value;
});

// Wallpaper style computed property for CSS-based wallpapers
const wallpaperStyle = computed(() => {
  const type = wallpaperType.value;

  // Video and GIF are handled by elements
  if (type === "video" || type === "gif") return {};

  if (!wallpaperData.value) return {};

  if (wallpaperData.value.type === "image") {
    return {
      backgroundImage: `url(${wallpaperData.value.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  // Gradient or solid color
  return {
    background: wallpaperData.value.value,
  };
});

onMounted(() => {
  // Register menu commands
  registerDefaultCommands();

  // Initialize OS Store
  store.loadSession();

  // Apply saved theme
  store.initTheme();

  // Start global chat notifications
  const { initializeGlobalListeners } = useGlobalChat();
  initializeGlobalListeners();

  // Load persisted session first

  // Load icon positions and layout early
  apps.loadIconPositions();
  apps.loadIconLayout();

  // Do not auto-open any window on fresh sessions

  // Register core apps from config
  apps.registerApps(appRegistry);
  // Load Dock minimized ordering (Dock now shows minimized apps only)
  apps.loadMinOrder();
});
</script>

<style>
/* Use border-box globally to avoid 1–2px overflow from borders/padding */
*,
*::before,
*::after {
  box-sizing: border-box;
}
html,
body,
#__nuxt {
  height: 100%;
  overflow: hidden; /* Prevent page-level scrollbars; only windows may scroll internally */
}
body {
  margin: 0;
  background: #f5f6f8;
  color: #111;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
button {
  border: none;
}
.os-root {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* Wallpaper layer */
.os-wallpaper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: var(--bg-desktop, #1a1a1a);
}

.os-wallpaper.has-wallpaper {
  /* Remove default background when custom wallpaper is set */
  background-color: transparent;
}

.wallpaper-video,
.wallpaper-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* MenuBar now positioned over the wallpaper */
.os-menubar {
  position: relative;
  z-index: 100;
}

/* Desktop area positioned below menubar but above wallpaper */
.os-desktop-area {
  position: relative;
  height: calc(100vh - 40px);
  user-select: none;
  overflow: hidden;
  z-index: 1;
}
</style>
