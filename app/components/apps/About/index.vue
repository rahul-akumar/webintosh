<template>
  <div class="about-app">
    <!-- Tabs -->
    <div class="about-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="about-content">
      <!-- General Tab -->
      <div v-if="activeTab === 'general'" class="tab-content">
        <div class="about-header">
          <div class="about-icon">
            <span class="icon-emoji">{{ config.app.icon }}</span>
          </div>
          <h1 class="about-title">{{ config.app.name }}</h1>
          <p class="about-version">Version {{ config.app.version }}</p>
          <p class="about-tagline">{{ config.app.tagline }}</p>
        </div>
        
        <div class="about-details">
          <p class="about-description">{{ config.app.description }}</p>
          
          <div class="about-info">
            <div v-for="(item, key) in config.info" :key="key" class="info-row">
              <span class="info-label">{{ item.label }}:</span>
              <a v-if="item.url" 
                 :href="item.url" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 class="info-link">
                {{ item.value }}
              </a>
              <span v-else class="info-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Tab -->
      <div v-if="activeTab === 'features'" class="tab-content">
        <h2 class="tab-title">Features</h2>
        <ul class="features-list">
          <li v-for="(feature, index) in config.features" :key="index">
            {{ feature }}
          </li>
        </ul>
      </div>

      <!-- Changelog Tab -->
      <div v-if="activeTab === 'changelog'" class="tab-content">
        <h2 class="tab-title">Version History</h2>
        <div class="changelog">
          <div v-for="release in config.changelog" :key="release.version" class="release">
            <div class="release-header">
              <span class="release-version">v{{ release.version }}</span>
              <span class="release-date">{{ release.date }}</span>
            </div>
            <ul class="release-changes">
              <li v-for="(change, index) in release.changes" :key="index">
                {{ change }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Credits Tab -->
      <div v-if="activeTab === 'credits'" class="tab-content">
        <h2 class="tab-title">Credits</h2>
        <p>{{ config.credits }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ name: 'AboutApp' })

const config = {
  app: {
    name: "Webintosh",
    version: "0.1.2",
    tagline: "A web-based desktop environment",
    description: "Webintosh brings the familiar desktop experience to your browser.",
    icon: "🖥️"
  },
  info: {
    repository: {
      label: "Repository",
      value: "GitHub",
      url: "https://github.com/rahul-akumar/webintosh"
    },
    license: {
      label: "License",
      value: "MIT"
    },
    author: {
      label: "Author",
      value: "Rahul Kumar"
    }
  },
  features: [
    "Window management with dragging and resizing",
    "Dynamic menubar that adapts to focused app",
    "Dock with app launching and window restoration",
    "Desktop with draggable app icons",
    "Keyboard shortcuts (Alt-based)"
  ],
  changelog: [
    {
      version: "0.1.2",
      date: "2025-08-17",
      changes: [
        "Added viewport-aware window bounds",
        "Improved dock functionality"
      ]
    },
    {
      version: "0.1.0",
      date: "2025-08-15",
      changes: [
        "Initial release"
      ]
    }
  ],
  credits: "Built with Nuxt 4, Vue 3, and TypeScript. 2025 Webintosh Project"
}

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'credits', label: 'Credits' }
]
</script>

<style scoped>
.about-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-window);
  color: var(--text-primary);
}

.about-tabs {
  display: flex;
  background: var(--bg-window-header);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border-bottom: 1px solid var(--border-window-header);
  padding: 0 12px;
}

.tab {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.about-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  max-width: 600px;
  margin: 0 auto;
}

.about-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-emoji {
  font-size: 64px;
  display: inline-block;
}

.about-title {
  font-size: 28px;
  font-weight: 600;
  margin: 8px 0;
  color: var(--text-primary);
}

.about-version {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0;
}

.about-tagline {
  font-size: 14px;
  color: var(--text-secondary);
  font-style: italic;
}

.about-description {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  color: var(--text-primary);
}

.info-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.info-link:hover {
  opacity: 0.8;
}

.tab-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.features-list {
  list-style: none;
  padding: 0;
}

.features-list li {
  padding: 10px 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-window);
}

.changelog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.release {
  padding: 16px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
}

.release-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.release-version {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.release-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.release-changes {
  list-style: disc;
  padding-left: 20px;
}

.release-changes li {
  padding: 4px 0;
  color: var(--text-primary);
}
</style>
