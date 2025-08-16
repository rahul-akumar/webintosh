<template>
  <div class="desktop" @click="onDesktopClick">
    <div class="desktop-actions">
      <button class="btn" @click.stop="store.openWindow()">Open Window</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../../../stores/os'

defineOptions({ name: 'OsDesktop' })

const store = useOSStore()

function onDesktopClick() {
  store.toggleAppleMenu(false)
}
</script>

<style scoped>
.desktop {
  position: relative;
  width: 100%;
  height: calc(100vh - 40px); /* keep in sync with menu bar height */
  background: #f5f6f8;
}

.desktop-actions {
  padding: 12px;
}

.btn {
  padding: 6px 10px;
  font-size: 14px;
  background: #222;
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.btn:hover {
  background: #333;
}
</style>