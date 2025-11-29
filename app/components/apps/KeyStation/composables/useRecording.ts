/**
 * Recording composable for KeyStation
 * Handles note recording and playback functionality
 */
import { ref } from 'vue'
import type { RecordedNote, PlayableNote } from '../types/keystation'

export function useRecording(
  playNote: (note: PlayableNote) => void,
  stopNote: (note: PlayableNote) => void
) {
  const isRecording = ref(false)
  const recordedNotes = ref<RecordedNote[]>([])
  const recordingStartTime = ref(0)

  const startRecording = () => {
    isRecording.value = true
    recordedNotes.value = []
    recordingStartTime.value = Date.now()
  }

  const stopRecording = () => {
    isRecording.value = false
  }

  const toggleRecording = () => {
    if (isRecording.value) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const clearRecording = () => {
    recordedNotes.value = []
  }

  const addRecordedNote = (recordedNote: RecordedNote) => {
    if (isRecording.value) {
      recordedNotes.value.push({
        ...recordedNote,
        time: recordedNote.time - recordingStartTime.value
      })
    }
  }

  const playRecording = () => {
    if (recordedNotes.value.length === 0) return

    recordedNotes.value.forEach(({ note, time }) => {
      setTimeout(() => {
        const playableNote: PlayableNote = {
          key: note.key,
          note: note.note,
          label: note.note,
          octaveOffset: note.octaveOffset
        }
        playNote(playableNote)
        setTimeout(() => stopNote(playableNote), 200)
      }, time)
    })
  }

  return {
    isRecording,
    recordedNotes,
    startRecording,
    stopRecording,
    toggleRecording,
    clearRecording,
    addRecordedNote,
    playRecording,
  }
}
