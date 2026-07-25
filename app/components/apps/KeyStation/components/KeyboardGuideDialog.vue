<template>
  <div class="keyboard-guide">
    <h1 class="kg-title">Keyboard Layout</h1>
    <dl class="kg-list">
      <div v-for="row in rows" :key="row.label" class="kg-row">
        <dt class="kg-label">{{ row.label }}</dt>
        <dd class="kg-value">{{ row.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'KeyStationKeyboardGuide' })

const rows = [
  { label: 'White Keys', value: 'A S D F G H J K L' },
  { label: 'Black Keys', value: 'W E T Y U' },
  { label: 'Sustain', value: 'Space' },
  { label: 'Octave Up', value: ']' },
  { label: 'Octave Down', value: '[' },
]
</script>

<style scoped>
.keyboard-guide {
  height: 100%;
  padding: 24px;
  background: var(--bg-window);
  color: var(--text-primary);
}

.kg-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text-primary);
}

.kg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.kg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
}

.kg-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.kg-value {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-system);
  font-weight: 600;
  letter-spacing: 0.05em;
}
</style>
