# 🎵 Chord Generator & Pitch Calculator

A comprehensive web-based music theory and composition tool for musicians, producers, and composers. Calculate pitch shifts, generate chords, build progressions, and export to MIDI—all tuned to A=432Hz.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

## ✨ Features

### 🎹 Pitch & Scale Calculator

- Calculate semitone differences between any two keys and scales
- Support for 14 scale types (Major, Minor, Harmonic Minor, Dorian, Phrygian, Lydian, and more)
- Visual display of all notes in each scale
- Perfect for transposing samples and understanding harmonic relationships

### 🎸 Chord Generator

- 12 preset chord types (Major, Minor, Diminished, Augmented, 7ths, 6ths, etc.)
- Manual note selection for custom voicings
- **Scale-locked randomization** - generate chords within a specific key/scale
- Real-time audio preview with pure sine waves
- Frequency display for each note

### 🎼 Chord Progression Sequencer

- Build progressions up to 16 bars
- Multiple time signatures (3/4, 4/4, 5/4, 6/8, 7/8)
- Adjustable BPM (40-240)
- Play progression preview with accurate timing
- **Export to MIDI** - compatible with all major DAWs

### 🌓 Beautiful UI

- **Light/Dark mode** with smooth transitions
- Dark mode: Cosmic purple/indigo/pink gradients
- Light mode: Dreamy rose/pink pastels
- Fully responsive design
- Intuitive controls and visual feedback

## 🚀 Demo

[**Try it live →**](#) *(Add your deployment link here)*

## 📸 Screenshots

*Add screenshots here showing:*

- *Dark mode interface*
- *Light mode interface*
- *Chord progression builder*

## 🛠️ Tech Stack

- **React** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Web Audio API** - Sound synthesis
- **Pure JavaScript** - MIDI generation (no external libraries!)

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm

### Setup

1. **Clone the repository**
   
   ```bash
   git clone https://github.com/yourusername/chord-generator.git
   cd chord-generator
   ```
1. **Install dependencies**
   
   ```bash
   npm install
   ```
1. **Start development server**
   
   ```bash
   npm start
   ```
1. **Open your browser**
   
   ```
   http://localhost:3000
   ```

## 🎯 Usage

### Calculating Pitch Shifts

1. Select your **original key** and **scale**
1. Select your **target key** and **scale**
1. See the exact semitone difference (e.g., +7 = pitch up 7 semitones)
1. Use this in your DAW to transpose samples

### Building Chords

1. Choose a **chord root** note
1. Either:
- Click a **preset** (Major, Minor, etc.)
- **Manually select** notes by clicking them
- Use **Random** to generate unexpected chords
1. Click **Play** to preview the chord
1. Click **Add** to add it to your progression

### Scale-Locked Randomization

1. Click the **lock icon** to enable scale lock
1. Select your desired **key** and **scale**
1. Click **Random** - chords will only use notes from that scale
1. Perfect for staying tonally coherent while exploring variations

### Creating Progressions

1. Set your **bars** (4, 8, or 16)
1. Set **time signature** and **BPM**
1. Build your chord progression using the chord generator
1. Click **Play** to preview the entire progression
1. Click **Export MIDI** to download

### Importing MIDI into Your DAW

The exported MIDI file contains:

- All your chords with proper timing
- Tempo and time signature information
- Notes placed in the middle octave (C4-B4)

Simply drag and drop the `.mid` file into:

- Ableton Live
- FL Studio
- Logic Pro
- GarageBand
- Any MIDI-compatible DAW

## 🎼 Tuning: A=432Hz

All frequencies are calculated from **A=432Hz** instead of the standard A=440Hz. Many musicians believe 432Hz creates a more harmonious and natural sound.

**Formula used:**

```javascript
frequency = 432 × 2^(semitones_from_A4 / 12)
```

## 🎨 Customization

### Changing the Reference Frequency

Want to use standard A=440Hz tuning? Simply modify this line in the code:

```javascript
const A4 = 432; // Change to 440 for standard tuning
```

### Adding New Scales

Add new scales to the `scalePatterns` object:

```javascript
const scalePatterns = {
  'your-scale-name': [0, 2, 3, 5, 7, 8, 10], // semitone intervals
  // ...
};
```

### Adding New Chord Presets

Add new chords to the `chordPresets` object:

```javascript
const chordPresets = {
  'Your Chord': [0, 4, 7, 10, 14], // semitone intervals from root
  // ...
};
```

## 🤝 Contributing

Contributions are welcome! Here’s how you can help:

1. **Fork the repository**
1. **Create a feature branch**
   
   ```bash
   git checkout -b feature/amazing-feature
   ```
1. **Commit your changes**
   
   ```bash
   git commit -m 'Add some amazing feature'
   ```
1. **Push to the branch**
   
   ```bash
   git push origin feature/amazing-feature
   ```
1. **Open a Pull Request**

### Ideas for Contributions

- [ ] Chord inversions
- [ ] Extended chords (9ths, 11ths, 13ths)
- [ ] Multiple octave support in MIDI export
- [ ] Velocity control per chord
- [ ] Rhythm patterns within bars
- [ ] Save/load progressions (localStorage)
- [ ] Chord name detection algorithm
- [ ] Scale degree notation
- [ ] Audio file export (WAV/MP3)
- [ ] Preset library for common progressions

## 🐛 Known Issues

- Audio playback may not work on some mobile browsers due to autoplay restrictions
- MIDI export uses fixed velocity (100) for all notes
- Scale-locked random can generate duplicate notes if scale has few notes

## 📝 License

This project is licensed under the MIT License - see the <LICENSE> file for details.

## 🙏 Acknowledgments

- Inspired by the needs of bedroom producers and music theory students
- Built with pure Web Audio API - no external audio libraries
- MIDI generation implemented from scratch using binary manipulation
- Special thanks to the music production community

## 📧 Contact

**Your Name** - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: <https://github.com/yourusername/chord-generator>

-----

## 🎓 Learn More

### Music Theory Resources

- [Understanding Scales](https://en.wikipedia.org/wiki/Scale_(music))
- [Chord Construction](https://en.wikipedia.org/wiki/Chord_(music))
- [MIDI Specification](https://www.midi.org/specifications)

### Technical Resources

- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

-----

**Made with ❤️ and 432Hz**

If you found this tool helpful, please consider giving it a ⭐️!
