<template>
  <div class="control-panel">
    <div class="controls-row">
      <!-- Instrument Selection -->
      <div class="control-group">
        <label>Instrument</label>
        <select :value="selectedInstrument" @change="$emit('update:selectedInstrument', ($event.target as HTMLSelectElement).value)">
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
        <select :value="selectedOscillatorType" @change="$emit('update:selectedOscillatorType', ($event.target as HTMLSelectElement).value)">
          <option value="sine">Sine</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="square">Square</option>
        </select>
      </div>

      <!-- Volume Control -->
      <div class="control-group">
        <label>Volume</label>
        <input 
          :value="volume" 
          type="range" 
          min="0" 
          max="100" 
          @input="$emit('update:volume', Number(($event.target as HTMLInputElement).value))"
        >
        <span class="value">{{ volume }}</span>
      </div>

      <!-- Octave Selection -->
      <div class="control-group">
        <label>Octave</label>
        <div class="octave-buttons">
          <button :disabled="currentOctave <= 1" @click="$emit('octaveChange', -1)">-</button>
          <span class="octave-display">C{{ currentOctave }}</span>
          <button :disabled="currentOctave >= 7" @click="$emit('octaveChange', 1)">+</button>
        </div>
      </div>
    </div>

    <div class="controls-row">
      <!-- Effects -->
      <div class="control-group">
        <label>Reverb</label>
        <input 
          :value="reverb" 
          type="range" 
          min="0" 
          max="100"
          @input="$emit('update:reverb', Number(($event.target as HTMLInputElement).value))"
        >
        <span class="value">{{ reverb }}</span>
      </div>

      <div class="control-group">
        <label>Delay</label>
        <input 
          :value="delay" 
          type="range" 
          min="0" 
          max="100"
          @input="$emit('update:delay', Number(($event.target as HTMLInputElement).value))"
        >
        <span class="value">{{ delay }}</span>
      </div>

      <div class="control-group">
        <label>Sustain</label>
        <button :class="['sustain-button', { active: sustainOn }]" @click="$emit('toggleSustain')">
          {{ sustainOn ? 'ON' : 'OFF' }}
        </button>
      </div>

      <!-- Recording Controls -->
      <div class="control-group">
        <label>Recording</label>
        <button :class="['record-button', { recording: isRecording }]" @click="$emit('toggleRecording')">
          {{ isRecording ? '⏺ Stop' : '⏺ Record' }}
        </button>
        <button v-if="hasRecording" class="play-button" @click="$emit('playRecording')">
          ▶ Play
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InstrumentType } from '../types/keystation'

defineProps<{
  selectedInstrument: InstrumentType
  selectedOscillatorType: OscillatorType
  volume: number
  reverb: number
  delay: number
  currentOctave: number
  sustainOn: boolean
  isRecording: boolean
  hasRecording: boolean
}>()

defineEmits<{
  'update:selectedInstrument': [value: string]
  'update:selectedOscillatorType': [value: string]
  'update:volume': [value: number]
  'update:reverb': [value: number]
  'update:delay': [value: number]
  'octaveChange': [direction: number]
  'toggleSustain': []
  'toggleRecording': []
  'playRecording': []
}>()
</script>
