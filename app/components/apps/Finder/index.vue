<template>
  <div class="finder-app">
    <!-- Sidebar -->
    <div class="finder-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">Folders</div>
        <button
          v-for="folder in folders"
          :key="folder.id"
          @click="selectedFolder = folder.id"
          :class="['sidebar-item', { active: selectedFolder === folder.id }]"
        >
          <span class="sidebar-icon">{{ folder.icon }}</span>
          <span class="sidebar-label">{{ folder.name }}</span>
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="finder-content">
      <!-- Toolbar -->
      <div class="finder-toolbar">
        <div class="toolbar-section">
          <button class="toolbar-button" title="Back">
            <span class="toolbar-icon">←</span>
          </button>
          <button class="toolbar-button" title="Forward">
            <span class="toolbar-icon">→</span>
          </button>
        </div>
        
        <div class="toolbar-section">
          <div class="toolbar-title">{{ currentFolderName }}</div>
        </div>
        
        <div class="toolbar-section">
          <button class="toolbar-button" title="View">
            <span class="toolbar-icon">⊞</span>
          </button>
          <button class="toolbar-button" title="Settings">
            <span class="toolbar-icon">⚙</span>
          </button>
        </div>
      </div>
      
      <!-- File Grid -->
      <div class="finder-files">
        <div
          v-for="file in files"
          :key="file.id"
          :class="['file-item', { selected: selectedFile === file.id }]"
          @click="selectedFile = file.id"
          @dblclick="openFile(file)"
        >
          <div class="file-icon">
            <img 
              v-if="file.iconPath" 
              :src="file.iconPath" 
              :alt="file.name"
              class="file-icon-img"
            />
            <span v-else class="file-icon-emoji">{{ file.iconEmoji || '📄' }}</span>
          </div>
          <div class="file-name">{{ file.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppsStore } from '../../../../stores/apps'
import { useOSStore } from '../../../../stores/os'

defineOptions({ name: 'FinderApp' })

const appsStore = useAppsStore()
const osStore = useOSStore()

const selectedFolder = ref('documents')
const selectedFile = ref<string | null>(null)

// Simplified folder structure - only essential folders
const folders = [
  { id: 'applications', name: 'Applications', icon: '🚀' },
  { id: 'documents', name: 'Documents', icon: '📄' },
  { id: 'images', name: 'Images', icon: '🖼️' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'videos', name: 'Videos', icon: '🎬' },
  { id: 'trash', name: 'Trash', icon: '🗑️' },
]

// Get real applications from the apps store
const getApplicationFiles = () => {
  return Object.values(appsStore.registry).map(app => ({
    id: `app-${app.id}`,
    name: app.title,
    iconPath: app.icon, // Use the actual SVG/PNG path
    iconEmoji: app.emoji || '📱', // Keep emoji as fallback
    type: 'app',
    appId: app.id // Store the actual app ID for launching
  }))
}

const filesData: Record<string, any[]> = {
  applications: getApplicationFiles(),
  documents: [
    { id: 'doc-1', name: 'Welcome.txt', iconEmoji: '📄', type: 'file' },
    { id: 'doc-2', name: 'Notes.md', iconEmoji: '📝', type: 'file' },
  ],
  images: [
    { id: 'img-1', name: 'Screenshot.png', iconEmoji: '🖼️', type: 'file' },
    { id: 'img-2', name: 'Wallpaper.jpg', iconEmoji: '🖼️', type: 'file' },
  ],
  music: [
    { id: 'music-1', name: 'Playlist.m3u', iconEmoji: '🎵', type: 'file' },
  ],
  videos: [
    { id: 'vid-1', name: 'Demo.mp4', iconEmoji: '🎬', type: 'file' },
  ],
  trash: [
    // Empty trash by default
  ],
}

const currentFolderName = computed(() => {
  const folder = folders.find(item => item.id === selectedFolder.value)
  return folder?.name || 'Finder'
})

const files = computed(() => {
  // For applications folder, get fresh list each time to reflect any new apps
  if (selectedFolder.value === 'applications') {
    return getApplicationFiles()
  }
  return filesData[selectedFolder.value] || []
})

const openFile = (file: any) => {
  console.log('Opening file:', file.name)
  
  // If it's an app, launch it using the apps store
  if (file.type === 'app' && file.appId) {
    appsStore.launchOrFocus(file.appId)
  }
  // Handle other file types here in the future
}
</script>

<style scoped>
.finder-app {
  display: flex;
  height: 100%;
  background: transparent;
  color: var(--text-primary);
}

/* Sidebar */
.finder-sidebar {
  width: 200px;
  background: transparent;
  border-right: 1px solid var(--border-window);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  overflow-y: auto;
}

.sidebar-section {
  padding: 0 8px;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  padding: 4px 8px;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.sidebar-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.sidebar-item:hover {
  background: var(--bg-button-hover);
}

.sidebar-item.active {
  background: var(--bg-selection);
  color: var(--text-selection);
}

.sidebar-icon {
  font-size: 16px;
  width: 20px;
  display: inline-flex;
  justify-content: center;
}

.sidebar-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Main Content */
.finder-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-window);
}

/* Toolbar */
.finder-toolbar {
  height: 44px;
  background: var(--bg-window-header);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border-bottom: 1px solid var(--border-window-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-button:hover {
  background: var(--bg-button-hover);
}

.toolbar-button:active {
  background: var(--bg-button-active);
}

.toolbar-icon {
  font-size: 14px;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* File Grid */
.finder-files {
  flex: 1;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  align-content: start;
  overflow-y: auto;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.file-item:hover {
  background: var(--bg-button-hover);
}

.file-item.selected {
  background: var(--bg-selection);
}

.file-item.selected .file-name {
  color: var(--text-selection);
}

.file-icon {
  font-size: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.file-name {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
  max-width: 100%;
}

/* Scrollbar styling */
.finder-sidebar::-webkit-scrollbar,
.finder-files::-webkit-scrollbar {
  width: 8px;
}

.finder-sidebar::-webkit-scrollbar-track,
.finder-files::-webkit-scrollbar-track {
  background: transparent;
}

.finder-sidebar::-webkit-scrollbar-thumb,
.finder-files::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 4px;
  border: 2px solid var(--bg-window);
}

.finder-sidebar::-webkit-scrollbar-thumb:hover,
.finder-files::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
