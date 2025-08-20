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
        
        <div class="appearance-sections">
          <!-- Theme Selection -->
          <div class="appearance-section">
            <h2 class="section-title">Theme</h2>
            <p class="section-description">Choose between classic and modern styles with light and dark variants</p>
            
            <div class="theme-grid">
              <!-- Glassmorphic Light -->
              <button
                @click="setTheme('glassmorphic-light')"
                :class="['theme-option', { active: currentTheme === 'glassmorphic-light' }]"
              >
                <div class="theme-preview glassmorphic-light">
                  <div class="preview-menubar"></div>
                  <div class="preview-window"></div>
                  <div class="preview-dock"></div>
                </div>
                <span class="theme-name">Glassmorphic Light</span>
                <span class="theme-description">Modern translucent design</span>
              </button>

              <!-- Glassmorphic Dark -->
              <button
                @click="setTheme('glassmorphic-dark')"
                :class="['theme-option', { active: currentTheme === 'glassmorphic-dark' }]"
              >
                <div class="theme-preview glassmorphic-dark">
                  <div class="preview-menubar"></div>
                  <div class="preview-window"></div>
                  <div class="preview-dock"></div>
                </div>
                <span class="theme-name">Glassmorphic Dark</span>
                <span class="theme-description">Modern dark translucent</span>
              </button>

              <!-- Oldschool Light -->
              <button
                @click="setTheme('oldschool-light')"
                :class="['theme-option', { active: currentTheme === 'oldschool-light' }]"
              >
                <div class="theme-preview oldschool-light">
                  <div class="preview-menubar"></div>
                  <div class="preview-window"></div>
                  <div class="preview-dock"></div>
                </div>
                <span class="theme-name">Classic Light</span>
                <span class="theme-description">Traditional solid design</span>
              </button>

              <!-- Oldschool Dark -->
              <button
                @click="setTheme('oldschool-dark')"
                :class="['theme-option', { active: currentTheme === 'oldschool-dark' }]"
              >
                <div class="theme-preview oldschool-dark">
                  <div class="preview-menubar"></div>
                  <div class="preview-window"></div>
                  <div class="preview-dock"></div>
                </div>
                <span class="theme-name">Classic Dark</span>
                <span class="theme-description">Traditional dark solid</span>
              </button>
            </div>
          </div>

          <!-- Accent Color (Future) -->
          <div class="appearance-section">
            <h2 class="section-title">Accent Color</h2>
            <p class="section-description">Customize system accent colors (coming soon)</p>
            <div class="color-grid disabled">
              <div class="color-option" style="background: #007AFF"></div>
              <div class="color-option" style="background: #AF52DE"></div>
              <div class="color-option" style="background: #FF3B30"></div>
              <div class="color-option" style="background: #FF9500"></div>
              <div class="color-option" style="background: #34C759"></div>
              <div class="color-option" style="background: #5AC8FA"></div>
            </div>
          </div>
        </div>
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
const winModel = inject<OSWindowModel | null>('window', null)

const osStore = useOSStore()
const searchQuery = ref('')
const activePanel = ref('wallpaper')
const currentWallpaper = ref('')
const currentTheme = ref('glassmorphic-light')

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
  
  // Load current theme
  currentTheme.value = osStore.theme || 'glassmorphic-light'
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

// Set theme
const setTheme = (theme: string) => {
  currentTheme.value = theme
  osStore.setTheme(theme)
}
</script>

<style scoped>
.settings-app {
  display: flex;
  height: 100%;
  background: transparent;
  color: var(--text-primary);
  user-select: none;
}

/* Sidebar */
.settings-sidebar {
  width: 240px;
  border-right: 1px solid var(--border-window);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-window);
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-input);
  border-radius: var(--button-border-radius);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary);
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
  border-radius: var(--button-border-radius);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-button-hover);
}

.nav-item.active {
  background: var(--bg-selection);
  color: var(--text-selection);
}

.nav-icon {
  font-size: 16px;
}

/* Content Area */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-window);
}

.panel {
  max-width: 980px;
  margin: 0 auto;
}

.panel-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

/* Wallpaper Panel */
.wallpaper-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.current-wallpaper {
  background: var(--bg-window);
  border: 1px solid var(--border-window);
  border-radius: var(--window-border-radius);
  padding: 20px;
  box-shadow: var(--shadow-button);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.wallpaper-preview {
  width: 100%;
  height: 180px;
  border-radius: var(--button-border-radius);
  background-size: cover;
  background-position: center;
  background-color: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-window);
}

.preview-placeholder {
  color: var(--text-tertiary);
  font-size: 14px;
}

.wallpaper-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wallpaper-section {
  background: var(--bg-window);
  border: 1px solid var(--border-window);
  border-radius: var(--window-border-radius);
  padding: 20px;
  box-shadow: var(--shadow-button);
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.wallpaper-item {
  aspect-ratio: 16/10;
  border-radius: var(--button-border-radius);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border-color: var(--color-primary);
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
  background: var(--color-primary);
  color: white;
  border-radius: var(--button-border-radius);
  cursor: pointer;
  font-size: 13px;
  transition: background var(--transition-fast);
}

.upload-button:hover {
  opacity: 0.9;
}

.upload-icon {
  font-size: 16px;
}

/* Placeholder */
.placeholder-text {
  color: var(--text-tertiary);
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

/* Appearance Panel */
.appearance-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.appearance-section {
  background: var(--bg-window);
  border: 1px solid var(--border-window);
  border-radius: var(--window-border-radius);
  padding: 20px;
  box-shadow: var(--shadow-button);
}

.section-description {
  color: var(--text-tertiary);
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 16px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.theme-option {
  background: var(--bg-window);
  border: 2px solid var(--border-window);
  border-radius: var(--window-border-radius);
  padding: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-option:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-button);
}

.theme-option.active {
  border-color: var(--color-primary);
  background: var(--bg-selection);
}

.theme-option.active .theme-name,
.theme-option.active .theme-description {
  color: var(--text-selection);
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.theme-description {
  font-size: 12px;
  color: var(--text-tertiary);
}

.color-grid {
  display: flex;
  gap: 8px;
}

.color-grid.disabled {
  opacity: var(--opacity-disabled);
  pointer-events: none;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.color-option:hover {
  border-color: currentColor;
  transform: scale(1.1);
}
</style>
