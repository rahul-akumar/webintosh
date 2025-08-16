<template>
  <div class="textedit-app">
    <header class="te-toolbar">
      <strong>TextEdit</strong>
    </header>
    <section class="te-body">
      <textarea class="te-editor" placeholder="TextEdit stub — start typing..."></textarea>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TextEditApp' })
</script>

<style scoped>
.textedit-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.te-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: #f6f6f7;
  border-bottom: 1px solid #ececec;
  font-size: 13px;
}
.te-body {
  flex: 1;
  display: flex;
  padding: 10px;
  background: #fff;
}
.te-editor {
  flex: 1;
  resize: none;
  font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color: #222;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 10px;
  outline: none;
}
.te-editor:focus {
  border-color: #c9defc;
  box-shadow: 0 0 0 2px rgba(51, 132, 255, 0.15);
}
</style>