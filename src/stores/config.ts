import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Config, PlaylistMapping } from '../types'

const STORAGE_KEY = 'powerplay_config'

const DEFAULT_CONFIG: Config = {
  ftp: 250,
  deviceAddress: null,
  playlistMapping: [
    { minPower: 0, playlistId: '' },
  ],
}

export const useConfigStore = defineStore('config', () => {
  const ftp = ref<number>(DEFAULT_CONFIG.ftp)
  const deviceAddress = ref<string | null>(DEFAULT_CONFIG.deviceAddress)
  const playlistMapping = ref<PlaylistMapping[]>([...DEFAULT_CONFIG.playlistMapping])

  function setFtp(value: number) {
    ftp.value = value
    saveToStorage()
  }

  function setDeviceAddress(address: string | null) {
    deviceAddress.value = address
    saveToStorage()
  }

  function addMapping(mapping: PlaylistMapping) {
    playlistMapping.value.push(mapping)
    sortMapping()
    saveToStorage()
  }

  function updateMapping(index: number, mapping: PlaylistMapping) {
    playlistMapping.value[index] = mapping
    sortMapping()
    saveToStorage()
  }

  function removeMapping(index: number) {
    playlistMapping.value.splice(index, 1)
    saveToStorage()
  }

  function setPlaylistMapping(mapping: PlaylistMapping[]) {
    playlistMapping.value = mapping
    saveToStorage()
  }

  function sortMapping() {
    playlistMapping.value.sort((a, b) => b.minPower - a.minPower)
  }

  function saveToStorage() {
    const data: Config = {
      ftp: ftp.value,
      deviceAddress: deviceAddress.value,
      playlistMapping: playlistMapping.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: Config = JSON.parse(stored)
        ftp.value = data.ftp
        deviceAddress.value = data.deviceAddress
        playlistMapping.value = data.playlistMapping
        sortMapping()
      } catch (error) {
        console.error('Failed to parse stored config data:', error)
      }
    }
  }

  function reset() {
    ftp.value = DEFAULT_CONFIG.ftp
    deviceAddress.value = DEFAULT_CONFIG.deviceAddress
    playlistMapping.value = [...DEFAULT_CONFIG.playlistMapping]
    saveToStorage()
  }

  loadFromStorage()

  return {
    ftp,
    deviceAddress,
    playlistMapping,
    setFtp,
    setDeviceAddress,
    addMapping,
    updateMapping,
    removeMapping,
    setPlaylistMapping,
    reset,
  }
})
