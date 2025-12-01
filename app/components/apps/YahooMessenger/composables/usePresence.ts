import type { Ref } from 'vue'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db, updateUserPresence } from './useFirebase'

export function usePresence(currentUser: Ref<User | null>) {
  let presenceInterval: NodeJS.Timeout | null = null

  const startPresenceUpdates = () => {
    if (!currentUser.value) return

    presenceInterval = setInterval(async () => {
      if (currentUser.value) {
        await updateUserPresence(currentUser.value.uid)
      }
    }, 30000)
  }

  const stopPresenceUpdates = () => {
    if (presenceInterval) {
      clearInterval(presenceInterval)
      presenceInterval = null
    }
  }

  const markOffline = async () => {
    if (currentUser.value) {
      await updateDoc(doc(db, 'users', currentUser.value.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }).catch(() => {})
    }
  }

  return {
    startPresenceUpdates,
    stopPresenceUpdates,
    markOffline
  }
}
