import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, loginUser, logoutUser } from './useFirebase'

export function useYahooAuth() {
  const currentUser = ref<User | null>(null)
  const username = ref('')

  const login = async () => {
    if (!username.value.trim()) return

    try {
      await loginUser(username.value)
    } catch (error: unknown) {
      console.error('Login error:', error)
      let errorMessage = 'Failed to sign in. '
      const err = error as { code?: string; message?: string }

      if (err.code === 'permission-denied') {
        errorMessage += 'Firebase permissions error. Please check Firestore rules.'
      } else if (err.code === 'unavailable') {
        errorMessage += 'Firebase is unavailable. Check your internet connection.'
      } else {
        errorMessage += err.message || 'Please try again.'
      }

      alert(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    if (currentUser.value) {
      await logoutUser(currentUser.value.uid)
    }
  }

  const setupAuthListener = (onLogin: (user: User) => void) => {
    return onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      if (user) {
        onLogin(user)
      }
    })
  }

  return {
    currentUser,
    username,
    login,
    logout,
    setupAuthListener
  }
}
