/**
 * KeyStation App Types
 */

export type InstrumentType = 'piano' | 'synth' | 'organ' | 'strings' | 'brass' | 'flute'

export interface PlayableNote {
  key: string
  note: string
  label: string
  octaveOffset?: number
  position?: string // For black keys positioning
}

export interface NoteEvent {
  key: string
  note: string
  octave: number
  octaveOffset?: number
}

export interface RecordedNote {
  note: NoteEvent
  time: number
}

export interface InstrumentSettings {
  waveform: OscillatorType
  harmonics: number[]
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface ActiveOscillator {
  oscillator: OscillatorNode
  gainNode: GainNode
}

export interface AudioNodes {
  context: AudioContext | null
  masterGain: GainNode | null
  reverb: ConvolverNode | null
  delay: DelayNode | null
  delayGain: GainNode | null
  analyser: AnalyserNode | null
}

// Note frequencies (A4 = 440Hz)
export const NOTE_FREQUENCIES: Record<string, number> = {
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

// Default keyboard mappings
export const WHITE_KEYS: PlayableNote[] = [
  { key: 'A', note: 'C', label: 'C' },
  { key: 'S', note: 'D', label: 'D' },
  { key: 'D', note: 'E', label: 'E' },
  { key: 'F', note: 'F', label: 'F' },
  { key: 'G', note: 'G', label: 'G' },
  { key: 'H', note: 'A', label: 'A' },
  { key: 'J', note: 'B', label: 'B' },
  { key: 'K', note: 'C', label: 'C', octaveOffset: 1 },
  { key: 'L', note: 'D', label: 'D', octaveOffset: 1 },
]

export const BLACK_KEYS: PlayableNote[] = [
  { key: 'W', note: 'C#', label: 'C#', position: '11.11%' },
  { key: 'E', note: 'D#', label: 'D#', position: '22.22%' },
  { key: 'T', note: 'F#', label: 'F#', position: '44.44%' },
  { key: 'Y', note: 'G#', label: 'G#', position: '55.55%' },
  { key: 'U', note: 'A#', label: 'A#', position: '66.66%' },
]
