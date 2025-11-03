<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-5xl font-bold text-white mb-2">PowerPlay</h1>
        <p class="text-xl text-gray-300">Power Output Playlist Switcher</p>
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <div class="space-y-6">
          <p class="text-gray-200 text-center">
            Automatically switch Spotify playlists based on your cycling power output from a Bluetooth smart trainer.
          </p>

          <div v-if="!isBluetoothSupported" class="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p class="text-red-200 text-sm">
              <strong>⚠️ Browser not supported</strong><br>
              Web Bluetooth is required. Please use Chrome or Edge browser.
            </p>
          </div>

          <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span v-if="!loading">Login with Spotify</span>
            <span v-else>Redirecting...</span>
          </button>

          <div class="text-sm text-gray-300 space-y-2">
            <p><strong>Requirements:</strong></p>
            <ul class="list-disc list-inside space-y-1 text-gray-400">
              <li>Spotify Premium account</li>
              <li>Chrome or Edge browser</li>
              <li>Bluetooth smart trainer or power meter</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="text-center text-sm text-gray-400">
        <p>Need a Spotify Client ID? <a href="https://developer.spotify.com/dashboard" target="_blank" class="text-purple-400 hover:text-purple-300 underline">Register your app</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { initiateSpotifyAuth } from '../services/spotify'
import { isBluetoothSupported } from '../services/bluetooth'

const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await initiateSpotifyAuth()
  } catch (error) {
    console.error('Failed to initiate Spotify auth:', error)
    loading.value = false
  }
}
</script>
