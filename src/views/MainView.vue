<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- Not Authenticated: Show Login -->
    <div v-if="!authStore.isAuthenticated" class="min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-white mb-2">PowerPlay</h1>
          <p class="text-xl text-gray-300">Power Output Playlist Switcher</p>
        </div>

        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <div class="space-y-6">
            <p class="text-gray-200 text-center">
              Automatically switch Spotify playlists based on your cycling power output.
            </p>

            <div v-if="!isBluetoothSupported()" class="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p class="text-red-200 text-sm">
                <strong>⚠️ Browser not supported</strong><br>
                Web Bluetooth is required. Please use Chrome or Edge.
              </p>
            </div>

            <button
              @click="handleLogin"
              :disabled="loading"
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <span v-if="!loading">Login with Spotify</span>
              <span v-else>Redirecting...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Authenticated: Main App -->
    <div v-else class="p-4 md:p-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-white">PowerPlay</h1>
          <button @click="showSettings = !showSettings" class="text-purple-400 hover:text-purple-300">
            {{ showSettings ? 'Close' : 'Settings' }}
          </button>
        </div>

        <!-- Settings Panel -->
        <div v-if="showSettings" class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-4">
          <h2 class="text-xl font-semibold text-white">Settings</h2>
          <button
            @click="handleLogout"
            class="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Logout from Spotify
          </button>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Power Display (2/3 on large screens) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Connection Status & Controls -->
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="space-y-2">
                  <div class="flex items-center gap-4">
                    <span class="text-gray-400">Bluetooth</span>
                    <span :class="workoutStore.isBluetoothConnected ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                      {{ workoutStore.isBluetoothConnected ? '● Connected' : '○ Disconnected' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-gray-400">Spotify</span>
                    <span :class="workoutStore.isSpotifyPlaying ? 'text-green-400' : 'text-yellow-400'" class="font-semibold">
                      {{ workoutStore.isSpotifyPlaying ? '▶ Playing' : '⏸ Paused' }}
                    </span>
                  </div>
                </div>
                <button
                  v-if="!isWorkoutActive"
                  @click="startWorkout"
                  :disabled="!canStartWorkout"
                  class="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Start Workout
                </button>
                <button
                  v-else
                  @click="stopWorkout"
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Stop Workout
                </button>
              </div>
            </div>

            <!-- Power Display -->
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl text-center">
              <h2 class="text-xl font-semibold text-gray-300 mb-4">Current Power</h2>
              <div class="text-8xl font-bold text-white mb-2">
                {{ workoutStore.currentPower }}
              </div>
              <div class="text-2xl text-gray-300 mb-4">watts</div>
              <div class="text-5xl font-bold" :class="getPowerColor()">
                {{ workoutStore.currentPowerPercent }}% FTP
              </div>
            </div>

            <!-- Current Playlist & Target -->
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-300 mb-2">Current Playlist</h3>
                <div class="bg-white/5 rounded-lg p-3">
                  <p class="text-white font-medium">{{ currentPlaylistName || 'None' }}</p>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-300 mb-2">Target Zone</h3>
                <div class="bg-white/5 rounded-lg p-3">
                  <p class="text-white font-medium">{{ targetZonePercent }}% FTP</p>
                  <p class="text-gray-400 text-sm mt-1">{{ targetPlaylistName || 'No target' }}</p>
                </div>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p class="text-red-200">{{ error }}</p>
            </div>
          </div>

          <!-- Right Column: Configuration (1/3 on large screens) -->
          <div class="space-y-6">
            <!-- FTP Configuration -->
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-4">
              <h2 class="text-xl font-semibold text-white">Configuration</h2>

              <div>
                <label class="block text-white font-semibold mb-2 text-sm">FTP (watts)</label>
                <input
                  v-model.number="localFtp"
                  @change="handleSaveFtp"
                  type="number"
                  min="1"
                  class="w-full bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="255"
                />
              </div>

              <div>
                <label class="block text-white font-semibold mb-2 text-sm">Bluetooth Device</label>
                <button
                  @click="handleScanDevice"
                  :disabled="scanning || isWorkoutActive"
                  class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {{ scanning ? 'Scanning...' : deviceName || 'Scan for Device' }}
                </button>
              </div>
            </div>

            <!-- Power Zones -->
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">Power Zones</h3>
                <button
                  @click="addZone"
                  class="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                >
                  + Add
                </button>
              </div>

              <div v-if="playlistsStore.loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>

              <div v-else class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(zone, index) in localZones"
                  :key="index"
                  class="bg-white/5 border-2 rounded-lg p-3"
                  :class="isActiveZone(zone) ? 'border-green-400' : 'border-white/20'"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <input
                      v-model.number="zone.minPower"
                      @change="handleSaveZones"
                      type="number"
                      min="0"
                      max="200"
                      class="w-16 bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span class="text-white text-sm">%+</span>
                    <button
                      @click="removeZone(index)"
                      class="ml-auto text-red-400 hover:text-red-300 font-bold text-xl"
                      :disabled="localZones.length <= 1"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    v-model="zone.playlistId"
                    @change="handleSaveZones"
                    class="w-full bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" class="bg-gray-800">Select playlist...</option>
                    <option
                      v-for="playlist in playlistsStore.playlists"
                      :key="playlist.id"
                      :value="playlist.id"
                      class="bg-gray-800"
                    >
                      {{ playlist.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useWorkoutStore } from '../stores/workout'
import { usePlaylistsStore } from '../stores/playlists'
import { BluetoothPowerService, isBluetoothSupported } from '../services/bluetooth'
import { initiateSpotifyAuth, getCurrentPlayback, startPlayback } from '../services/spotify'
import type { PowerZone } from '../types'

const authStore = useAuthStore()
const configStore = useConfigStore()
const workoutStore = useWorkoutStore()
const playlistsStore = usePlaylistsStore()

const loading = ref(false)
const showSettings = ref(false)
const isWorkoutActive = ref(false)
const error = ref<string | null>(null)
const scanning = ref(false)
const deviceName = ref<string | null>(null)

const localFtp = ref(configStore.ftp)
const localZones = ref<PowerZone[]>([...configStore.powerZones])

const bluetoothService = new BluetoothPowerService()
let playbackCheckInterval: number | null = null

const canStartWorkout = computed(() => {
  return localFtp.value > 0 && localZones.value.every(z => z.playlistId !== '') && configStore.deviceAddress !== null
})

const currentPlaylistName = computed(() => {
  if (!workoutStore.currentPlaylistId) return null
  const playlist = playlistsStore.getPlaylistById(workoutStore.currentPlaylistId)
  return playlist?.name
})

const targetPlaylistName = computed(() => {
  if (!workoutStore.targetPlaylistId) return null
  const playlist = playlistsStore.getPlaylistById(workoutStore.targetPlaylistId)
  return playlist?.name
})

const targetZonePercent = computed(() => {
  const targetId = workoutStore.targetPlaylistId
  if (!targetId) return 0
  const zone = configStore.powerZones.find(z => z.playlistId === targetId)
  return zone?.minPower || 0
})

function getPowerColor(): string {
  const pct = workoutStore.currentPowerPercent
  if (pct < 55) return 'text-blue-400'
  if (pct < 75) return 'text-green-400'
  if (pct < 90) return 'text-yellow-400'
  if (pct < 105) return 'text-orange-400'
  return 'text-red-400'
}

function isActiveZone(zone: PowerZone): boolean {
  return zone.playlistId === workoutStore.targetPlaylistId
}

async function handleLogin() {
  loading.value = true
  try {
    await initiateSpotifyAuth()
  } catch (err) {
    console.error('Failed to initiate Spotify auth:', err)
    loading.value = false
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    authStore.logout()
  }
}

function handleSaveFtp() {
  configStore.setFtp(localFtp.value)
}

function handleSaveZones() {
  configStore.powerZones = [...localZones.value]
  localZones.value.sort((a, b) => b.minPower - a.minPower)
}

function addZone() {
  localZones.value.push({ minPower: 0, playlistId: '' })
}

function removeZone(index: number) {
  if (localZones.value.length > 1) {
    localZones.value.splice(index, 1)
    handleSaveZones()
  }
}

async function handleScanDevice() {
  scanning.value = true
  try {
    const device = await bluetoothService.requestDevice()
    deviceName.value = device.name || 'Unknown Device'
    configStore.setDeviceAddress(device.id)
  } catch (err) {
    console.error('Failed to scan for device:', err)
    error.value = 'Failed to scan for Bluetooth device. Make sure your device is powered on and nearby.'
  } finally {
    scanning.value = false
  }
}

async function startWorkout() {
  error.value = null
  try {
    if (!bluetoothService.isConnected()) {
      await bluetoothService.requestDevice()
      await bluetoothService.connect()
    }
    workoutStore.setBluetoothConnection(true)
    await bluetoothService.startNotifications(handlePowerMeasurement)
    playbackCheckInterval = setInterval(checkPlayback, 2000) as unknown as number
    isWorkoutActive.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to start workout'
    console.error('Failed to start workout:', err)
  }
}

async function stopWorkout() {
  isWorkoutActive.value = false
  if (playbackCheckInterval) {
    clearInterval(playbackCheckInterval)
    playbackCheckInterval = null
  }
  try {
    await bluetoothService.stopNotifications()
    await bluetoothService.disconnect()
    workoutStore.setBluetoothConnection(false)
    workoutStore.reset()
  } catch (err) {
    console.error('Failed to stop workout:', err)
  }
}

function handlePowerMeasurement(power: number) {
  workoutStore.updatePower(power)
  checkAndSwitchPlaylist()
}

async function checkPlayback() {
  try {
    const playback = await getCurrentPlayback()
    workoutStore.setSpotifyPlaying(playback.isPlaying)
    if (playback.playlistUri) {
      const playlistId = playback.playlistUri.split(':').pop() || null
      workoutStore.setCurrentPlaylist(playlistId)
    }
  } catch (err) {
    console.error('Failed to check playback:', err)
  }
}

async function checkAndSwitchPlaylist() {
  const targetId = workoutStore.targetPlaylistId
  const currentId = workoutStore.currentPlaylistId
  if (targetId && targetId !== currentId) {
    try {
      const playlist = playlistsStore.getPlaylistById(targetId)
      if (playlist) {
        await startPlayback(playlist.uri)
        workoutStore.setCurrentPlaylist(targetId)
        workoutStore.setSpotifyPlaying(true)
      }
    } catch (err) {
      console.error('Failed to switch playlist:', err)
    }
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await playlistsStore.fetchPlaylists()
    if (configStore.deviceAddress) {
      deviceName.value = 'Previously connected device'
    }
  }
})

onUnmounted(() => {
  if (isWorkoutActive.value) {
    stopWorkout()
  }
})
</script>
