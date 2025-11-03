import { useAuthStore } from '../stores/auth'
import type { Playlist } from '../types'
import { debug, debugError } from '../utils/debug'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = `${window.location.origin}/callback`
const SCOPES = 'playlist-read-private user-read-playback-state user-modify-playback-state'

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function initiateSpotifyAuth(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem('code_verifier', verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function handleSpotifyCallback(code: string): Promise<void> {
  const verifier = sessionStorage.getItem('code_verifier')
  if (!verifier) {
    throw new Error('Code verifier not found')
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }
  const data = await response.json()
  const authStore = useAuthStore()
  authStore.login({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
  sessionStorage.removeItem('code_verifier')
}

export async function refreshAccessToken(): Promise<void> {
  debug('[Spotify] POST /api/token - Refreshing access token')
  const authStore = useAuthStore()
  if (!authStore.refreshToken) {
    throw new Error('No refresh token available')
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: authStore.refreshToken,
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }
  const data = await response.json()
  authStore.updateAccessToken(data.access_token, data.expires_in)
  debug('[Spotify] Access token refreshed')
}

async function spotifyFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const authStore = useAuthStore()
  if (!authStore.accessToken) {
    throw new Error('Not authenticated')
  }
  if (!authStore.isAuthenticated) {
    await refreshAccessToken()
  }
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${authStore.accessToken}`,
    },
  })
  if (response.status === 401) {
    await refreshAccessToken()
    return spotifyFetch(endpoint, options)
  }
  return response
}

export async function getUserPlaylists(): Promise<Playlist[]> {
  debug('[Spotify] GET /me/playlists - Fetching user playlists')
  const playlists: Playlist[] = []
  let url = '/me/playlists?limit=50'
  while (url) {
    const response = await spotifyFetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch playlists')
    }
    const data = await response.json()
    playlists.push(...data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      uri: item.uri,
    })))
    url = data.next ? data.next.replace('https://api.spotify.com/v1', '') : null
  }
  debug(`[Spotify] Fetched ${playlists.length} playlists`)
  return playlists
}

export async function getCurrentPlayback(): Promise<{ isPlaying: boolean; playlistUri: string | null }> {
  debug('[Spotify] GET /me/player - Getting current playback state')
  const response = await spotifyFetch('/me/player')
  if (response.status === 204) {
    debug('[Spotify] No active playback')
    return { isPlaying: false, playlistUri: null }
  }
  if (!response.ok) {
    throw new Error('Failed to get current playback')
  }
  const data = await response.json()
  const result = {
    isPlaying: data.is_playing,
    playlistUri: data.context?.uri || null,
  }
  debug('[Spotify] Playback state:', result)
  return result
}

export async function startPlayback(playlistUri: string): Promise<void> {
  debug('[Spotify] PUT /me/player/play - Switching to playlist:', playlistUri)
  const response = await spotifyFetch('/me/player/play', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context_uri: playlistUri,
    }),
  })
  if (!response.ok && response.status !== 204) {
    debugError('[Spotify] Failed to start playback, status:', response.status)
    throw new Error('Failed to start playback')
  }
  debug('[Spotify] Playback started successfully')
}
