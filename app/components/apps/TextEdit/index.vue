<template>
  <div class="textedit-app">
    <textarea 
      class="editor"
      placeholder="Start typing..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TextEditApp' })
</script>

<style scoped>
.textedit-app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor {
  flex: 1;
  padding: 20px;
  border: none;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  resize: none;
  background: white;
}
</style>
