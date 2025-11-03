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

export interface PowerZone {
  minPower: number
  playlistId: string
}

export interface Config {
  ftp: number
  deviceAddress: string | null
  powerZones: PowerZone[]
}

export interface BluetoothDevice {
  id: string
  name: string | undefined
}

export interface PowerMeasurement {
  instantaneousPower: number
  timestamp: number
}
