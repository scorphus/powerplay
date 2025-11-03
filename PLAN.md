# PowerPlay Web App - Implementation Plan

## Overview
Browser-based app to automatically switch Spotify playlists based on cycling power output from a Bluetooth smart trainer.

## Tech Stack
- **Frontend Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **APIs**:
  - Spotify Web API (OAuth + Playback Control)
  - Web Bluetooth API (Cycling Power Service)

## Architecture

### 1. Project Setup
- [x] Create Vue 3 + TS project with Vite
- [x] Install Pinia
- [ ] Install and configure Tailwind CSS
- [ ] Configure TypeScript strict mode
- [ ] Set up project structure (services, stores, components, views)

### 2. Spotify Integration

#### OAuth Flow
- Implement Authorization Code with PKCE flow
- Store tokens in localStorage
- Handle token refresh automatically
- Redirect URI: `http://localhost:5173/callback`

#### Spotify Service (`src/services/spotify.ts`)
- `authenticate()` - Start OAuth flow
- `handleCallback()` - Process OAuth redirect
- `refreshToken()` - Refresh access token
- `getUserPlaylists()` - Fetch user's playlists
- `getCurrentPlayback()` - Get current playback state
- `startPlayback(playlistId)` - Switch to specific playlist

#### User Setup Required
- Register app at https://developer.spotify.com/dashboard
- Get Client ID
- Add redirect URI: `http://localhost:5173/callback`
- No client secret needed (PKCE flow)

### 3. Web Bluetooth Integration

#### Cycling Power Service (`src/services/bluetooth.ts`)
- Port Python pycycling logic to TypeScript
- Implement GATT Cycling Power Service (UUID: 0x1818)
- Characteristics:
  - Cycling Power Measurement (0x2A63) - notifications
  - Cycling Power Feature (0x2A65) - read
  - Sensor Location (0x2A5D) - read

#### Bluetooth Service Methods
- `requestDevice()` - Show device picker
- `connect(device)` - Connect to device
- `disconnect()` - Disconnect from device
- `startNotifications(callback)` - Listen for power data
- `parsePowerMeasurement(data)` - Parse DataView to power watts

#### Browser Compatibility
- Chrome/Edge only (no Firefox/Safari support yet)
- HTTPS required (or localhost)
- Add compatibility check on app load

### 4. State Management (Pinia Stores)

#### Auth Store (`src/stores/auth.ts`)
- State: `accessToken`, `refreshToken`, `expiresAt`, `isAuthenticated`
- Actions: `login()`, `logout()`, `refreshAccessToken()`
- Persist to localStorage

#### Config Store (`src/stores/config.ts`)
- State: `ftp`, `deviceAddress`, `playlistMapping: { minPower: number, playlistId: string }[]`
- Actions: `setFtp()`, `addMapping()`, `removeMapping()`, `updateMapping()`
- Persist to localStorage

#### Workout Store (`src/stores/workout.ts`)
- State: `currentPower`, `isConnected`, `isPlaying`, `currentPlaylist`
- Actions: `updatePower()`, `switchPlaylist()`
- Not persisted (runtime only)

#### Playlists Store (`src/stores/playlists.ts`)
- State: `playlists: { id: string, name: string, uri: string }[]`
- Actions: `fetchPlaylists()`
- Cache in memory

### 5. UI Components & Views

#### Views (Pages)

**LoginView** (`src/views/LoginView.vue`)
- Spotify login button
- Brief app description
- Browser compatibility warning

**CallbackView** (`src/views/CallbackView.vue`)
- Handle OAuth redirect
- Extract code from URL
- Exchange for tokens
- Redirect to config

**ConfigView** (`src/views/ConfigView.vue`)
- FTP input field
- Bluetooth device selector (scan button)
- Power to playlist mapper
  - Table with columns: Min Power %, Playlist dropdown
  - Add/remove mapping buttons
  - Sort mappings automatically by power %
- Save button
- Navigate to workout when ready

**WorkoutView** (`src/views/WorkoutView.vue`)
- Real-time power display (large, prominent)
- Current FTP % indicator
- Active mapping highlight
- Current playlist name & playing status
- Connection status badges (Bluetooth, Spotify)
- Start/stop workout button
- Settings/config link

**SettingsView** (`src/views/SettingsView.vue`)
- Logout button
- Clear local storage
- About/help text
- Link to Spotify Developer setup instructions

#### Reusable Components

**BluetoothButton** (`src/components/BluetoothButton.vue`)
- Scan for devices
- Show connection status
- Emit device selection

**PlaylistSelector** (`src/components/PlaylistSelector.vue`)
- Dropdown of user playlists
- Search/filter
- Emit selected playlist

**PowerDisplay** (`src/components/PowerDisplay.vue`)
- Large power reading (watts)
- FTP percentage
- Color-coded by mapping

**MappingTable** (`src/components/MappingTable.vue`)
- Table of power to playlist mappings
- Add/edit/remove functionality
- Validation (no overlapping mappings)

### 6. Routing

```
/ → LoginView (if not authenticated)
/callback → CallbackView
/config → ConfigView (requires auth)
/workout → WorkoutView (requires auth + config)
/settings → SettingsView (requires auth)
```

### 7. Core Logic Flow

#### Startup
1. Check localStorage for auth tokens
2. If not authenticated → show login
3. If authenticated → validate token, fetch playlists
4. Load config from localStorage
5. Navigate to appropriate view

#### Workout Mode
1. Connect to Bluetooth device
2. Start power measurement notifications
3. On each power reading:
   - Update display
   - Calculate FTP %
   - Determine target playlist
   - If playlist changed → switch playlist
4. Handle disconnections gracefully

#### Power to Playlist Matching
```typescript
function getPlaylistForPower(powerPct: number, mapping: PlaylistMapping[]): string {
  // Mappings sorted by minPower descending
  for (const m of mapping) {
    if (powerPct >= m.minPower) {
      return m.playlistId
    }
  }
  return mapping[mapping.length - 1].playlistId // fallback to lowest mapping
}
```

### 8. Additional Features

#### LocalStorage Schema
```typescript
{
  "powerplay_auth": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": 1234567890
  },
  "powerplay_config": {
    "ftp": 255,
    "deviceAddress": "7C47D35F-B669-2830-4D08-D7A412880E9B",
    "playlistMapping": [
      { "minPower": 95, "playlistId": "..." },
      { "minPower": 80, "playlistId": "..." },
      { "minPower": 0, "playlistId": "..." }
    ]
  }
}
```

#### Error Handling
- Bluetooth connection failures
- Spotify API errors
- Token expiration
- Network issues
- Show toast notifications for errors

#### UX Enhancements
- Loading states for async operations
- Smooth transitions between views
- Dark mode (Tailwind dark: classes)
- Responsive design (mobile-friendly)
- Keyboard shortcuts (spacebar to start/stop)

### 9. Development Workflow

#### Setup Steps
1. `npm install`
2. Create `.env.local` with `VITE_SPOTIFY_CLIENT_ID`
3. `npm run dev`
4. Register Spotify app
5. Test with smart trainer

#### Build & Deploy
- `npm run build` → static files in `dist/`
- Deploy to GitHub Pages, Vercel, or Netlify
- Must serve over HTTPS for Web Bluetooth to work

## File Structure (Target)

```
powerplay-web/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── BluetoothButton.vue
│   │   ├── PlaylistSelector.vue
│   │   ├── PowerDisplay.vue
│   │   └── MappingTable.vue
│   ├── services/
│   │   ├── bluetooth.ts
│   │   ├── spotify.ts
│   │   └── storage.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── playlists.ts
│   │   └── workout.ts
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── CallbackView.vue
│   │   ├── ConfigView.vue
│   │   ├── WorkoutView.vue
│   │   └── SettingsView.vue
│   ├── router/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Implementation Order

1. ✅ Project setup (Vite + Vue + TS)
2. ✅ Install Pinia
3. Configure Tailwind CSS
4. Set up routing (Vue Router)
5. Create basic layout & navigation
6. Implement Spotify OAuth service
7. Create auth store & login flow
8. Implement Spotify API service
9. Create playlists store
10. Implement Web Bluetooth service
11. Create config store
12. Build ConfigView UI
13. Build WorkoutView UI
14. Implement workout logic (power → playlist switching)
15. Add error handling & loading states
16. Polish UI/UX
17. Test end-to-end flow
18. Documentation & README

## Testing Strategy

- Manual testing with real smart trainer
- Test Spotify OAuth flow
- Test playlist switching logic
- Test Bluetooth connection/disconnection
- Test various power ranges & FTP values
- Cross-browser testing (Chrome/Edge)

## Known Limitations

1. **Browser Support**: Chrome/Edge only (Web Bluetooth API)
2. **HTTPS Required**: Won't work on HTTP (except localhost)
3. **Active Spotify Session**: User must have Spotify open and playing
4. **Device Pairing**: May need to unpair from other apps first
5. **Rate Limits**: Spotify API has rate limits on playlist switching

## Future Enhancements

- Import/export config
- Workout history tracking
- ZWO file import (like Python version)
- Multiple profile support
- Custom mapping colors
- Audio cues for playlist changes
- Integration with Strava/TrainingPeaks
- Mobile app (React Native/Capacitor)
