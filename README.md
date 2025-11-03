# PowerPlay

Browser-based app to automatically switch Spotify playlists based on cycling power output from a Bluetooth smart trainer.

## Features

- 🎵 Automatic Spotify playlist switching based on power output
- 🚴 Real-time power monitoring via Web Bluetooth
- ⚡ FTP-based power to playlist mapping
- 🎨 Modern, responsive UI with dark mode
- 💾 Local storage for configuration persistence

## Prerequisites

- **Browser**: Chrome or Edge (Web Bluetooth API required)
- **Spotify**: Premium account
- **Device**: Bluetooth smart trainer or power meter with Cycling Power Service
- **Connection**: HTTPS (or localhost for development)

## Setup

### 1. Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:5173/callback`
4. Copy your Client ID

### 2. Project Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your Spotify Client ID to .env.local
# VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

## Usage

### First Time Setup

1. **Login**: Click "Login with Spotify" and authorize the app
2. **Configure FTP**: Enter your Functional Threshold Power in watts
3. **Connect Device**: Click "Scan" to select your smart trainer
4. **Power to Playlist**: Define power thresholds (% of FTP) and assign playlists
5. **Save**: Configuration is saved automatically

### During Workout

1. **Start Workout**: Click "Start Workout" on the config page
2. **Connect**: Allow Bluetooth permission when prompted
3. **Ride**: The app will automatically switch playlists based on your power output
4. **Monitor**: Watch real-time power, FTP %, and current playlist

### Power to Playlist Example

| Min Power % | Playlist           |
| ----------- | ------------------ |
| 95%         | Heavy Metal        |
| 80%         | Rock Classics      |
| 60%         | Instrumental Blues |
| 0%          | Calm Acoustic      |

When your power is at 85% FTP, it will play "Hard Efforts". When you push to 100% FTP, it switches to "Maximum Intensity".

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Spotify Web API** - Music control
- **Web Bluetooth API** - Trainer connectivity

## Project Structure

```
src/
├── components/       # Reusable UI components
├── views/            # Page components
│   ├── LoginView.vue
│   ├── CallbackView.vue
│   ├── ConfigView.vue
│   ├── WorkoutView.vue
│   └── SettingsView.vue
├── services/         # API and Bluetooth services
│   ├── spotify.ts
│   └── bluetooth.ts
├── stores/           # Pinia state management
│   ├── auth.ts
│   ├── config.ts
│   ├── playlists.ts
│   └── workout.ts
├── router/           # Vue Router configuration
└── types/            # TypeScript type definitions
```

## Troubleshooting

### Bluetooth Connection Issues

- Make sure your device is powered on and in pairing mode
- Disconnect from other apps (Zwift, TrainerRoad, etc.)
- Try refreshing the page and scanning again
- Check that you're using Chrome or Edge

### Spotify Playback Issues

- Ensure Spotify is open on at least one device
- Check that you have an active Spotify Premium subscription
- Verify the app has playback permissions

### Authentication Errors

- Verify your Client ID in `.env.local`
- Check that redirect URI matches in Spotify Developer Dashboard
- Try logging out and logging back in

## Development

```bash
# Run dev server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The app can be deployed to any static hosting service:

- **GitHub Pages**: Free hosting for public repos
- **Vercel**: One-click deployment with automatic HTTPS
- **Netlify**: Similar to Vercel with easy setup

**Important**: Update the redirect URI in your Spotify Developer Dashboard to match your production URL.

## Known Limitations

1. **Browser Support**: Chrome and Edge only (Web Bluetooth limitation)
2. **HTTPS Required**: Must be served over HTTPS (except localhost)
3. **Active Spotify Session**: Requires Spotify to be playing on a device
4. **Single Device**: Bluetooth can only connect to one app at a time
5. **API Rate Limits**: Spotify has rate limits on playlist switching

## Future Enhancements

- [ ] ZWO workout file import (structured workouts)
- [ ] Workout history and analytics
- [ ] Multiple user profiles
- [ ] Custom zone colors and names
- [ ] Audio cues for zone changes
- [ ] Mobile app version
- [ ] Integration with Strava/TrainingPeaks

## License

BSD-3-Clause

See [LICENSE](LICENSE) for details.
