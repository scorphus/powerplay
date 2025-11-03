<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Configuration</h1>
        <router-link to="/settings" class="text-purple-400 hover:text-purple-300">Settings</router-link>
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl space-y-6">
        <div>
          <label class="block text-white font-semibold mb-2">FTP (Functional Threshold Power)</label>
          <input
            v-model.number="localFtp"
            type="number"
            min="1"
            class="w-full bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your FTP in watts"
          />
          <p class="text-gray-300 text-sm mt-1">Your maximum sustainable power for one hour</p>
        </div>

        <div>
          <label class="block text-white font-semibold mb-2">Bluetooth Device</label>
          <div class="flex gap-2">
            <input
              :value="deviceName || 'Not connected'"
              disabled
              class="flex-1 bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2"
            />
            <button
              @click="handleScanDevice"
              :disabled="scanning"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              {{ scanning ? 'Scanning...' : 'Scan' }}
            </button>
          </div>
          <p class="text-gray-300 text-sm mt-1">Select your smart trainer or power meter</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="block text-white font-semibold">Power Zones → Playlists</label>
            <button
              @click="addZone"
              class="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              + Add Zone
            </button>
          </div>

          <div v-if="playlistsStore.loading" class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p class="text-gray-300 mt-2">Loading playlists...</p>
          </div>

          <div v-else-if="playlistsStore.error" class="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p class="text-red-200">{{ playlistsStore.error }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(zone, index) in localZones"
              :key="index"
              class="bg-white/5 border border-white/20 rounded-lg p-4 flex items-center gap-4"
            >
              <div class="flex-shrink-0 w-24">
                <label class="block text-gray-300 text-sm mb-1">Min %</label>
                <input
                  v-model.number="zone.minPower"
                  type="number"
                  min="0"
                  max="200"
                  class="w-full bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div class="flex-1">
                <label class="block text-gray-300 text-sm mb-1">Playlist</label>
                <select
                  v-model="zone.playlistId"
                  class="w-full bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <button
                @click="removeZone(index)"
                class="flex-shrink-0 text-red-400 hover:text-red-300 font-bold text-xl"
                :disabled="localZones.length <= 1"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            @click="handleSave"
            :disabled="!canSave"
            class="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Save Configuration
          </button>
          <button
            @click="handleStartWorkout"
            :disabled="!canStartWorkout"
            class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../stores/config'
import { usePlaylistsStore } from '../stores/playlists'
import { BluetoothPowerService } from '../services/bluetooth'
import type { PowerZone } from '../types'

const router = useRouter()
const configStore = useConfigStore()
const playlistsStore = usePlaylistsStore()

const localFtp = ref(configStore.ftp)
const localZones = ref<PowerZone[]>([...configStore.powerZones])
const deviceName = ref<string | null>(null)
const scanning = ref(false)

const bluetoothService = new BluetoothPowerService()

const canSave = computed(() => {
  return localFtp.value > 0 && localZones.value.every(z => z.playlistId !== '')
})

const canStartWorkout = computed(() => {
  return canSave.value && configStore.deviceAddress !== null
})

function addZone() {
  localZones.value.push({ minPower: 0, playlistId: '' })
}

function removeZone(index: number) {
  if (localZones.value.length > 1) {
    localZones.value.splice(index, 1)
  }
}

async function handleScanDevice() {
  scanning.value = true
  try {
    const device = await bluetoothService.requestDevice()
    deviceName.value = device.name || 'Unknown Device'
    configStore.setDeviceAddress(device.id)
  } catch (error) {
    console.error('Failed to scan for device:', error)
    alert('Failed to scan for Bluetooth device. Make sure your device is powered on and nearby.')
  } finally {
    scanning.value = false
  }
}

function handleSave() {
  configStore.setFtp(localFtp.value)
  configStore.powerZones = [...localZones.value]
  localZones.value.sort((a, b) => b.minPower - a.minPower)
  alert('Configuration saved!')
}

function handleStartWorkout() {
  handleSave()
  router.push('/workout')
}

onMounted(async () => {
  await playlistsStore.fetchPlaylists()
  if (configStore.deviceAddress) {
    deviceName.value = 'Previously connected device'
  }
})
</script>
