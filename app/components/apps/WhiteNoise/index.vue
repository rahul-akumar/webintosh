<template>
  <div class="white-noise-app">
    <div class="app-header">
      <h2 class="app-title">White Noise Mixer</h2>
      <div class="master-controls">
        <label class="control-label">Master Volume</label>
        <div class="slider-group">
          <input type="range" v-model="masterVolume" @input="updateMasterVolume" min="0" max="100" class="slider" />
          <span class="slider-value">{{ masterVolume }}%</span>
        </div>
      </div>
    </div>
    
    <div class="app-content">
      <div class="sounds-section">
        <div class="sounds-grid">
          <div v-for="sound in sounds" :key="sound.id" class="sound-card" :class="{ active: sound.active }">
            <button @click="toggleSound(sound)" class="sound-toggle">
              <span class="sound-icon">{{ sound.icon }}</span>
              <span class="sound-name">{{ sound.name }}</span>
            </button>
            
            <div class="sound-controls">
              <div class="control-row">
                <label class="control-label">Volume</label>
                <input type="range" v-model="sound.volume" @input="updateSoundVolume(sound)" min="0" max="100" class="slider" :disabled="!sound.active" />
                <span class="slider-value">{{ sound.volume }}%</span>
              </div>
              
              <div v-if="sound.param" class="control-row">
                <label class="control-label">{{ sound.param.label }}</label>
                <input type="range" v-model="sound.param.value" @input="updateSoundParam(sound)" :min="sound.param.min" :max="sound.param.max" class="slider" :disabled="!sound.active" />
                <span class="slider-value">{{ sound.param.value }}{{ sound.param.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="presets-section">
        <h3 class="section-title">Presets</h3>
        <div class="preset-buttons">
          <button @click="loadPreset('focus')" class="preset-button">
            <span class="preset-icon">🎯</span>
            <span>Focus</span>
          </button>
          <button @click="loadPreset('sleep')" class="preset-button">
            <span class="preset-icon">😴</span>
            <span>Sleep</span>
          </button>
          <button @click="loadPreset('nature')" class="preset-button">
            <span class="preset-icon">🌳</span>
            <span>Nature</span>
          </button>
          <button @click="loadPreset('city')" class="preset-button">
            <span class="preset-icon">🏙️</span>
            <span>City Life</span>
          </button>
          <button @click="loadPreset('storm')" class="preset-button">
            <span class="preset-icon">⛈️</span>
            <span>Stormy Night</span>
          </button>
          <button @click="stopAll" class="preset-button stop-button">
            <span class="preset-icon">⏹️</span>
            <span>Stop All</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Sound {
  id: string
  name: string
  icon: string
  active: boolean
  volume: number
  audioFile?: string | string[] // Path to audio file(s) - can be single or multiple
  sources?: (AudioBufferSourceNode | OscillatorNode | MediaStreamAudioSourceNode | HTMLAudioElement)[] // Array for multiple sources
  gainNode?: GainNode
  filterNode?: BiquadFilterNode
  audioContextNodes?: MediaElementAudioSourceNode[] // Array for multiple audio context nodes
  param?: {
    label: string
    value: number
    min: number
    max: number
    unit: string
  }
}

const sounds = ref<Sound[]>([
  { id: 'rain', name: 'Rain', icon: '🌧️', active: false, volume: 50, audioFile: ['/sounds/rain.mp3', '/sounds/dripping.mp3'], param: { label: 'Intensity', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'waves', name: 'Ocean Waves', icon: '🌊', active: false, volume: 50, audioFile: '/sounds/waves.mp3', param: { label: 'Wave Size', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'wildocean', name: 'Wild Ocean', icon: '🌪️', active: false, volume: 50, audioFile: '/sounds/wildocean.mp3', param: { label: 'Roughness', value: 70, min: 0, max: 100, unit: '%' } },
  { id: 'campfire', name: 'Campfire', icon: '🔥', active: false, volume: 50, audioFile: '/sounds/campfire.mp3', param: { label: 'Crackle', value: 60, min: 0, max: 100, unit: '%' } },
  { id: 'thunder', name: 'Thunderstorm', icon: '⛈️', active: false, volume: 50, audioFile: '/sounds/thunder.mp3', param: { label: 'Rumble', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'birds', name: 'Birds', icon: '🐦', active: false, volume: 50, audioFile: '/sounds/birds.mp3', param: { label: 'Activity', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'forest', name: 'Forest', icon: '🌲', active: false, volume: 50, audioFile: '/sounds/forest.mp3', param: { label: 'Density', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'city', name: 'City Traffic', icon: '🏙️', active: false, volume: 50, audioFile: '/sounds/city.mp3', param: { label: 'Activity', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'wind', name: 'Wind', icon: '💨', active: false, volume: 50, audioFile: '/sounds/wind.mp3', param: { label: 'Strength', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'whitenoise', name: 'White Noise', icon: '📻', active: false, volume: 50, audioFile: '/sounds/whitenoise.mp3' },
  { id: 'pinknoise', name: 'Pink Noise', icon: '🎧', active: false, volume: 50, audioFile: '/sounds/pinknoise.mp3' },
  { id: 'brownnoise', name: 'Brown Noise', icon: '🎵', active: false, volume: 50, audioFile: '/sounds/brownnoise.mp3' },
  { id: 'river', name: 'River Stream', icon: '🏞️', active: false, volume: 50, audioFile: '/sounds/river.mp3', param: { label: 'Flow', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'cafe', name: 'Cafe Ambience', icon: '☕', active: false, volume: 50, audioFile: '/sounds/cafe.mp3', param: { label: 'Crowd', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'fan', name: 'Fan', icon: '🌀', active: false, volume: 50, audioFile: '/sounds/fan.mp3', param: { label: 'Speed', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'heartbeat', name: 'Heartbeat', icon: '❤️', active: false, volume: 50, audioFile: '/sounds/heartbeat.mp3', param: { label: 'BPM', value: 70, min: 50, max: 120, unit: '' } },
  { id: 'clock', name: 'Clock Ticking', icon: '🕰️', active: false, volume: 50, audioFile: '/sounds/clock.mp3', param: { label: 'Speed', value: 100, min: 50, max: 150, unit: '%' } },
  { id: 'airplane', name: 'Airplane Cabin', icon: '✈️', active: false, volume: 50, audioFile: '/sounds/airplane.mp3', param: { label: 'Engine', value: 50, min: 0, max: 100, unit: '%' } },
  { id: 'train', name: 'Train Journey', icon: '🚂', active: false, volume: 50, audioFile: '/sounds/train.mp3', param: { label: 'Speed', value: 100, min: 50, max: 150, unit: '%' } },
  { id: 'library', name: 'Library', icon: '📚', active: false, volume: 50, audioFile: '/sounds/library.mp3' }
])

const masterVolume = ref(50)
let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    masterGain = audioContext.createGain()
    masterGain!.connect(audioContext.destination)
    masterGain!.gain.value = masterVolume.value / 100
  }
}

const createNoiseBuffer = (type: 'white' | 'pink' | 'brown') => {
  if (!audioContext) return null
  
  const bufferSize = 2 * audioContext.sampleRate
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)
  
  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      output[i] *= 0.11
      b6 = white * 0.115926
    }
  } else if (type === 'brown') {
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + (0.02 * white)) / 1.02
      lastOut = output[i]
      output[i] *= 3.5
    }
  }
  
  return buffer
}

const startSound = async (sound: Sound) => {
  if (!audioContext || !masterGain) return
  
  sound.gainNode = audioContext.createGain()
  sound.gainNode.gain.value = sound.volume / 100
  
  // Initialize arrays for multiple sources
  sound.sources = []
  sound.audioContextNodes = []
  
  // Try to use real audio file(s) first
  if (sound.audioFile) {
    const audioFiles = Array.isArray(sound.audioFile) ? sound.audioFile : [sound.audioFile]
    let allFilesLoaded = true
    
    for (const file of audioFiles) {
      try {
        // Check if file exists
        const response = await fetch(file, { method: 'HEAD' })
        if (response.ok) {
          // Create audio element
          const audio = new Audio(file)
          audio.loop = true
          audio.crossOrigin = 'anonymous'
          
          // Apply parameter-based effects
          if (sound.param) {
            // Adjust playback rate for speed/BPM controls
            if (['heartbeat', 'clock', 'train', 'fan'].includes(sound.id)) {
              audio.playbackRate = sound.param.value / 100
            }
          }
          
          // Create media source node
          const source = audioContext.createMediaElementSource(audio)
          
          // Connect source directly to gain node (no filters for real audio)
          // This preserves the original sound quality
          source.connect(sound.gainNode)
          
          // Start playback
          audio.play().catch(err => {
            console.warn(`Failed to play ${file}:`, err)
            allFilesLoaded = false
          })
          
          // Store audio element and source node
          sound.sources.push(audio)
          sound.audioContextNodes.push(source)
        } else {
          allFilesLoaded = false
        }
      } catch (err) {
        console.warn(`Audio file not found: ${file}`)
        allFilesLoaded = false
      }
    }
    
    // Connect gain to master only once, after all files are processed
    if (sound.sources && sound.sources.length > 0) {
      sound.gainNode.connect(masterGain)
      return
    }
  }
  
  // Fall back to generated sound if no files loaded
  sound.gainNode.connect(masterGain)
  startGeneratedSound(sound)
}

const startGeneratedSound = (sound: Sound) => {
  if (!audioContext || !masterGain || !sound.gainNode) return
  
  // Initialize sources array if not already
  if (!sound.sources) sound.sources = []
  
  // Fallback generated sounds for when audio files aren't available
  switch(sound.id) {
    case 'whitenoise':
    case 'pinknoise':
    case 'brownnoise': {
      const type = sound.id.replace('noise', '') as 'white' | 'pink' | 'brown'
      const buffer = createNoiseBuffer(type)
      if (buffer) {
        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(sound.gainNode)
        source.start()
        sound.sources.push(source)
      }
      break
    }
    
    default: {
      // For all other sounds, generate basic noise as fallback
      const buffer = createNoiseBuffer('pink')
      if (buffer) {
        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.loop = true
        
        const filter = audioContext.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 600
        filter.Q.value = 1
        
        source.connect(filter)
        filter.connect(sound.gainNode)
        source.start()
        
        sound.sources.push(source)
        sound.filterNode = filter
      }
      break
    }
  }
}

const stopSound = (sound: Sound) => {
  // Stop all sources
  if (sound.sources) {
    for (const source of sound.sources) {
      if (source instanceof HTMLAudioElement) {
        // For HTML audio elements
        source.pause()
        source.currentTime = 0
      } else if ('stop' in source) {
        // For Web Audio nodes
        source.stop()
      }
    }
    sound.sources = undefined
  }
  
  // Disconnect audio context nodes
  if (sound.audioContextNodes) {
    for (const node of sound.audioContextNodes) {
      node.disconnect()
    }
    sound.audioContextNodes = undefined
  }
  
  if (sound.gainNode) {
    sound.gainNode.disconnect()
    sound.gainNode = undefined
  }
  
  if (sound.filterNode) {
    sound.filterNode.disconnect()
    sound.filterNode = undefined
  }
}

const toggleSound = (sound: Sound) => {
  initAudio()
  sound.active = !sound.active
  
  if (sound.active) {
    startSound(sound)
  } else {
    stopSound(sound)
  }
}

const updateSoundVolume = (sound: Sound) => {
  if (sound.gainNode) {
    sound.gainNode.gain.value = sound.volume / 100
  }
}

const updateSoundParam = (sound: Sound) => {
  if (!sound.param) return
  
  // For audio files with playback rate control only
  // No filters are applied to preserve original sound quality
  if (sound.sources) {
    for (const source of sound.sources) {
      if (source instanceof HTMLAudioElement) {
        if (['heartbeat', 'clock', 'train', 'fan'].includes(sound.id)) {
          source.playbackRate = sound.param.value / 100
        }
      }
    }
  }
  
  // Note: Filters are only applied to generated sounds, not real audio files
}

const updateMasterVolume = () => {
  if (masterGain) {
    masterGain.gain.value = masterVolume.value / 100
  }
}

const stopAll = () => {
  sounds.value.forEach(sound => {
    if (sound.active) {
      sound.active = false
      stopSound(sound)
    }
  })
}

const loadPreset = (preset: string) => {
  stopAll()
  
  setTimeout(() => {
    switch(preset) {
      case 'focus':
        activateSounds(['whitenoise', 'rain'], { whitenoise: 30, rain: 40 })
        break
      case 'sleep':
        activateSounds(['rain', 'wind', 'pinknoise'], { rain: 35, wind: 25, pinknoise: 20 })
        break
      case 'nature':
        activateSounds(['forest', 'birds', 'river'], { forest: 50, birds: 30, river: 40 })
        break
      case 'city':
        activateSounds(['city', 'cafe', 'rain'], { city: 60, cafe: 40, rain: 30 })
        break
      case 'storm':
        activateSounds(['thunder', 'rain', 'wind'], { thunder: 70, rain: 60, wind: 50 })
        break
    }
  }, 100)
}

const activateSounds = (soundIds: string[], volumes: Record<string, number>) => {
  initAudio()
  soundIds.forEach(id => {
    const sound = sounds.value.find(s => s.id === id)
    if (sound) {
      sound.volume = volumes[id] || 50
      sound.active = true
      startSound(sound)
    }
  })
}

onUnmounted(() => {
  stopAll()
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
})
</script>

<style scoped>
.white-noise-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-window);
}

/* Header Section */
.app-header {
  background: var(--bg-window-header);
  border-bottom: 1px solid var(--border-window);
  padding: 16px 20px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.master-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 80px;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.slider-value {
  font-size: 13px;
  color: var(--text-primary);
  min-width: 45px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Content Section */
.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.sounds-section {
  margin-bottom: 30px;
}

.sounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.sound-card {
  background: var(--bg-system);
  border-radius: var(--window-border-radius);
  padding: 12px;
  border: 1px solid var(--border-window);
  transition: all var(--transition-fast);
}

.sound-card.active {
  background: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: var(--color-primary);
}

.sound-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sound-toggle:hover {
  background: var(--bg-button-hover);
}

.sound-card.active .sound-toggle {
  background: rgba(255, 255, 255, 0.2);
  border-color: transparent;
}

.sound-card.active .sound-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sound-icon {
  font-size: 24px;
}

.sound-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.sound-card.active .sound-name {
  color: var(--text-inverse);
}

.sound-controls {
  margin-top: 12px;
}

.control-row {
  margin-bottom: 10px;
}

.control-row .control-label {
  display: block;
  font-size: 11px;
  margin-bottom: 4px;
  color: var(--text-secondary);
}

.sound-card.active .control-label {
  color: rgba(255, 255, 255, 0.8);
}

.sound-card.active .slider-value {
  color: var(--text-inverse);
}

/* Presets Section */
.presets-section {
  background: var(--bg-system);
  border-radius: var(--window-border-radius);
  padding: 16px;
  border: 1px solid var(--border-window);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: var(--button-border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 12px;
  color: var(--text-primary);
}

.preset-button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--text-inverse);
  transform: translateY(-1px);
}

.preset-icon {
  font-size: 14px;
}

.stop-button {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--text-inverse);
}

.stop-button:hover {
  background: var(--color-danger);
  border-color: var(--color-danger);
  opacity: 0.9;
}

/* Slider Styling */
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--border-input);
  border-radius: 2px;
  outline: none;
}

.sound-card.active .slider {
  background: rgba(255, 255, 255, 0.3);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: 50%;
  box-shadow: var(--shadow-button);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  background: var(--bg-button-hover);
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--bg-button);
  border: 1px solid var(--border-button);
  border-radius: 50%;
  box-shadow: var(--shadow-button);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.slider:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

/* Scrollbar */
.app-content::-webkit-scrollbar {
  width: 8px;
}

.app-content::-webkit-scrollbar-track {
  background: transparent;
}

.app-content::-webkit-scrollbar-thumb {
  background: var(--border-window);
  border-radius: 4px;
}

.app-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
