<template>
  <div class="music-keyboard-app">
    <!-- Control Panel -->
    <div class="control-panel">
      <div class="controls-row">
        <!-- Instrument Selection -->
        <div class="control-group">
          <label>Instrument</label>
          <select v-model="selectedInstrument" @change="changeInstrument">
            <option value="piano">Piano</option>
            <option value="synth">Synth</option>
            <option value="organ">Organ</option>
            <option value="strings">Strings</option>
            <option value="brass">Brass</option>
            <option value="flute">Flute</option>
          </select>
        </div>

        <!-- Oscillator Type -->
        <div class="control-group">
          <label>Oscillator</label>
          <select v-model="selectedOscillatorType" @change="updateOscillatorType">
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="square">Square</option>
          </select>
        </div>

        <!-- Volume Control -->
        <div class="control-group">
          <label>Volume</label>
          <input type="range" v-model="volume" min="0" max="100" @input="updateVolume" />
          <span class="value">{{ volume }}</span>
        </div>

        <!-- Octave Selection -->
        <div class="control-group">
          <label>Octave</label>
          <div class="octave-buttons">
            <button @click="changeOctave(-1)" :disabled="currentOctave <= 1">-</button>
            <span class="octave-display">C{{ currentOctave }}</span>
            <button @click="changeOctave(1)" :disabled="currentOctave >= 7">+</button>
          </div>
        </div>
      </div>

      <div class="controls-row">
        <!-- Effects -->
        <div class="control-group">
          <label>Reverb</label>
          <input type="range" v-model="reverb" min="0" max="100" />
          <span class="value">{{ reverb }}</span>
        </div>

        <div class="control-group">
          <label>Delay</label>
          <input type="range" v-model="delay" min="0" max="100" />
          <span class="value">{{ delay }}</span>
        </div>

        <div class="control-group">
          <label>Sustain</label>
          <button 
            @click="toggleSustain" 
            :class="['sustain-button', { active: sustainOn }]"
          >
            {{ sustainOn ? 'ON' : 'OFF' }}
          </button>
        </div>

        <!-- Recording Controls -->
        <div class="control-group">
          <label>Recording</label>
          <button 
            @click="toggleRecording" 
            :class="['record-button', { recording: isRecording }]"
          >
            {{ isRecording ? '⏺ Stop' : '⏺ Record' }}
          </button>
          <button 
            v-if="recordedNotes.length > 0" 
            @click="playRecording"
            class="play-button"
          >
            ▶ Play
          </button>
        </div>
      </div>
    </div>

    <!-- Display -->
    <div class="display-panel">
      <div class="waveform-display" ref="waveformDisplay">
        <canvas ref="waveformCanvas"></canvas>
        <div class="oscillator-type-indicator">{{ selectedOscillatorType.toUpperCase() }}</div>
      </div>
      <div class="info-display">
        <span v-if="currentNote">{{ currentNote }}</span>
        <span v-else class="hint">Press keys A-L for white keys, W-E-T-Y-U for black keys</span>
      </div>
    </div>

    <!-- Keyboard -->
    <div class="keyboard-container">
      <div class="keyboard">
        <!-- White Keys -->
        <div
          v-for="(note, index) in whiteKeys"
          :key="`white-${index}`"
          :class="['key', 'white-key', { active: activeKeys.has(note.key) }]"
          @mousedown="playNote(note)"
          @mouseup="stopNote(note)"
          @mouseleave="stopNote(note)"
        >
          <span class="key-label">{{ note.label }}</span>
          <span class="key-note">{{ note.key }}</span>
        </div>
        
        <!-- Black Keys -->
        <div
          v-for="(note, index) in blackKeys"
          :key="`black-${index}`"
          :class="['key', 'black-key', { active: activeKeys.has(note.key) }]"
          :style="{ left: note.position }"
          @mousedown="playNote(note)"
          @mouseup="stopNote(note)"
          @mouseleave="stopNote(note)"
        >
          <span class="key-label">{{ note.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { register } from '../../../composables/menuCommands'

// Audio Context
const audioContext = ref<AudioContext | null>(null)
const masterGainNode = ref<GainNode | null>(null)
const reverbNode = ref<ConvolverNode | null>(null)
const delayNode = ref<DelayNode | null>(null)
const delayGainNode = ref<GainNode | null>(null)
const analyser = ref<AnalyserNode | null>(null)

// State
const volume = ref(50)
const reverb = ref(20)
const delay = ref(0)
const currentOctave = ref(4)
const selectedInstrument = ref('piano')
const selectedOscillatorType = ref<OscillatorType>('sine')
const sustainOn = ref(false)
const activeKeys = ref(new Set<string>())
const currentNote = ref('')
const isRecording = ref(false)
const recordedNotes = ref<Array<{ note: any, time: number }>>([])
const recordingStartTime = ref(0)

// Canvas refs
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const animationId = ref<number | null>(null)

// Active oscillators
const activeOscillators = new Map<string, { oscillator: OscillatorNode, gainNode: GainNode }>()

// Note frequencies (A4 = 440Hz)
const noteFrequencies: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
}

// Keyboard mapping
const whiteKeys = computed(() => [
  { key: 'A', note: 'C', label: 'C' },
  { key: 'S', note: 'D', label: 'D' },
  { key: 'D', note: 'E', label: 'E' },
  { key: 'F', note: 'F', label: 'F' },
  { key: 'G', note: 'G', label: 'G' },
  { key: 'H', note: 'A', label: 'A' },
  { key: 'J', note: 'B', label: 'B' },
  { key: 'K', note: 'C', label: 'C', octaveOffset: 1 },
  { key: 'L', note: 'D', label: 'D', octaveOffset: 1 },
])

const blackKeys = computed(() => [
  { key: 'W', note: 'C#', label: 'C#', position: '11.11%' },
  { key: 'E', note: 'D#', label: 'D#', position: '22.22%' },
  { key: 'T', note: 'F#', label: 'F#', position: '44.44%' },
  { key: 'Y', note: 'G#', label: 'G#', position: '55.55%' },
  { key: 'U', note: 'A#', label: 'A#', position: '66.66%' },
])

// Initialize audio context
const initAudio = () => {
  audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  // Create master gain
  masterGainNode.value = audioContext.value.createGain()
  masterGainNode.value.gain.value = volume.value / 100
  
  // Create reverb
  reverbNode.value = audioContext.value.createConvolver()
  createReverbImpulse()
  
  // Create delay
  delayNode.value = audioContext.value.createDelay(1)
  delayNode.value.delayTime.value = 0.3
  delayGainNode.value = audioContext.value.createGain()
  delayGainNode.value.gain.value = 0
  
  // Create analyser for waveform
  analyser.value = audioContext.value.createAnalyser()
  analyser.value.fftSize = 2048
  
  // Connect effects chain
  delayNode.value.connect(delayGainNode.value)
  delayGainNode.value.connect(delayNode.value) // Feedback loop
  delayGainNode.value.connect(masterGainNode.value)
  
  masterGainNode.value.connect(analyser.value)
  analyser.value.connect(audioContext.value.destination)
  
  // Start waveform animation
  drawWaveform()
}

// Create reverb impulse response
const createReverbImpulse = () => {
  if (!audioContext.value || !reverbNode.value) return
  
  const length = audioContext.value.sampleRate * 2
  const impulse = audioContext.value.createBuffer(2, length, audioContext.value.sampleRate)
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
    }
  }
  
  reverbNode.value.buffer = impulse
}

// Get instrument waveform and harmonics
const getInstrumentSettings = (instrument: string) => {
  switch (instrument) {
    case 'piano':
      return { 
        waveform: 'triangle' as OscillatorType, 
        harmonics: [1, 0.5, 0.3, 0.2],
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5
      }
    case 'synth':
      return { 
        waveform: 'sawtooth' as OscillatorType, 
        harmonics: [1, 0.7, 0.5, 0.3],
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3
      }
    case 'organ':
      return { 
        waveform: 'sine' as OscillatorType, 
        harmonics: [1, 0.8, 0.6, 0.4, 0.3],
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2
      }
    case 'strings':
      return { 
        waveform: 'sawtooth' as OscillatorType, 
        harmonics: [1, 0.4, 0.3, 0.2],
        attack: 0.3,
        decay: 0.2,
        sustain: 0.7,
        release: 0.8
      }
    case 'brass':
      return { 
        waveform: 'sawtooth' as OscillatorType, 
        harmonics: [1, 0.9, 0.7, 0.5],
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 0.3
      }
    case 'flute':
      return { 
        waveform: 'sine' as OscillatorType, 
        harmonics: [1, 0.2],
        attack: 0.2,
        decay: 0.1,
        sustain: 0.6,
        release: 0.4
      }
    default:
      return { 
        waveform: 'sine' as OscillatorType, 
        harmonics: [1],
        attack: 0.01,
        decay: 0.3,
        sustain: 0.5,
        release: 0.5
      }
  }
}

// Play a note
const playNote = (note: any) => {
  if (!audioContext.value || !masterGainNode.value) {
    initAudio()
  }
  
  if (!audioContext.value || !masterGainNode.value) return
  
  const noteKey = note.key
  const noteName = note.note
  const octaveOffset = note.octaveOffset || 0
  const octave = currentOctave.value + octaveOffset
  
  // Don't replay if already playing
  if (activeOscillators.has(noteKey)) return
  
  // Calculate frequency
  const baseFreq = noteFrequencies[noteName]
  const frequency = baseFreq * Math.pow(2, octave - 4)
  
  // Get instrument settings
  const settings = getInstrumentSettings(selectedInstrument.value)
  
  // Create oscillator and gain for this note
  const oscillator = audioContext.value.createOscillator()
  const noteGain = audioContext.value.createGain()
  
  oscillator.type = selectedOscillatorType.value
  oscillator.frequency.setValueAtTime(frequency, audioContext.value.currentTime)
  
  // ADSR envelope
  const now = audioContext.value.currentTime
  noteGain.gain.setValueAtTime(0, now)
  noteGain.gain.linearRampToValueAtTime(1, now + settings.attack)
  noteGain.gain.linearRampToValueAtTime(settings.sustain, now + settings.attack + settings.decay)
  
  // Connect nodes
  oscillator.connect(noteGain)
  
  // Add effects if enabled
  if (reverb.value > 0 && reverbNode.value) {
    const reverbGain = audioContext.value.createGain()
    reverbGain.gain.value = reverb.value / 100
    noteGain.connect(reverbGain)
    reverbGain.connect(reverbNode.value)
    reverbNode.value.connect(masterGainNode.value!)
  }
  
  if (delay.value > 0 && delayNode.value) {
    noteGain.connect(delayNode.value)
    if (delayGainNode.value) {
      delayGainNode.value.gain.value = delay.value / 100 * 0.5
    }
  }
  
  noteGain.connect(masterGainNode.value)
  
  oscillator.start()
  
  // Store reference
  activeOscillators.set(noteKey, { oscillator, gainNode: noteGain })
  activeKeys.value.add(noteKey)
  currentNote.value = `${noteName}${octave}`
  
  // Record if recording
  if (isRecording.value) {
    recordedNotes.value.push({
      note: { ...note, octave },
      time: Date.now() - recordingStartTime.value
    })
  }
}

// Stop a note
const stopNote = (note: any) => {
  if (!audioContext.value || sustainOn.value) return
  
  const noteKey = note.key
  const active = activeOscillators.get(noteKey)
  
  if (active) {
    const settings = getInstrumentSettings(selectedInstrument.value)
    const now = audioContext.value.currentTime
    
    // Release envelope
    active.gainNode.gain.cancelScheduledValues(now)
    active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now)
    active.gainNode.gain.linearRampToValueAtTime(0, now + settings.release)
    
    // Stop oscillator after release
    active.oscillator.stop(now + settings.release)
    
    activeOscillators.delete(noteKey)
    activeKeys.value.delete(noteKey)
    
    if (activeKeys.value.size === 0) {
      currentNote.value = ''
    }
  }
}

// Draw waveform
const drawWaveform = () => {
  if (!waveformCanvas.value || !analyser.value) return
  
  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Set canvas size
  canvas.width = canvas.offsetWidth * 2
  canvas.height = canvas.offsetHeight * 2
  ctx.scale(2, 2)
  
  const bufferLength = analyser.value.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  
  const draw = () => {
    animationId.value = requestAnimationFrame(draw)
    
    analyser.value!.getByteTimeDomainData(dataArray)
    
    ctx.fillStyle = 'rgba(20, 20, 30, 0.2)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let strokeColor = '#00ffcc'
    let lineWidth = 2

    switch (selectedOscillatorType.value) {
      case 'sine':
        strokeColor = '#ff00cc'
        lineWidth = 2.5
        break
      case 'square':
        strokeColor = '#00ffcc'
        lineWidth = 2
        break
      case 'sawtooth':
        strokeColor = '#00ccff'
        lineWidth = 1.5
        break
      case 'triangle':
        strokeColor = '#cc00ff'
        lineWidth = 3
        break
    }
    
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeColor
    ctx.shadowBlur = 10
    ctx.shadowColor = strokeColor
    ctx.beginPath()
    
    const sliceWidth = canvas.width / 2 / bufferLength
    let x = 0
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = v * canvas.height / 4
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      
      x += sliceWidth
    }
    
    ctx.stroke()
  }
  
  draw()
}

// Control functions
const updateVolume = () => {
  if (masterGainNode.value) {
    masterGainNode.value.gain.value = volume.value / 100
  }
}

const changeOctave = (direction: number) => {
  currentOctave.value = Math.max(1, Math.min(7, currentOctave.value + direction))
}

const changeInstrument = () => {
  // Instrument change will apply to next notes played
}

const updateOscillatorType = () => {
  // Oscillator type change will apply to next notes played
}

const toggleSustain = () => {
  sustainOn.value = !sustainOn.value
  
  // If turning off sustain, stop all notes
  if (!sustainOn.value && audioContext.value) {
    activeOscillators.forEach((active, key) => {
      const settings = getInstrumentSettings(selectedInstrument.value)
      const now = audioContext.value.currentTime
      
      active.gainNode.gain.cancelScheduledValues(now)
      active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now)
      active.gainNode.gain.linearRampToValueAtTime(0, now + settings.release)
      active.oscillator.stop(now + settings.release)
      
      activeKeys.value.delete(key)
    })
    activeOscillators.clear()
    currentNote.value = ''
  }
}

const toggleRecording = () => {
  if (isRecording.value) {
    isRecording.value = false
  } else {
    isRecording.value = true
    recordedNotes.value = []
    recordingStartTime.value = Date.now()
  }
}

const playRecording = () => {
  if (recordedNotes.value.length === 0) return
  
  recordedNotes.value.forEach(({ note, time }) => {
    setTimeout(() => {
      playNote(note)
      setTimeout(() => stopNote(note), 200)
    }, time)
  })
}

// Keyboard event handlers
const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase()
  
  // Find matching key
  const whiteKey = whiteKeys.value.find(k => k.key === key)
  const blackKey = blackKeys.value.find(k => k.key === key)
  
  if (whiteKey) {
    playNote(whiteKey)
  } else if (blackKey) {
    playNote(blackKey)
  } else if (e.code === 'Space') {
    e.preventDefault()
    toggleSustain()
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase()
  
  const whiteKey = whiteKeys.value.find(k => k.key === key)
  const blackKey = blackKeys.value.find(k => k.key === key)
  
  if (whiteKey) {
    stopNote(whiteKey)
  } else if (blackKey) {
    stopNote(blackKey)
  }
}

// Lifecycle
onMounted(() => {
  initAudio()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // Register menu command handlers
  registerMenuCommands()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  
  // Clean up audio
  activeOscillators.forEach(({ oscillator }) => {
    oscillator.stop()
  })
  
  if (audioContext.value) {
    audioContext.value.close()
  }
})

// Register menu command handlers
const registerMenuCommands = () => {
  // File menu commands
  register('keystation.newSession', () => {
    // Clear all recordings and reset state
    recordedNotes.value = []
    isRecording.value = false
    currentNote.value = ''
    activeKeys.value.clear()
    // Stop all active notes
    activeOscillators.forEach(({ oscillator, gainNode }, key) => {
      const settings = getInstrumentSettings(selectedInstrument.value)
      const now = audioContext.value?.currentTime || 0
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(0, now + settings.release)
      oscillator.stop(now + settings.release)
      activeKeys.value.delete(key)
    })
    activeOscillators.clear()
    currentNote.value = ''
  })
  
  register('keystation.startRecording', () => {
    if (!isRecording.value) {
      toggleRecording()
    }
  })
  
  register('keystation.stopRecording', () => {
    if (isRecording.value) {
      toggleRecording()
    }
  })
  
  register('keystation.playRecording', () => {
    playRecording()
  })
  
  register('keystation.clearRecording', () => {
    recordedNotes.value = []
  })
  
  // Edit menu commands
  register('keystation.clearAll', () => {
    recordedNotes.value = []
    currentNote.value = ''
    activeKeys.value.clear()
  })
  
  // Instrument menu commands
  register('keystation.setInstrument', (args?: unknown) => {
    const instrument = getArg<string>(args, 'instrument')
    if (instrument && ['piano', 'synth', 'organ', 'strings', 'brass', 'flute'].includes(instrument)) {
      selectedInstrument.value = instrument
    }
  })
  
  register('keystation.setOscillator', (args?: unknown) => {
    const type = getArg<string>(args, 'type')
    if (type && ['sine', 'triangle', 'sawtooth', 'square'].includes(type)) {
      selectedOscillatorType.value = type as OscillatorType
    }
  })
  
  // Effects menu commands
  register('keystation.setReverb', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') {
      reverb.value = level
    }
  })
  
  register('keystation.setDelay', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') {
      delay.value = level
      if (delayGainNode.value) {
        delayGainNode.value.gain.value = level / 100 * 0.5
      }
    }
  })
  
  register('keystation.toggleSustain', () => {
    toggleSustain()
  })
  
  // Octave menu commands
  register('keystation.setOctave', (args?: unknown) => {
    const octave = getArg<number>(args, 'octave')
    if (typeof octave === 'number' && octave >= 1 && octave <= 7) {
      currentOctave.value = octave
    }
  })
  
  register('keystation.octaveUp', () => {
    changeOctave(1)
  })
  
  register('keystation.octaveDown', () => {
    changeOctave(-1)
  })
  
  // Audio menu commands
  register('keystation.setVolume', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') {
      volume.value = level
      updateVolume()
    }
  })
  
  register('keystation.volumeUp', () => {
    volume.value = Math.min(100, volume.value + 10)
    updateVolume()
  })
  
  register('keystation.volumeDown', () => {
    volume.value = Math.max(0, volume.value - 10)
    updateVolume()
  })
  
  register('keystation.resetAudio', () => {
    // Close existing context
    if (audioContext.value) {
      audioContext.value.close()
    }
    // Reinitialize audio
    initAudio()
  })
  
  // View menu commands
  register('keystation.toggleWaveform', () => {
    // Toggle waveform display visibility (would need to add a ref for this)
    console.log('Toggle waveform display')
  })
  
  register('keystation.toggleKeyLabels', () => {
    // Toggle key labels visibility (would need to add a ref for this)
    console.log('Toggle key labels')
  })
  
  register('keystation.toggleOctaveLabels', () => {
    // Toggle octave labels visibility (would need to add a ref for this)
    console.log('Toggle octave labels')
  })
  
  // Help menu commands
  register('keystation.showKeyboardGuide', () => {
    alert('Keyboard Layout:\n\nWhite Keys: A S D F G H J K L\nBlack Keys: W E T Y U\nSustain: Space\n\nOctave Up: ]\nOctave Down: [')
  })
}

// Helper to safely extract a property from a generic args object
function getArg<T>(args: unknown, key: string): T | undefined {
  if (args && typeof args === 'object' && key in (args as Record<string, unknown>)) {
    return (args as Record<string, unknown>)[key] as T
  }
  return undefined
}
</script>

<style scoped>
.music-keyboard-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  padding: 15px;
  box-sizing: border-box;
  font-family: -apple-system, 'SF Pro Display', 'SF Mono', monospace;
}

.control-panel {
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid #111;
}

.controls-row {
  display: flex;
  gap: 25px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.controls-row:last-child {
  margin-bottom: 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-group label {
  font-size: 10px;
  font-weight: 600;
  color: #00ff88;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 60px;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.control-group select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #333;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  color: #e0e0e0;
  font-size: 11px;
  cursor: pointer;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.control-group select:hover {
  background: linear-gradient(180deg, #222 0%, #111 100%);
  border-color: #00ff88;
}

.control-group input[type="range"] {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #00ff88 0%, #00cc66 100%);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #fff 0%, #ccc 100%);
  border-radius: 50%;
  border: 2px solid #00ff88;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.control-group .value {
  font-size: 10px;
  color: #00ff88;
  min-width: 25px;
  font-family: 'SF Mono', monospace;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.octave-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.octave-buttons button {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid #333;
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  color: #00ff88;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.1s;
}

.octave-buttons button:hover:not(:disabled) {
  background: linear-gradient(180deg, #333 0%, #222 100%);
  border-color: #00ff88;
  transform: translateY(-1px);
}

.octave-buttons button:active {
  transform: translateY(0);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.octave-buttons button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.octave-display {
  font-size: 11px;
  font-weight: 600;
  min-width: 25px;
  text-align: center;
  color: #00ff88;
  font-family: 'SF Mono', monospace;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
}

.sustain-button,
.record-button,
.play-button {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #333;
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  color: #888;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.sustain-button:hover,
.record-button:hover,
.play-button:hover {
  background: linear-gradient(180deg, #333 0%, #222 100%);
  transform: translateY(-1px);
}

.sustain-button.active {
  background: linear-gradient(180deg, #00ff88 0%, #00cc66 100%);
  color: #000;
  border-color: #00ff88;
  box-shadow: 
    0 0 20px rgba(0, 255, 136, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.record-button.recording {
  background: linear-gradient(180deg, #ff3333 0%, #cc0000 100%);
  color: white;
  border-color: #ff3333;
  animation: pulse 1s infinite;
  box-shadow: 
    0 0 20px rgba(255, 51, 51, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.play-button {
  background: linear-gradient(180deg, #00aaff 0%, #0088cc 100%);
  color: white;
  border-color: #00aaff;
}

.play-button:hover {
  box-shadow: 
    0 0 20px rgba(0, 170, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    box-shadow: 
      0 0 20px rgba(255, 51, 51, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  50% { 
    opacity: 0.8; 
    box-shadow: 
      0 0 30px rgba(255, 51, 51, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

.display-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  height: 80px;
}

.waveform-display {
  flex: 1;
  background: linear-gradient(135deg, #001100 0%, #000500 100%);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  border: 1px solid #222;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.8),
    0 1px 0 rgba(255, 255, 255, 0.05);
}

.waveform-display canvas {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.4));
}

.info-display {
  width: 200px;
  background: linear-gradient(135deg, #001100 0%, #000500 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #00ff88;
  border: 1px solid #222;
  font-family: 'SF Mono', monospace;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.8),
    0 1px 0 rgba(255, 255, 255, 0.05);
}

.info-display .hint {
  font-size: 10px;
  color: #00ff88;
  text-align: center;
  padding: 0 10px;
  font-weight: normal;
  opacity: 0.7;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.keyboard-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 0;
}

.keyboard {
  position: relative;
  display: flex;
  gap: 3px;
  padding: 0;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  border-radius: 0;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 0 rgba(255, 255, 255, 0.05);
  border-top: 1px solid #111;
  width: 100%;
  height: 100%;
  justify-content: stretch;
}

.key {
  cursor: pointer;
  transition: all 0.05s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 15px;
  position: relative;
  user-select: none;
}

.white-key {
  flex: 1;
  height: 100%;
  min-height: 250px;
  background: linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 100%);
  border: 1px solid #aaa;
  border-radius: 0 0 6px 6px;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.white-key:hover {
  background: linear-gradient(to bottom, #fff 0%, #f0f0f0 100%);
}

.white-key.active {
  background: linear-gradient(to bottom, #00ff88 0%, #00cc66 100%);
  transform: translateY(2px);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 255, 136, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.black-key {
  width: 45px;
  height: 65%;
  background: linear-gradient(to bottom, #222 0%, #000 100%);
  border-radius: 0 0 4px 4px;
  position: absolute;
  top: 0;
  z-index: 2;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  transform: translateX(-50%);
}

.black-key:hover {
  background: linear-gradient(to bottom, #333 0%, #111 100%);
}

.black-key.active {
  background: linear-gradient(to bottom, #00ff88 0%, #00aa55 100%);
  transform: translateY(2px) translateX(-50%);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 15px rgba(0, 255, 136, 0.6);
}

.key-label {
  font-size: 10px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.white-key.active .key-label {
  color: #000;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.black-key .key-label {
  color: #999;
}

.black-key.active .key-label {
  color: #000;
}

.key-note {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', monospace;
}

.white-key.active .key-note {
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.black-key .key-shortcut {
  font-size: 10px;
  color: #ccc;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'SF Mono', monospace;
}

.black-key.active .key-shortcut {
  background: rgba(0, 0, 0, 0.3);
  color: #000;
}
</style>
