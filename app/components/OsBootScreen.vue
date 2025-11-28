<template>
  <Teleport to="body">
    <Transition name="boot-fade">
      <div v-if="!dismissed" class="boot-screen" @click="skipBoot">
        <div class="boot-terminal">
          <div class="boot-lines">
            <div
              v-for="(line, i) in visibleLines"
              :key="i"
              class="boot-line"
              :class="{ 'highlight': line.highlight, 'success': line.success, 'error': line.error }"
            >
              <span v-if="line.prefix" class="prefix">{{ line.prefix }}</span>
              <span class="text">{{ line.text }}</span>
              <span v-if="line.status" class="status" :class="line.status">[ {{ line.status.toUpperCase() }} ]</span>
            </div>
          </div>
          <div v-if="!bootComplete" class="cursor-line">
            <span class="cursor">█</span>
          </div>
        </div>
        <div class="boot-footer">
          <span class="skip-hint">{{ bootComplete ? 'Starting desktop...' : 'Click anywhere to skip' }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAssetUrl } from '../composables/useAssetUrl'
import { hasBooted, markBooted } from '../composables/useBoot'

interface BootLine {
  text: string
  prefix?: string
  status?: 'ok' | 'done' | 'fail' | 'warn'
  highlight?: boolean
  success?: boolean
  error?: boolean
  delay?: number
}

const visibleLines = ref<BootLine[]>([])
const progress = ref(0)
const bootComplete = ref(false)
const preloadComplete = ref(false)
const dismissed = ref(false)

// Skip boot if already booted this session
if (import.meta.client && hasBooted()) {
  dismissed.value = true
}

// Boot sequence messages
const bootSequence: BootLine[] = [
  { text: 'WEBINTOSH BOOT SEQUENCE v2.0.25', highlight: true, delay: 100 },
  { text: '════════════════════════════════════════', delay: 50 },
  { text: '', delay: 100 },
  { text: 'BIOS Date: 11/28/25  Rev 1.0', delay: 80 },
  { text: 'CPU: Virtual Core @ 3.2GHz', delay: 60 },
  { text: 'Memory Test: 16384MB OK', status: 'ok', delay: 120 },
  { text: '', delay: 50 },
  { prefix: '[    0.000000]', text: ' Initializing kernel...', delay: 100 },
  { prefix: '[    0.004521]', text: ' Loading device drivers', status: 'ok', delay: 150 },
  { prefix: '[    0.012847]', text: ' Mounting virtual filesystem', status: 'ok', delay: 100 },
  { prefix: '[    0.024103]', text: ' Starting system services', delay: 80 },
  { text: '', delay: 50 },
  { text: '> Initializing WindowManager...', delay: 200 },
  { text: '> Loading theme engine', status: 'done', delay: 150 },
  { text: '> Registering desktop apps', status: 'done', delay: 180 },
  { text: '', delay: 50 },
  { text: '┌─────────────────────────────────────────┐', delay: 30 },
  { text: '│  PRELOADING ASSETS                      │', delay: 30 },
  { text: '└─────────────────────────────────────────┘', delay: 30 },
  { text: '', delay: 50 },
  { text: '> Fetching wallpaper assets...', delay: 300 },
  { text: '> Loading application icons...', delay: 200 },
  { text: '> Initializing audio subsystem...', delay: 250 },
  { text: '> Preparing desktop environment...', delay: 200 },
  { text: '', delay: 100 },
  { text: 'All systems operational.', success: true, status: 'ok', delay: 150 },
  { text: '', delay: 50 },
  { text: '> exec /desktop/init', highlight: true, delay: 200 },
]

let timeoutId: ReturnType<typeof setTimeout> | null = null
let currentIndex = 0

// Assets to preload
const assetsToPreload = [
  'wallpapers/end-of-daylight.mp4',
  'icons/system/finder.png',
  'icons/system/settings.png',
  'icons/system/apple.png',
  'icons/apps/textEdit.png',
  'icons/apps/typingTest.png',
  'icons/apps/keyStation.png',
  'icons/apps/noiseMixer.png',
  'icons/apps/chess.png',
]

async function preloadAssets() {
  const total = assetsToPreload.length
  let loaded = 0

  const promises = assetsToPreload.map(async (asset) => {
    try {
      const url = useAssetUrl(asset) || `/${asset}`
      
      if (asset.endsWith('.mp4')) {
        // Preload video by creating element and loading metadata
        await new Promise<void>((resolve) => {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => resolve()
          video.onerror = () => resolve()
          video.src = url
        })
      } else {
        // Preload images
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        })
      }
    } catch {
      // Silently continue on errors
    }
    loaded++
    progress.value = Math.round((loaded / total) * 50) + 50
  })

  await Promise.all(promises)
  preloadComplete.value = true
}

function showNextLine() {
  if (currentIndex >= bootSequence.length) {
    bootComplete.value = true
    finishBoot()
    return
  }

  const line = bootSequence[currentIndex]
  visibleLines.value.push(line!)
  currentIndex++
  
  progress.value = Math.min(Math.round((currentIndex / bootSequence.length) * 50), 50)

  const delay = line!.delay ?? 100
  timeoutId = setTimeout(showNextLine, delay)
}

async function finishBoot() {
  // Wait for preloading to complete
  while (!preloadComplete.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  markBooted()
  
  // Small delay then dismiss
  await new Promise(resolve => setTimeout(resolve, 500))
  dismissed.value = true
}

function skipBoot() {
  if (bootComplete.value) return
  
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  
  // Show remaining lines instantly
  while (currentIndex < bootSequence.length) {
    visibleLines.value.push(bootSequence[currentIndex]!)
    currentIndex++
  }
  
  progress.value = 100
  bootComplete.value = true
  finishBoot()
}

onMounted(() => {
  if (dismissed.value) return
  
  preloadAssets()
  showNextLine()
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<style scoped>
.boot-screen {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace;
  cursor: pointer;
  overflow: hidden;
  z-index: 99999;
}

.boot-terminal {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #333 #0a0a0a;
}

.boot-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.boot-line {
  font-size: 13px;
  line-height: 1.6;
  color: #00ff00;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: pre;
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.boot-line.highlight {
  color: #00ffff;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.boot-line.success {
  color: #00ff88;
}

.boot-line.error {
  color: #ff4444;
}

.prefix {
  color: #666;
}

.text {
  flex: 1;
}

.status {
  font-size: 11px;
  margin-left: auto;
}

.status.ok,
.status.done {
  color: #00ff00;
}

.status.fail {
  color: #ff4444;
}

.status.warn {
  color: #ffaa00;
}

.cursor-line {
  margin-top: 4px;
}

.cursor {
  color: #00ff00;
  animation: blink 0.7s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.boot-footer {
  padding: 16px 32px;
  border-top: 1px solid #222;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.skip-hint {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-bar {
  flex: 1;
  max-width: 300px;
  height: 4px;
  background: #222;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #00ffaa);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
}

/* Scanline effect */
.boot-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 10;
}

/* CRT glow effect */
.boot-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
  z-index: 5;
}

/* Fade out transition */
.boot-fade-leave-active {
  transition: opacity 0.4s ease-out;
}

.boot-fade-leave-to {
  opacity: 0;
}
</style>
