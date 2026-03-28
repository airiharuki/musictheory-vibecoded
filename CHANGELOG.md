# Changelog

## [Unreleased]

### Added
- **Stem Splitter Page** - New `/stems` route for audio track splitting into drums, bass, vocals, and other stems
- **Real Audio Analysis** - Replaced simulated YouTube analysis with real-time BPM, key, and time signature detection using librosa
- **YouTube & SoundCloud Support** - Audio download and processing for both platforms using yt-dlp
- **Python Backend Service** - FastAPI backend deployed via Vercel experimentalServices
- **Vercel experimentalServices Configuration** - Multi-service setup with frontend and backend
- **Format Conversion** - WAV and MP3 output options for downloaded audio
- **Deployment Documentation** - Complete guide for setting up and deploying on Vercel
- **Navigation Updates** - Added "Stems" tab to main page and analyzer page headers
- **API Endpoints**:
  - `POST /api/analyze-audio` - Real audio analysis with key, BPM, time signature
  - `POST /api/split-stems` - Stem splitting using Demucs backend
  - `POST /api/download-audio` - Download audio from YouTube/SoundCloud

### Changed
- **Analyzer Page** - Now calls real backend API instead of simulated analysis
- **Theme Transitions** - Added smooth 500ms CSS transitions for all color/background changes
- **BPM Input** - Made BPM textbox fully typable with validation on blur
- **README.md** - Added emoji throughout and comprehensive contribution guidelines

### Fixed
- **Hydration Errors** - Fixed SVG coordinate precision in Circle of Fifths by rounding to 2 decimals
- **Theme Toggle** - Sun/moon icons now animate with rotation and scale transitions

### Technical
- Updated `package.json` with no new frontend dependencies needed
- Created `python-backend/pyproject.toml` with production-ready dependencies
- Created `vercel.json` with experimentalServices configuration
- Established `/api` route prefix for backend communication

## Previous Changes

### v1.0 Initial Release
- Pitch & Scale Calculator with 14 scale types
- Chord Generator with 12 presets and scale-locking
- Progression Builder with MIDI export
- Circle of Fifths (Musical & Camelot modes)
- YouTube Analyzer (simulated)
- Dark/Light theme with smooth transitions
- Responsive design for all devices
