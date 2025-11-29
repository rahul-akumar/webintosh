/**
 * Audio Context composable for KeyStation
 * Manages WebAudio context, master gain, and effects chain
 */
import { ref, onUnmounted } from 'vue'
import type { AudioNodes } from '../types/keystation'

export function useAudioContext() {
  const audioNodes = ref<AudioNodes>({
    context: null,
    masterGain: null,
    reverb: null,
    delay: null,
    delayGain: null,
    analyser: null,
  })

  const volume = ref(50)
  const reverb = ref(20)
  const delay = ref(0)

  const initAudio = () => {
    if (audioNodes.value.context) return

    type AudioContextConstructor = typeof AudioContext
    const AudioContextClass = window.AudioContext || 
      (window as unknown as { webkitAudioContext: AudioContextConstructor }).webkitAudioContext
    
    const ctx = new AudioContextClass()
    audioNodes.value.context = ctx

    // Create master gain
    const masterGain = ctx.createGain()
    masterGain.gain.value = volume.value / 100
    audioNodes.value.masterGain = masterGain

    // Create reverb
    const reverbNode = ctx.createConvolver()
    createReverbImpulse(ctx, reverbNode)
    audioNodes.value.reverb = reverbNode

    // Create delay
    const delayNode = ctx.createDelay(1)
    delayNode.delayTime.value = 0.3
    audioNodes.value.delay = delayNode

    const delayGain = ctx.createGain()
    delayGain.gain.value = 0
    audioNodes.value.delayGain = delayGain

    // Create analyser for waveform
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    audioNodes.value.analyser = analyser

    // Connect effects chain
    delayNode.connect(delayGain)
    delayGain.connect(delayNode) // Feedback loop
    delayGain.connect(masterGain)

    masterGain.connect(analyser)
    analyser.connect(ctx.destination)
  }

  const createReverbImpulse = (ctx: AudioContext, reverbNode: ConvolverNode) => {
    const length = ctx.sampleRate * 2
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }

    reverbNode.buffer = impulse
  }

  const updateVolume = (newVolume: number) => {
    volume.value = newVolume
    if (audioNodes.value.masterGain) {
      audioNodes.value.masterGain.gain.value = newVolume / 100
    }
  }

  const updateReverb = (newReverb: number) => {
    reverb.value = newReverb
  }

  const updateDelay = (newDelay: number) => {
    delay.value = newDelay
    if (audioNodes.value.delayGain) {
      audioNodes.value.delayGain.gain.value = newDelay / 100 * 0.5
    }
  }

  const resetAudio = () => {
    if (audioNodes.value.context) {
      audioNodes.value.context.close()
    }
    audioNodes.value = {
      context: null,
      masterGain: null,
      reverb: null,
      delay: null,
      delayGain: null,
      analyser: null,
    }
    initAudio()
  }

  const cleanup = () => {
    if (audioNodes.value.context) {
      audioNodes.value.context.close()
    }
  }

  onUnmounted(cleanup)

  return {
    audioNodes,
    volume,
    reverb,
    delay,
    initAudio,
    updateVolume,
    updateReverb,
    updateDelay,
    resetAudio,
    cleanup,
  }
}
