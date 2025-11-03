import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useConfigStore } from './config'

export const useWorkoutStore = defineStore('workout', () => {
  const currentPower = ref<number>(0)
  const isBluetoothConnected = ref(false)
  const isSpotifyPlaying = ref(false)
  const currentPlaylistId = ref<string | null>(null)

  const configStore = useConfigStore()

  const currentPowerPercent = computed(() => {
    if (configStore.ftp === 0) return 0
    return Math.round((currentPower.value / configStore.ftp) * 100)
  })

  const targetPlaylistId = computed(() => {
    const zones = configStore.powerZones
    const powerPct = currentPowerPercent.value
    for (const zone of zones) {
      if (powerPct >= zone.minPower) {
        return zone.playlistId
      }
    }
    return zones[zones.length - 1]?.playlistId || null
  })

  function updatePower(watts: number) {
    currentPower.value = watts
  }

  function setBluetoothConnection(connected: boolean) {
    isBluetoothConnected.value = connected
  }

  function setSpotifyPlaying(playing: boolean) {
    isSpotifyPlaying.value = playing
  }

  function setCurrentPlaylist(playlistId: string | null) {
    currentPlaylistId.value = playlistId
  }

  function reset() {
    currentPower.value = 0
    isBluetoothConnected.value = false
    isSpotifyPlaying.value = false
    currentPlaylistId.value = null
  }

  return {
    currentPower,
    currentPowerPercent,
    isBluetoothConnected,
    isSpotifyPlaying,
    currentPlaylistId,
    targetPlaylistId,
    updatePower,
    setBluetoothConnection,
    setSpotifyPlaying,
    setCurrentPlaylist,
    reset,
  }
})
