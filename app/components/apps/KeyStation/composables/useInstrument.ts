/**
 * Instrument composable for KeyStation
 * Handles note playing, instrument settings, and oscillator management
 */
import { ref, type Ref } from 'vue'
import type { 
  InstrumentType, 
  InstrumentSettings, 
  PlayableNote, 
  ActiveOscillator,
  AudioNodes,
  RecordedNote,
} from '../types/keystation'
import { NOTE_FREQUENCIES } from '../types/keystation'

export function useInstrument(
  audioNodes: Ref<AudioNodes>,
  reverb: Ref<number>,
  delay: Ref<number>,
  initAudio: () => void
) {
  const selectedInstrument = ref<InstrumentType>('piano')
  const selectedOscillatorType = ref<OscillatorType>('sine')
  const currentOctave = ref(4)
  const sustainOn = ref(false)
  const activeKeys = ref(new Set<string>())
  const currentNote = ref('')

  // Active oscillators map
  const activeOscillators = new Map<string, ActiveOscillator>()

  const getInstrumentSettings = (instrument: InstrumentType): InstrumentSettings => {
    switch (instrument) {
      case 'piano':
        return {
          waveform: 'triangle',
          harmonics: [1, 0.5, 0.3, 0.2],
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.5
        }
      case 'synth':
        return {
          waveform: 'sawtooth',
          harmonics: [1, 0.7, 0.5, 0.3],
          attack: 0.05,
          decay: 0.2,
          sustain: 0.6,
          release: 0.3
        }
      case 'organ':
        return {
          waveform: 'sine',
          harmonics: [1, 0.8, 0.6, 0.4, 0.3],
          attack: 0.01,
          decay: 0.1,
          sustain: 0.8,
          release: 0.2
        }
      case 'strings':
        return {
          waveform: 'sawtooth',
          harmonics: [1, 0.4, 0.3, 0.2],
          attack: 0.3,
          decay: 0.2,
          sustain: 0.7,
          release: 0.8
        }
      case 'brass':
        return {
          waveform: 'sawtooth',
          harmonics: [1, 0.9, 0.7, 0.5],
          attack: 0.1,
          decay: 0.2,
          sustain: 0.7,
          release: 0.3
        }
      case 'flute':
        return {
          waveform: 'sine',
          harmonics: [1, 0.2],
          attack: 0.2,
          decay: 0.1,
          sustain: 0.6,
          release: 0.4
        }
      default:
        return {
          waveform: 'sine',
          harmonics: [1],
          attack: 0.01,
          decay: 0.3,
          sustain: 0.5,
          release: 0.5
        }
    }
  }

  const playNote = (
    note: PlayableNote, 
    onRecord?: (recordedNote: RecordedNote) => void
  ) => {
    if (!audioNodes.value.context || !audioNodes.value.masterGain) {
      initAudio()
    }

    const ctx = audioNodes.value.context
    const masterGain = audioNodes.value.masterGain
    if (!ctx || !masterGain) return

    const noteKey = note.key
    const noteName = note.note
    const octaveOffset = note.octaveOffset || 0
    const octave = currentOctave.value + octaveOffset

    // Don't replay if already playing
    if (activeOscillators.has(noteKey)) return

    // Calculate frequency
    const baseFreq = NOTE_FREQUENCIES[noteName]
    if (!baseFreq) return
    const frequency = baseFreq * Math.pow(2, octave - 4)

    // Get instrument settings
    const settings = getInstrumentSettings(selectedInstrument.value)

    // Create oscillator and gain for this note
    const oscillator = ctx.createOscillator()
    const noteGain = ctx.createGain()

    oscillator.type = selectedOscillatorType.value
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    // ADSR envelope
    const now = ctx.currentTime
    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(1, now + settings.attack)
    noteGain.gain.linearRampToValueAtTime(settings.sustain, now + settings.attack + settings.decay)

    // Connect nodes
    oscillator.connect(noteGain)

    // Add reverb if enabled
    if (reverb.value > 0 && audioNodes.value.reverb) {
      const reverbGain = ctx.createGain()
      reverbGain.gain.value = reverb.value / 100
      noteGain.connect(reverbGain)
      reverbGain.connect(audioNodes.value.reverb)
      audioNodes.value.reverb.connect(masterGain)
    }

    // Add delay if enabled
    if (delay.value > 0 && audioNodes.value.delay && audioNodes.value.delayGain) {
      noteGain.connect(audioNodes.value.delay)
      audioNodes.value.delayGain.gain.value = delay.value / 100 * 0.5
    }

    noteGain.connect(masterGain)

    oscillator.start()

    // Store reference
    activeOscillators.set(noteKey, { oscillator, gainNode: noteGain })
    activeKeys.value.add(noteKey)
    currentNote.value = `${noteName}${octave}`

    // Trigger record callback if provided
    if (onRecord) {
      onRecord({
        note: { key: note.key, note: noteName, octave, octaveOffset },
        time: Date.now()
      })
    }
  }

  const stopNote = (note: PlayableNote) => {
    const ctx = audioNodes.value.context
    if (!ctx || sustainOn.value) return

    const noteKey = note.key
    const active = activeOscillators.get(noteKey)

    if (active) {
      const settings = getInstrumentSettings(selectedInstrument.value)
      const now = ctx.currentTime

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

  const toggleSustain = () => {
    sustainOn.value = !sustainOn.value

    // If turning off sustain, stop all notes
    if (!sustainOn.value && audioNodes.value.context) {
      const ctx = audioNodes.value.context
      activeOscillators.forEach((active, key) => {
        const settings = getInstrumentSettings(selectedInstrument.value)
        const now = ctx.currentTime

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

  const changeOctave = (direction: number) => {
    currentOctave.value = Math.max(1, Math.min(7, currentOctave.value + direction))
  }

  const setOctave = (octave: number) => {
    if (octave >= 1 && octave <= 7) {
      currentOctave.value = octave
    }
  }

  const setInstrument = (instrument: InstrumentType) => {
    selectedInstrument.value = instrument
  }

  const setOscillatorType = (type: OscillatorType) => {
    selectedOscillatorType.value = type
  }

  const stopAllNotes = () => {
    const ctx = audioNodes.value.context
    if (!ctx) return

    activeOscillators.forEach(({ oscillator, gainNode }) => {
      const settings = getInstrumentSettings(selectedInstrument.value)
      const now = ctx.currentTime
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(0, now + settings.release)
      oscillator.stop(now + settings.release)
    })
    activeOscillators.clear()
    activeKeys.value.clear()
    currentNote.value = ''
  }

  return {
    selectedInstrument,
    selectedOscillatorType,
    currentOctave,
    sustainOn,
    activeKeys,
    currentNote,
    getInstrumentSettings,
    playNote,
    stopNote,
    toggleSustain,
    changeOctave,
    setOctave,
    setInstrument,
    setOscillatorType,
    stopAllNotes,
  }
}
