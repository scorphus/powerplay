import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Playlist } from '../types'
import { getUserPlaylists } from '../services/spotify'

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<Playlist[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlaylists() {
    loading.value = true
    error.value = null
    try {
      playlists.value = await getUserPlaylists()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch playlists'
      console.error('Error fetching playlists:', err)
    } finally {
      loading.value = false
    }
  }

  function getPlaylistById(id: string): Playlist | undefined {
    return playlists.value.find(p => p.id === id)
  }

  return {
    playlists,
    loading,
    error,
    fetchPlaylists,
    getPlaylistById,
  }
})
