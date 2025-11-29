/**
 * Waveform composable for KeyStation
 * Handles canvas animation for visualizing audio output
 */
import { ref, onUnmounted, type Ref } from 'vue'
import type { AudioNodes } from '../types/keystation'

export function useWaveform(
  audioNodes: Ref<AudioNodes>,
  oscillatorType: Ref<OscillatorType>
) {
  const waveformCanvas = ref<HTMLCanvasElement | null>(null)
  const animationId = ref<number | null>(null)

  const getWaveformColor = (type: OscillatorType): { color: string; lineWidth: number } => {
    switch (type) {
      case 'sine':
        return { color: '#ff00cc', lineWidth: 2.5 }
      case 'square':
        return { color: '#00ffcc', lineWidth: 2 }
      case 'sawtooth':
        return { color: '#00ccff', lineWidth: 1.5 }
      case 'triangle':
        return { color: '#cc00ff', lineWidth: 3 }
      default:
        return { color: '#00ffcc', lineWidth: 2 }
    }
  }

  const drawWaveform = () => {
    if (!waveformCanvas.value || !audioNodes.value.analyser) return

    const canvas = waveformCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const bufferLength = audioNodes.value.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationId.value = requestAnimationFrame(draw)

      audioNodes.value.analyser!.getByteTimeDomainData(dataArray)

      ctx.fillStyle = 'rgba(20, 20, 30, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { color: strokeColor, lineWidth } = getWaveformColor(oscillatorType.value)

      ctx.lineWidth = lineWidth
      ctx.strokeStyle = strokeColor
      ctx.shadowBlur = 10
      ctx.shadowColor = strokeColor
      ctx.beginPath()

      const sliceWidth = canvas.width / 2 / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] ?? 128) / 128.0
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

  const stopAnimation = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
      animationId.value = null
    }
  }

  onUnmounted(stopAnimation)

  return {
    waveformCanvas,
    drawWaveform,
    stopAnimation,
  }
}
