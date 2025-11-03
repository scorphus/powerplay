import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SpotifyTokens } from '../types'

const STORAGE_KEY = 'powerplay_auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const expiresAt = ref<number | null>(null)

  const isAuthenticated = computed(() => {
    return accessToken.value !== null && expiresAt.value !== null && Date.now() < expiresAt.value
  })

  function login(tokens: SpotifyTokens) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    expiresAt.value = tokens.expiresAt
    saveToStorage()
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function updateAccessToken(newToken: string, expiresIn: number) {
    accessToken.value = newToken
    expiresAt.value = Date.now() + expiresIn * 1000
    saveToStorage()
  }

  function saveToStorage() {
    const data: SpotifyTokens = {
      accessToken: accessToken.value!,
      refreshToken: refreshToken.value!,
      expiresAt: expiresAt.value!,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: SpotifyTokens = JSON.parse(stored)
        accessToken.value = data.accessToken
        refreshToken.value = data.refreshToken
        expiresAt.value = data.expiresAt
      } catch (error) {
        console.error('Failed to parse stored auth data:', error)
        logout()
      }
    }
  }

  loadFromStorage()

  return {
    accessToken,
    refreshToken,
    expiresAt,
    isAuthenticated,
    login,
    logout,
    updateAccessToken,
  }
})
