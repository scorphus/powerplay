import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Config, PowerZone } from '../types'

const STORAGE_KEY = 'powerplay_config'

const DEFAULT_CONFIG: Config = {
  ftp: 250,
  deviceAddress: null,
  powerZones: [
    { minPower: 0, playlistId: '' },
  ],
}

export const useConfigStore = defineStore('config', () => {
  const ftp = ref<number>(DEFAULT_CONFIG.ftp)
  const deviceAddress = ref<string | null>(DEFAULT_CONFIG.deviceAddress)
  const powerZones = ref<PowerZone[]>([...DEFAULT_CONFIG.powerZones])

  function setFtp(value: number) {
    ftp.value = value
    saveToStorage()
  }

  function setDeviceAddress(address: string) {
    deviceAddress.value = address
    saveToStorage()
  }

  function addZone(zone: PowerZone) {
    powerZones.value.push(zone)
    sortZones()
    saveToStorage()
  }

  function updateZone(index: number, zone: PowerZone) {
    powerZones.value[index] = zone
    sortZones()
    saveToStorage()
  }

  function removeZone(index: number) {
    powerZones.value.splice(index, 1)
    saveToStorage()
  }

  function setPowerZones(zones: PowerZone[]) {
    powerZones.value = zones
    saveToStorage()
  }

  function sortZones() {
    powerZones.value.sort((a, b) => b.minPower - a.minPower)
  }

  function saveToStorage() {
    const data: Config = {
      ftp: ftp.value,
      deviceAddress: deviceAddress.value,
      powerZones: powerZones.value,
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
        powerZones.value = data.powerZones
        sortZones()
      } catch (error) {
        console.error('Failed to parse stored config data:', error)
      }
    }
  }

  function reset() {
    ftp.value = DEFAULT_CONFIG.ftp
    deviceAddress.value = DEFAULT_CONFIG.deviceAddress
    powerZones.value = [...DEFAULT_CONFIG.powerZones]
    saveToStorage()
  }

  loadFromStorage()

  return {
    ftp,
    deviceAddress,
    powerZones,
    setFtp,
    setDeviceAddress,
    addZone,
    updateZone,
    removeZone,
    setPowerZones,
    reset,
  }
})
