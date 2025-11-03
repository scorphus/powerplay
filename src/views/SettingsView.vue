<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Settings</h1>
        <router-link to="/config" class="text-purple-400 hover:text-purple-300">Back to Config</router-link>
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-semibold text-white mb-4">Account</h2>
          <button
            @click="handleLogout"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Logout from Spotify
          </button>
        </div>

        <div class="border-t border-white/20 pt-6">
          <h2 class="text-xl font-semibold text-white mb-4">Data</h2>
          <button
            @click="handleClearData"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Clear All Data
          </button>
          <p class="text-gray-300 text-sm mt-2">This will remove all saved configuration and require you to login again.</p>
        </div>

        <div class="border-t border-white/20 pt-6">
          <h2 class="text-xl font-semibold text-white mb-4">About</h2>
          <div class="space-y-3 text-gray-300">
            <p>
              <strong class="text-white">PowerPlay</strong> - Power Output Playlist Switcher
            </p>
            <p class="text-sm">
              Automatically switches between Spotify playlists based on your cycling power output from a Bluetooth smart trainer.
            </p>
            <div class="text-sm space-y-2">
              <p><strong class="text-white">Tech Stack:</strong></p>
              <ul class="list-disc list-inside space-y-1 text-gray-400 ml-2">
                <li>Vue 3 + TypeScript</li>
                <li>Vite</li>
                <li>Tailwind CSS</li>
                <li>Spotify Web API</li>
                <li>Web Bluetooth API</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="border-t border-white/20 pt-6">
          <h2 class="text-xl font-semibold text-white mb-4">Setup Guide</h2>
          <div class="space-y-3 text-gray-300 text-sm">
            <div>
              <h3 class="text-white font-semibold mb-1">1. Spotify Developer Setup</h3>
              <p>Register your app at <a href="https://developer.spotify.com/dashboard" target="_blank" class="text-purple-400 hover:text-purple-300 underline">Spotify Developer Dashboard</a></p>
              <ul class="list-disc list-inside ml-4 mt-1 text-gray-400">
                <li>Create a new app</li>
                <li>Add redirect URI: <code class="bg-white/10 px-1 rounded">{{ redirectUri }}</code></li>
                <li>Copy the Client ID to your <code class="bg-white/10 px-1 rounded">.env.local</code> file</li>
              </ul>
            </div>
            <div>
              <h3 class="text-white font-semibold mb-1">2. Browser Requirements</h3>
              <p>Web Bluetooth API is only supported in Chrome and Edge browsers.</p>
            </div>
            <div>
              <h3 class="text-white font-semibold mb-1">3. Device Setup</h3>
              <p>Make sure your smart trainer or power meter is:</p>
              <ul class="list-disc list-inside ml-4 mt-1 text-gray-400">
                <li>Powered on</li>
                <li>In pairing mode</li>
                <li>Not connected to other apps (Zwift, TrainerRoad, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'

const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfigStore()

const redirectUri = `${window.location.origin}/callback`

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    authStore.logout()
    router.push('/')
  }
}

function handleClearData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    authStore.logout()
    configStore.reset()
    router.push('/')
  }
}
</script>
