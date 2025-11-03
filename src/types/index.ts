export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface Playlist {
  id: string
  name: string
  uri: string
}

export interface PlaylistMapping {
  minPower: number
  playlistId: string
}

export interface Config {
  ftp: number
  deviceAddress: string | null
  playlistMapping: PlaylistMapping[]
}

export interface BluetoothDevice {
  id: string
  name: string | undefined
}

export interface PowerMeasurement {
  instantaneousPower: number
  timestamp: number
}
