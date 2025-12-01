<template>
  <div class="login-screen">
    <div class="login-box">
      <img src="/icons/apps/yahooMessenger.png" alt="Yahoo Messenger" class="logo">
      <h2>Yahoo! Messenger</h2>
      <p>Enter your name to join</p>
      <input
        :value="username"
        placeholder="Your name"
        class="username-input"
        @input="$emit('update:username', ($event.target as HTMLInputElement).value)"
        @keyup.enter="$emit('submit')"
      >
      <button :disabled="disabled" class="login-btn" @click="$emit('submit')">
        Sign In
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  username: string
  disabled: boolean
}>()

defineEmits<{
  'update:username': [value: string]
  'submit': []
}>()
</script>
