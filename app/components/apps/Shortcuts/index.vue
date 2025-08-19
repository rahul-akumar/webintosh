<template>
  <div class="shortcuts-app">
    <h2>Keyboard Shortcuts</h2>

    <div class="note">
      <p><strong>Note:</strong> 
        <template v-if="isMac">
          We use <strong>Ctrl (⌃)</strong> on Mac instead of Cmd (⌘) to avoid browser conflicts.
        </template>
        <template v-else>
          We use <strong>Alt</strong> instead of Ctrl to avoid browser conflicts.
        </template>
      </p>
    </div>

    <div class="shortcuts-section">
      <h3>Window Management</h3>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('n') }}</span>
        <span class="description">New Window</span>
      </div>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('w') }}</span>
        <span class="description">Close Window</span>
      </div>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('m') }}</span>
        <span class="description">Minimize Window</span>
      </div>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('z') }}</span>
        <span class="description">Toggle Zoom</span>
      </div>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('`') }}</span>
        <span class="description">Cycle Windows</span>
      </div>
    </div>

    <div class="shortcuts-section">
      <h3>System</h3>
      <div class="shortcut-item">
        <span class="keys">{{ formatShortcut('/') }}</span>
        <span class="description">Show Shortcuts</span>
      </div>
    </div>

    <div class="shortcuts-section">
      <h3>Navigation</h3>
      <div class="shortcut-item">
        <span class="keys">Esc</span>
        <span class="description">Cancel drag/resize, Close menus</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKeyboardShortcuts } from '../../../composables/useKeyboardShortcuts'

defineOptions({ name: 'ShortcutsApp' })

const { isMac, formatShortcut } = useKeyboardShortcuts()
</script>

<style scoped>
.shortcuts-app {
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1d1d1f;
}

.shortcuts-section {
  margin-bottom: 32px;
}

.shortcuts-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d1d1f;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f5f5f7;
  border-radius: 6px;
}

.keys {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  font-weight: 500;
  color: #007aff;
}

.description {
  font-size: 14px;
  color: #1d1d1f;
}

.note {
  margin-top: 32px;
  padding: 16px;
  background: #fff3cd;
  border-radius: 8px;
  border: 1px solid #ffc107;
}

.note p {
  margin: 0;
  font-size: 13px;
  color: #856404;
}
</style>
