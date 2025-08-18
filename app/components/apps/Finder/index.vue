<template>
  <div class="finder-app">
    <div class="sidebar">
      <div class="sidebar-item" v-for="item in items" :key="item">
        {{ item }}
      </div>
    </div>
    <div class="main-content">
      <p>Finder content area</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'FinderApp' })

const items = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music']
</script>

<style scoped>
.finder-app {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 200px;
  background: #f5f5f7;
  border-right: 1px solid #e0e0e0;
  padding: 10px;
}

.sidebar-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background: rgba(0, 122, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 20px;
}
</style>
