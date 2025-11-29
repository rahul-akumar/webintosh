<template>
  <div class="music-keyboard-app">
    <ControlPanel
      :selected-instrument="instrument.selectedInstrument.value"
      :selected-oscillator-type="instrument.selectedOscillatorType.value"
      :volume="audio.volume.value"
      :reverb="audio.reverb.value"
      :delay="audio.delay.value"
      :current-octave="instrument.currentOctave.value"
      :sustain-on="instrument.sustainOn.value"
      :is-recording="recording.isRecording.value"
      :has-recording="recording.recordedNotes.value.length > 0"
      @update:selected-instrument="instrument.setInstrument($event as InstrumentType)"
      @update:selected-oscillator-type="instrument.setOscillatorType($event as OscillatorType)"
      @update:volume="audio.updateVolume"
      @update:reverb="audio.updateReverb"
      @update:delay="audio.updateDelay"
      @octave-change="instrument.changeOctave"
      @toggle-sustain="instrument.toggleSustain"
      @toggle-recording="recording.toggleRecording"
      @play-recording="recording.playRecording"
    />

    <WaveformDisplay
      ref="waveformDisplayRef"
      :oscillator-type="instrument.selectedOscillatorType.value"
      :current-note="instrument.currentNote.value"
    />

    <Keyboard
      :active-keys="instrument.activeKeys.value"
      @note-on="handleNoteOn"
      @note-off="handleNoteOff"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { register } from '../../../utils/menuCommands'
import type { InstrumentType, PlayableNote } from './types/keystation'

// Components
import ControlPanel from './components/ControlPanel.vue'
import WaveformDisplay from './components/WaveformDisplay.vue'
import Keyboard from './components/Keyboard.vue'

// Composables
import { useAudioContext } from './composables/useAudioContext'
import { useInstrument } from './composables/useInstrument'
import { useWaveform } from './composables/useWaveform'
import { useRecording } from './composables/useRecording'
import { useKeyboardInput } from './composables/useKeyboardInput'

// Initialize composables
const audio = useAudioContext()
const instrument = useInstrument(audio.audioNodes, audio.reverb, audio.delay, audio.initAudio)

// Create wrapper functions for recording that include the record callback
const handleNoteOn = (note: PlayableNote) => {
  instrument.playNote(note, recording.addRecordedNote)
}

const handleNoteOff = (note: PlayableNote) => {
  instrument.stopNote(note)
}

const recording = useRecording(handleNoteOn, handleNoteOff)
const waveform = useWaveform(audio.audioNodes, instrument.selectedOscillatorType)

// Setup keyboard input
useKeyboardInput(
  (note) => instrument.playNote(note, recording.addRecordedNote),
  instrument.stopNote,
  instrument.toggleSustain
)

// Waveform display ref
const waveformDisplayRef = ref<InstanceType<typeof WaveformDisplay> | null>(null)

// Helper to safely extract a property from a generic args object
function getArg<T>(args: unknown, key: string): T | undefined {
  if (args && typeof args === 'object' && key in (args as Record<string, unknown>)) {
    return (args as Record<string, unknown>)[key] as T
  }
  return undefined
}

// Register menu commands
const registerMenuCommands = () => {
  // File menu
  register('keystation.newSession', () => {
    recording.clearRecording()
    instrument.stopAllNotes()
  })

  register('keystation.startRecording', () => {
    if (!recording.isRecording.value) recording.toggleRecording()
  })

  register('keystation.stopRecording', () => {
    if (recording.isRecording.value) recording.toggleRecording()
  })

  register('keystation.playRecording', () => recording.playRecording())
  register('keystation.clearRecording', () => recording.clearRecording())

  // Edit menu
  register('keystation.clearAll', () => {
    recording.clearRecording()
    instrument.stopAllNotes()
  })

  // Instrument menu
  register('keystation.setInstrument', (args?: unknown) => {
    const inst = getArg<string>(args, 'instrument')
    if (inst && ['piano', 'synth', 'organ', 'strings', 'brass', 'flute'].includes(inst)) {
      instrument.setInstrument(inst as InstrumentType)
    }
  })

  register('keystation.setOscillator', (args?: unknown) => {
    const type = getArg<string>(args, 'type')
    if (type && ['sine', 'triangle', 'sawtooth', 'square'].includes(type)) {
      instrument.setOscillatorType(type as OscillatorType)
    }
  })

  // Effects menu
  register('keystation.setReverb', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') audio.updateReverb(level)
  })

  register('keystation.setDelay', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') audio.updateDelay(level)
  })

  register('keystation.toggleSustain', () => instrument.toggleSustain())

  // Octave menu
  register('keystation.setOctave', (args?: unknown) => {
    const octave = getArg<number>(args, 'octave')
    if (typeof octave === 'number') instrument.setOctave(octave)
  })

  register('keystation.octaveUp', () => instrument.changeOctave(1))
  register('keystation.octaveDown', () => instrument.changeOctave(-1))

  // Audio menu
  register('keystation.setVolume', (args?: unknown) => {
    const level = getArg<number>(args, 'level')
    if (typeof level === 'number') audio.updateVolume(level)
  })

  register('keystation.volumeUp', () => {
    audio.updateVolume(Math.min(100, audio.volume.value + 10))
  })

  register('keystation.volumeDown', () => {
    audio.updateVolume(Math.max(0, audio.volume.value - 10))
  })

  register('keystation.resetAudio', () => audio.resetAudio())

  // View menu (placeholders)
  register('keystation.toggleWaveform', () => {})
  register('keystation.toggleKeyLabels', () => {})
  register('keystation.toggleOctaveLabels', () => {})

  // Help menu
  register('keystation.showKeyboardGuide', () => {
    alert('Keyboard Layout:\n\nWhite Keys: A S D F G H J K L\nBlack Keys: W E T Y U\nSustain: Space\n\nOctave Up: ]\nOctave Down: [')
  })
}

// Lifecycle
onMounted(() => {
  audio.initAudio()
  registerMenuCommands()

  // Initialize waveform when canvas is ready
  watch(
    () => waveformDisplayRef.value?.canvas,
    (canvas) => {
      if (canvas) {
        waveform.waveformCanvas.value = canvas
        waveform.drawWaveform()
      }
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  waveform.stopAnimation()
  instrument.stopAllNotes()
})
</script>

<style>
@import "./styles/keystation.css";
</style>
