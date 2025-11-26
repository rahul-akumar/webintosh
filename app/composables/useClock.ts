import { onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../stores/os'

export function useClock() {
  const store = useOSStore()
  let timer: number | undefined

  onMounted(() => {
    store.tickClock()
    timer = window.setInterval(() => store.tickClock(), 1000)
  })

  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
  })
}
