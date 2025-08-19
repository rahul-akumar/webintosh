<template>
  <div class="settings-app">
    <!-- Left Sidebar -->
    <div class="settings-sidebar">
      <div class="sidebar-header">
        <input 
          type="search" 
          placeholder="Search"
          class="search-input"
          v-model="searchQuery"
        />
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="item in filteredNavItems"
          :key="item.id"
          @click="activePanel = item.id"
          :class="['nav-item', { active: activePanel === item.id }]"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="settings-content">
      <!-- Wallpaper Panel -->
      <div v-if="activePanel === 'wallpaper'" class="panel">
        <h1 class="panel-title">Wallpaper</h1>
        
        <div class="wallpaper-sections">
          <!-- Current Wallpaper Preview -->
          <div class="current-wallpaper">
            <h2 class="section-title">Current Wallpaper</h2>
            <div class="wallpaper-preview" :style="previewStyle">
              <span v-if="!currentWallpaper" class="preview-placeholder">No wallpaper set</span>
            </div>
          </div>

          <!-- Wallpaper Options -->
          <div class="wallpaper-options">
            <!-- Static Wallpapers -->
            <div class="wallpaper-section">
              <h3 class="option-title">Static Wallpapers</h3>
              <div class="wallpaper-grid">
                <button
                  v-for="wallpaper in staticWallpapers"
                  :key="wallpaper.id"
                  @click="setWallpaper(wallpaper.value)"
                  class="wallpaper-item"
                  :style="{ backgroundImage: wallpaper.value }"
                  :title="wallpaper.name"
                >
                  <span class="wallpaper-name">{{ wallpaper.name }}</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Wallpapers -->
            <div class="wallpaper-section">
              <h3 class="option-title">Dynamic Wallpapers</h3>
              <div class="wallpaper-grid">
                <button
                  v-for="wallpaper in dynamicWallpapers"
                  :key="wallpaper.id"
                  @click="setWallpaper(wallpaper.value)"
                  class="wallpaper-item dynamic"
                  :title="wallpaper.name"
                >
                  <span class="wallpaper-icon">🌅</span>
                  <span class="wallpaper-name">{{ wallpaper.name }}</span>
                </button>
              </div>
            </div>

            <!-- Live Wallpapers -->
            <div class="wallpaper-section">
              <h3 class="option-title">Live Wallpapers</h3>
              <div class="wallpaper-grid">
                <button
                  v-for="wallpaper in liveWallpapers"
                  :key="wallpaper.id"
                  @click="setWallpaper(wallpaper.value)"
                  class="wallpaper-item live"
                  :title="wallpaper.name"
                >
                  <span class="wallpaper-icon">🎬</span>
                  <span class="wallpaper-name">{{ wallpaper.name }}</span>
                </button>
              </div>
            </div>

            <!-- Solid Colors -->
            <div class="wallpaper-section">
              <h3 class="option-title">Solid Colors</h3>
              <div class="wallpaper-grid">
                <button
                  v-for="color in solidColors"
                  :key="color.id"
                  @click="setWallpaper(color.value)"
                  class="wallpaper-item color"
                  :style="{ background: color.value }"
                  :title="color.name"
                >
                  <span class="wallpaper-name">{{ color.name }}</span>
                </button>
              </div>
            </div>

            <!-- Gradients -->
            <div class="wallpaper-section">
              <h3 class="option-title">Gradients</h3>
              <div class="wallpaper-grid">
                <button
                  v-for="gradient in gradients"
                  :key="gradient.id"
                  @click="setWallpaper(gradient.value)"
                  class="wallpaper-item gradient"
                  :style="{ background: gradient.value }"
                  :title="gradient.name"
                >
                  <span class="wallpaper-name">{{ gradient.name }}</span>
                </button>
              </div>
            </div>

            <!-- Upload Custom -->
            <div class="wallpaper-section">
              <h3 class="option-title">Add custom wallpaper</h3>
              <div class="upload-section">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload"
                  id="wallpaper-upload"
                  class="file-input"
                />
                <label for="wallpaper-upload" class="upload-button">
                  <span class="upload-icon">📁</span>
                  <span>Upload</span>
                </label>
                <label @click="handleUrlInput" class="upload-button">
                  <span class="upload-icon">🔗</span>
                  <span>Add URL</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sound Panel -->
      <div v-else-if="activePanel === 'sound'" class="panel">
        <h1 class="panel-title">Sound</h1>
        <p class="placeholder-text">Sound settings will be available in a future update.</p>
      </div>

      <!-- Account Panel -->
      <div v-else-if="activePanel === 'account'" class="panel">
        <h1 class="panel-title">Account</h1>
        <p class="placeholder-text">Account settings will be available in a future update.</p>
      </div>

      <!-- Appearance Panel -->
      <div v-else-if="activePanel === 'appearance'" class="panel">
        <h1 class="panel-title">Appearance</h1>
        <p class="placeholder-text">Appearance settings will be available in a future update.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useOSStore } from '../../../../stores/os'
import { useAssetUrl } from '../../../../app/composables/useAssetUrl'
import type { OSWindowModel } from '../../../../types/os'

defineOptions({ name: 'SettingsApp' })

// Inject the window model if available
const winModel = inject<OSWindowModel>('window', null)

const osStore = useOSStore()
const searchQuery = ref('')
const activePanel = ref('wallpaper')
const currentWallpaper = ref('')

// Navigation items
const navItems = [
  { id: 'wallpaper', label: 'Wallpaper', icon: '🖼️' },
  { id: 'sound', label: 'Sound', icon: '🔊' },
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' }
]

// Filter navigation items based on search
const filteredNavItems = computed(() => {
  if (!searchQuery.value) return navItems
  const query = searchQuery.value.toLowerCase()
  return navItems.filter(item => 
    item.label.toLowerCase().includes(query)
  )
})

// Wallpaper preview style
const previewStyle = computed(() => {
  if (!currentWallpaper.value) return {}
  if (currentWallpaper.value.startsWith('url(')) {
    return { backgroundImage: currentWallpaper.value }
  }
  return { background: currentWallpaper.value }
})

// Wallpaper options data
const staticWallpapers = [
  { id: 'mac', name: 'mac', value: `url("${useAssetUrl('wallpapers/mac.jpg')}")` },
  { id: 'windows', name: 'windows', value: `url("${useAssetUrl('wallpapers/windows.jpg')}")` },
  { id: 'catalina', name: 'Catalina', value: 'url(https://wallpapercave.com/wp/wp5559260.jpg)' },
  { id: 'old-signal', name: 'old signal', value: `url("${useAssetUrl('wallpapers/old-signal.jpg')}")` },
]

const dynamicWallpapers = [
  { id: 'day-night', name: 'Day & Night', value: 'linear-gradient(to bottom, #87CEEB 0%, #1e3c72 100%)' },
  { id: 'seasons', name: 'Seasons', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
]

const liveWallpapers = [
  { id: 'ocean-waves', name: 'Ocean Waves', value: `url("${useAssetUrl('wallpapers/end-of-daylight.mp4')}") center/cover no-repeat` },
  { id: 'ROG', name: 'ROG', value: `url("${useAssetUrl('wallpapers/ROG.gif')}") center/cover no-repeat` },
]

const solidColors = [
  { id: 'blue', name: 'Blue', value: '#007AFF' },
  { id: 'purple', name: 'Purple', value: '#AF52DE' },
  { id: 'pink', name: 'Pink', value: '#FF2D55' },
  { id: 'orange', name: 'Orange', value: '#FF9500' },
  { id: 'green', name: 'Green', value: '#34C759' },
  { id: 'gray', name: 'Gray', value: '#8E8E93' },
  { id: 'black', name: 'Black', value: '#000000' },
  { id: 'white', name: 'White', value: '#FFFFFF' }
]

const gradients = [
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', name: 'Forest', value: 'linear-gradient(to top, #0ba360 0%, #3cba92 100%)' },
  { id: 'fire', name: 'Fire', value: 'linear-gradient(45deg, #ff0844 0%, #ffb199 100%)' },
  { id: 'night', name: 'Night Sky', value: 'linear-gradient(to bottom, #1e3c72 0%, #2a5298 100%)' },
  { id: 'aurora', name: 'Aurora', value: 'linear-gradient(to right, #00d2ff 0%, #3a7bd5 100%)' }
]

// Initialize
onMounted(() => {
  // Check window metadata for initial panel
  if (winModel?.metadata?.initialPanel) {
    const panel = winModel.metadata.initialPanel as string
    if (navItems.some(item => item.id === panel)) {
      activePanel.value = panel
    }
  }
  
  // Load current wallpaper
  currentWallpaper.value = osStore.wallpaper || ''
})

// Set wallpaper
const setWallpaper = (value: string) => {
  currentWallpaper.value = value
  osStore.setWallpaper(value)
}

// Handle file upload
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setWallpaper(`url(${dataUrl})`)
    }
    reader.readAsDataURL(file)
  }
}

// Handle URL input
const handleUrlInput = () => {
  const url = prompt('Enter image URL:')
  if (url && url.trim()) {
    // Validate it's a proper URL
    try {
      new URL(url)
      setWallpaper(`url(${url})`)
    } catch {
      alert('Please enter a valid URL')
    }
  }
}
</script>

<style scoped>
.settings-app {
  display: flex;
  height: 100%;
  background: #f5f5f7;
  user-select: none;
}

/* Sidebar */
.settings-sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: white;
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: #007AFF;
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.nav-item {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.nav-item.active {
  background: #007AFF;
  color: white;
}

.nav-icon {
  font-size: 16px;
}

/* Content Area */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel {
  max-width: 980px;
  margin: 0 auto;
}

.panel-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1d1d1f;
}

/* Wallpaper Panel */
.wallpaper-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.current-wallpaper {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1d1d1f;
}

.wallpaper-preview {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  color: #8e8e93;
  font-size: 14px;
}

.wallpaper-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wallpaper-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d1d1f;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.wallpaper-item {
  aspect-ratio: 16/10;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.wallpaper-item:hover {
  border-color: #007AFF;
  transform: scale(1.05);
}

.wallpaper-item.dynamic,
.wallpaper-item.live {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.wallpaper-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.wallpaper-name {
  font-size: 11px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
}

.wallpaper-item.color .wallpaper-name {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
}

/* Upload Section */
.upload-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #007AFF;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.upload-button:hover {
  background: #0051D5;
}

.upload-icon {
  font-size: 16px;
}

/* Placeholder */
.placeholder-text {
  color: #8e8e93;
  font-size: 14px;
  text-align: center;
  padding: 40px;
}
</style>
