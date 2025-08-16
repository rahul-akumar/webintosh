<template>
  <div class="finder-app">
    <header class="finder-toolbar">
      <strong>Finder</strong>
    </header>
    <section class="finder-body">
      <p>Finder stub — content area</p>
      <ul class="finder-list">
        <li v-for="item in items" :key="item">{{ item }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'FinderApp' })

const items = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music']
</script>

<style scoped>
.finder-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.finder-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: #f6f6f7;
  border-bottom: 1px solid #ececec;
  font-size: 13px;
}
.finder-body {
  flex: 1;
  overflow: auto;
  padding: 10px;
  font-size: 14px;
  color: #222;
  background: #fff;
}
.finder-list {
  margin: 8px 0 0;
  padding-left: 18px;
}
</style>