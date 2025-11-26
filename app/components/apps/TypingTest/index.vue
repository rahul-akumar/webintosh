<template>
  <div class="typing-test-app">
    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">WPM</span>
        <span class="stat-value">{{ wpm }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Accuracy</span>
        <span class="stat-value">{{ accuracy }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time</span>
        <span class="stat-value">{{ formatTime(timeElapsed) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Errors</span>
        <span class="stat-value">{{ errors }}</span>
      </div>
    </div>

    <!-- Test Text Area -->
    <div class="test-area">
      <div class="test-text-container">
        <span 
          v-for="(char, index) in testText"
          :key="index"
          :class="getCharClass(index)"
        >{{ char }}</span>
        <span v-if="currentIndex === testText.length" class="cursor end">|</span>
      </div>
      
      <div class="user-input-display">
        <input
          ref="hiddenInput"
          type="text"
          class="hidden-input"
          @input="handleInput"
          @keydown="handleKeyDown"
          :disabled="isComplete"
          autofocus
        />
        <div class="typed-text">
          <span>{{ userInput }}</span>
          <span class="cursor" v-if="!isComplete && currentIndex < testText.length">|</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button @click="startNewTest" class="control-btn primary">
          {{ !hasStarted ? 'Start Test' : 'New Test' }}
        </button>
        <button @click="changeText" :disabled="hasStarted && !isComplete" class="control-btn">
          Change Text
        </button>
        <button @click="toggleSound" class="control-btn" :class="{ active: soundEnabled }">
          Sound: {{ soundEnabled ? 'ON' : 'OFF' }}
        </button>
        <select v-model="selectedDifficulty" @change="changeText" class="difficulty-select" :disabled="hasStarted && !isComplete">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <!-- Results Modal -->
      <div v-if="isComplete" class="results-modal">
        <h2>Test Complete! 🎉</h2>
        <div class="results-grid">
          <div class="result-item">
            <span class="result-label">Final WPM</span>
            <span class="result-value">{{ wpm }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Accuracy</span>
            <span class="result-value">{{ accuracy }}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Time Taken</span>
            <span class="result-value">{{ formatTime(timeElapsed) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Characters</span>
            <span class="result-value">{{ testText.length }}</span>
          </div>
        </div>
        <button @click="startNewTest" class="control-btn primary">Try Again</button>
      </div>
    </div>

    <!-- Keyboard Visualization -->
    <div class="keyboard-container" v-if="showKeyboard">
      <!-- Number Row -->
      <div class="keyboard-row">
        <div 
          v-for="key in numberKeys"
          :key="key.code"
          :class="['key', key.class || '', { 
            pressed: activeKeys.has(key.code),
            'next-key': getNextKey() === key.label.toLowerCase() || getNextKey() === key.shift
          }]"
          :style="{ width: key.width }"
        >
          <span v-if="key.shift" class="shift-label">{{ key.shift }}</span>
          <span>{{ key.label }}</span>
        </div>
      </div>

      <!-- Top Row (QWERTY) -->
      <div class="keyboard-row">
        <div 
          v-for="key in topRow"
          :key="key.code"
          :class="['key', key.class || '', { 
            pressed: activeKeys.has(key.code),
            'next-key': getNextKey() === key.label.toLowerCase()
          }]"
          :style="{ width: key.width }"
        >
          {{ key.label }}
        </div>
      </div>

      <!-- Home Row (ASDF) -->
      <div class="keyboard-row">
        <div 
          v-for="key in homeRow"
          :key="key.code"
          :class="['key', key.class || '', { 
            pressed: activeKeys.has(key.code), 
            'caps-active': key.code === 'CapsLock' && capsLock,
            'next-key': getNextKey() === key.label.toLowerCase()
          }]"
          :style="{ width: key.width }"
        >
          {{ key.label }}
        </div>
      </div>

      <!-- Bottom Row (ZXCV) -->
      <div class="keyboard-row">
        <div 
          v-for="key in bottomRow"
          :key="key.code"
          :class="['key', key.class || '', { 
            pressed: activeKeys.has(key.code),
            'next-key': getNextKey() === key.label.toLowerCase()
          }]"
          :style="{ width: key.width }"
        >
          {{ key.label }}
        </div>
      </div>

      <!-- Space Row -->
      <div class="keyboard-row space-row">
        <div 
          v-for="key in spaceRow"
          :key="key.code"
          :class="['key', key.class || '', { 
            pressed: activeKeys.has(key.code),
            'next-key': key.code === 'Space' && getNextKey() === ' '
          }]"
          :style="{ width: key.width }"
        >
          {{ key.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOSStore } from '../../../stores/os'
import { registerTypingTestCommands } from './typingTestCommands'

// Test phrases by difficulty
const testPhrases = {
  easy: [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "Practice makes perfect."
  ],
  medium: [
    "The early bird catches the worm, but the second mouse gets the cheese.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "In the middle of difficulty lies opportunity.",
    "The only way to do great work is to love what you do.",
    "Innovation distinguishes between a leader and a follower."
  ],
  hard: [
    "Pneumonoultramicroscopicsilicovolcanoconiosis is a type of lung disease caused by inhaling fine silicate or quartz dust.",
    "The complexity of modern software systems requires careful architectural planning and meticulous implementation strategies.",
    "Quantum entanglement demonstrates non-local correlations that challenge our classical understanding of physics.",
    "Cryptographic hash functions provide one-way transformation of data, essential for blockchain technology.",
    "The hippopotomonstrosesquippedaliophobia is ironically the fear of long words."
  ]
}

// Props for window integration
const props = defineProps<{
  windowId?: number
}>()

const osStore = useOSStore()

// State
const testText = ref('')
const userInput = ref('')
const currentIndex = ref(0)
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy')
const activeKeys = ref<Set<string>>(new Set())
const hiddenInput = ref<HTMLInputElement | null>(null)
const audioContext = ref<AudioContext | null>(null)
const soundEnabled = ref<boolean>(true)
const hasStarted = ref(false)
const isComplete = ref(false)
const startTime = ref(0)
const timeElapsed = ref(0)
const errors = ref(0)
const totalKeystrokes = ref(0)
const correctKeystrokes = ref(0)
const capsLock = ref(false)
const timer = ref<NodeJS.Timeout | null>(null)
const showKeyboard = ref(true)  // Add this for menu toggle
const showStats = ref(false)    // Add this for stats display

// Computed
const wpm = computed(() => {
  if (timeElapsed.value === 0) return 0
  const minutes = timeElapsed.value / 60
  const words = correctKeystrokes.value / 5 // Standard: 5 chars = 1 word
  return Math.round(words / minutes)
})

const accuracy = computed(() => {
  if (totalKeystrokes.value === 0) return 100
  return Math.round((correctKeystrokes.value / totalKeystrokes.value) * 100)
})

// Keyboard Layout
const numberKeys = [
  { code: 'Backquote', label: '`', shift: '~' },
  { code: 'Digit1', label: '1', shift: '!' },
  { code: 'Digit2', label: '2', shift: '@' },
  { code: 'Digit3', label: '3', shift: '#' },
  { code: 'Digit4', label: '4', shift: '$' },
  { code: 'Digit5', label: '5', shift: '%' },
  { code: 'Digit6', label: '6', shift: '^' },
  { code: 'Digit7', label: '7', shift: '&' },
  { code: 'Digit8', label: '8', shift: '*' },
  { code: 'Digit9', label: '9', shift: '(' },
  { code: 'Digit0', label: '0', shift: ')' },
  { code: 'Minus', label: '-', shift: '_' },
  { code: 'Equal', label: '=', shift: '+' },
  { code: 'Backspace', label: '⌫', class: 'modifier', width: '90px' },
]

const topRow = [
  { code: 'Tab', label: '⇥', class: 'modifier', width: '70px' },
  { code: 'KeyQ', label: 'Q' },
  { code: 'KeyW', label: 'W' },
  { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' },
  { code: 'BracketLeft', label: '[', shift: '{' },
  { code: 'BracketRight', label: ']', shift: '}' },
  { code: 'Backslash', label: '\\', shift: '|', width: '70px' },
]

const homeRow = [
  { code: 'CapsLock', label: '⇪', class: 'modifier', width: '85px' },
  { code: 'KeyA', label: 'A' },
  { code: 'KeyS', label: 'S' },
  { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';', shift: ':' },
  { code: 'Quote', label: "'", shift: '"' },
  { code: 'Enter', label: '⏎', class: 'modifier', width: '95px' },
]

const bottomRow = [
  { code: 'ShiftLeft', label: '⇧', class: 'modifier', width: '110px' },
  { code: 'KeyZ', label: 'Z' },
  { code: 'KeyX', label: 'X' },
  { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' },
  { code: 'KeyB', label: 'B' },
  { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' },
  { code: 'Comma', label: ',', shift: '<' },
  { code: 'Period', label: '.', shift: '>' },
  { code: 'Slash', label: '/', shift: '?' },
  { code: 'ShiftRight', label: '⇧', class: 'modifier', width: '130px' },
]

const spaceRow = [
  { code: 'ControlLeft', label: 'ctrl', class: 'modifier', width: '60px' },
  { code: 'AltLeft', label: 'alt', class: 'modifier', width: '60px' },
  { code: 'MetaLeft', label: '⌘', class: 'modifier', width: '70px' },
  { code: 'Space', label: '', class: 'space', width: '300px' },
  { code: 'MetaRight', label: '⌘', class: 'modifier', width: '70px' },
  { code: 'AltRight', label: 'alt', class: 'modifier', width: '60px' },
  { code: 'ControlRight', label: 'ctrl', class: 'modifier', width: '60px' },
]

// Methods
function getCharClass(index: number) {
  if (index < currentIndex.value) {
    return userInput.value[index] === testText.value[index] ? 'correct' : 'incorrect'
  }
  if (index === currentIndex.value) {
    return 'current'
  }
  return 'pending'
}

function getNextKey(): string {
  if (currentIndex.value < testText.value.length) {
    return testText.value[currentIndex.value]?.toLowerCase() ?? ''
  }
  return ''
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function initAudioContext() {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    // Resume context to handle autoplay policies
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
  }
}

function playKeySound(isCorrect: boolean) {
  if (!soundEnabled.value || !audioContext.value) return
  
  const osc = audioContext.value.createOscillator()
  const gain = audioContext.value.createGain()
  
  osc.connect(gain)
  gain.connect(audioContext.value.destination)
  
  // Different frequencies for correct/incorrect
  if (isCorrect) {
    osc.frequency.value = 400 // Lower tone for correct
    gain.gain.value = 0.03
  } else {
    osc.frequency.value = 600 // Higher tone for incorrect
    gain.gain.value = 0.03
  }
  
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + 0.05)
  osc.start()
  osc.stop(audioContext.value.currentTime + 0.1)
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  // Initialize audio context on user interaction if not already done
  if (soundEnabled.value && !audioContext.value) {
    initAudioContext()
  }
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const newChar = input.value.slice(-1) || ''
  
  if (!hasStarted.value && newChar) {
    startTest()
    // Initialize audio context on first keystroke if sound is enabled
    if (soundEnabled.value && !audioContext.value) {
      initAudioContext()
    }
  }
  
  if (currentIndex.value < testText.value.length && newChar) {
    const expectedChar = testText.value[currentIndex.value]
    const isCorrect = newChar === expectedChar
    
    totalKeystrokes.value++
    
    if (isCorrect) {
      correctKeystrokes.value++
    } else {
      errors.value++
    }
    
    // Always advance and add character (correct or incorrect)
    currentIndex.value++
    userInput.value += newChar
    
    playKeySound(isCorrect)
    
    if (currentIndex.value >= testText.value.length) {
      completeTest()
    }
  }
  
  // Clear input for next character
  input.value = ''
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Backspace' && currentIndex.value > 0) {
    e.preventDefault()
    currentIndex.value--
    userInput.value = userInput.value.slice(0, -1)
  }
  
  // Visual feedback
  activeKeys.value.add(e.code)
  setTimeout(() => activeKeys.value.delete(e.code), 100)
  
  if (e.code === 'CapsLock') {
    capsLock.value = !capsLock.value
  }
}

function startTest() {
  hasStarted.value = true
  startTime.value = Date.now()
  timer.value = setInterval(() => {
    timeElapsed.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
}

function completeTest() {
  isComplete.value = true
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

function startNewTest() {
  // Reset all state
  userInput.value = ''
  currentIndex.value = 0
  hasStarted.value = false
  isComplete.value = false
  startTime.value = 0
  timeElapsed.value = 0
  errors.value = 0
  totalKeystrokes.value = 0
  correctKeystrokes.value = 0
  
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  // Focus input
  setTimeout(() => {
    if (hiddenInput.value) {
      hiddenInput.value.focus()
    }
  }, 100)
}

function changeText() {
  const phrases = testPhrases[selectedDifficulty.value]
  const randomIndex = Math.floor(Math.random() * phrases.length)
  testText.value = phrases[randomIndex] ?? ''
  startNewTest()
}

// Lifecycle
onMounted(() => {
  // The menu is automatically set when this app is focused
  // No need to manually set it - the MenuBar component handles this
  
  // Register menu command handlers
  registerTypingTestCommands({
    startNewTest,
    changeText,
    toggleSound,
    selectedDifficulty,
    hasStarted,
    isComplete,
    showKeyboard,
    showStats
  })
  
  // Don't initialize audio context here - wait for user interaction
  // This helps with browser autoplay policies
  
  // Set initial text
  changeText()
  
  // Focus input
  setTimeout(() => {
    if (hiddenInput.value) {
      hiddenInput.value.focus()
    }
  }, 100)
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  if (audioContext.value) {
    audioContext.value.close()
  }
  
  // Menu cleanup is not needed - the OS handles this automatically
})

// Keep input focused
watch(isComplete, (complete) => {
  if (!complete) {
    setTimeout(() => {
      hiddenInput.value?.focus()
    }, 100)
  }
})
</script>

<style scoped>
/* All styles moved to typingtest.css for theme integration */
/* The external CSS uses theme variables to adapt to selected theme */
</style>
