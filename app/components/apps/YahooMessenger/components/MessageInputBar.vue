<template>
  <div class="message-input-container">
    <div class="emoticons">
      <button
        v-for="emoji in emoticons"
        :key="emoji"
        class="emoji-btn"
        @click="$emit('insertEmoji', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
    <div class="input-row">
      <button class="buzz-btn" title="Send BUZZ!" @click="$emit('buzz')">
        BUZZ!
      </button>
      <input
        :value="modelValue"
        :placeholder="placeholder"
        class="message-input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keyup.enter="$emit('send')"
      >
      <button :disabled="!modelValue.trim()" class="send-btn" @click="$emit('send')">
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder: string
  emoticons: string[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
  send: []
  buzz: []
  insertEmoji: [emoji: string]
}>()
</script>
