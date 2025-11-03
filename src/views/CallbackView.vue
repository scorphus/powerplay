<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl text-center">
      <div v-if="!error" class="space-y-4">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        <p class="text-white text-lg">Completing authentication...</p>
      </div>
      <div v-else class="space-y-4">
        <div class="text-red-400 text-5xl">⚠️</div>
        <p class="text-white text-lg font-semibold">Authentication Failed</p>
        <p class="text-gray-300">{{ error }}</p>
        <button
          @click="router.push('/')"
          class="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Back to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { handleSpotifyCallback } from '../services/spotify'

const router = useRouter()
const error = ref<string | null>(null)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const errorParam = params.get('error')
  if (errorParam) {
    error.value = `Spotify authorization error: ${errorParam}`
    return
  }
  if (!code) {
    error.value = 'No authorization code received'
    return
  }
  try {
    await handleSpotifyCallback(code)
    router.push('/config')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  }
})
</script>
