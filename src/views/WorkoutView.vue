<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Workout</h1>
        <div class="flex gap-4">
          <router-link to="/config" class="text-purple-400 hover:text-purple-300">Config</router-link>
          <router-link to="/settings" class="text-purple-400 hover:text-purple-300">Settings</router-link>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl text-center">
          <h2 class="text-xl font-semibold text-gray-300 mb-4">Current Power</h2>
          <div class="text-8xl font-bold text-white mb-2">
            {{ workoutStore.currentPower }}
          </div>
          <div class="text-2xl text-gray-300">watts</div>
          <div class="mt-4 text-4xl font-bold" :class="getPowerColor()">
            {{ workoutStore.currentPowerPercent }}% FTP
          </div>
        </div>

        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-300 mb-2">Status</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Bluetooth</span>
                <span :class="workoutStore.isBluetoothConnected ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                  {{ workoutStore.isBluetoothConnected ? '● Connected' : '○ Disconnected' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Spotify</span>
                <span :class="workoutStore.isSpotifyPlaying ? 'text-green-400' : 'text-yellow-400'" class="font-semibold">
                  {{ workoutStore.isSpotifyPlaying ? '▶ Playing' : '⏸ Paused' }}
                </span>
              </div>
            </div>
          </div>

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
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-white mb-4">Power Zones</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(zone, index) in configStore.powerZones"
            :key="index"
            class="bg-white/5 rounded-lg p-3 border-2"
            :class="isActiveZone(zone) ? 'border-green-400' : 'border-white/20'"
          >
            <div class="text-lg font-bold text-white">{{ zone.minPower }}%+</div>
            <div class="text-sm text-gray-300 truncate">{{ getPlaylistName(zone.playlistId) }}</div>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          v-if="!isWorkoutActive"
          @click="startWorkout"
          class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-xl"
        >
          Start Workout
        </button>
        <button
          v-else
          @click="stopWorkout"
          class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-xl"
        >
          Stop Workout
        </button>
      </div>

      <div v-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-4">
        <p class="text-red-200">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { useWorkoutStore } from '../stores/workout'
import { usePlaylistsStore } from '../stores/playlists'
import { BluetoothPowerService } from '../services/bluetooth'
import { getCurrentPlayback, startPlayback } from '../services/spotify'
import type { PowerZone } from '../types'

const configStore = useConfigStore()
const workoutStore = useWorkoutStore()
const playlistsStore = usePlaylistsStore()

const isWorkoutActive = ref(false)
const error = ref<string | null>(null)
const bluetoothService = new BluetoothPowerService()
let playbackCheckInterval: number | null = null

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

function getPlaylistName(playlistId: string): string {
  const playlist = playlistsStore.getPlaylistById(playlistId)
  return playlist?.name || 'Unknown'
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

onUnmounted(() => {
  if (isWorkoutActive.value) {
    stopWorkout()
  }
})
</script>
