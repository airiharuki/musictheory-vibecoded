"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Sun, Moon, Music, Play, Square, Plus, Trash2, Shuffle, Lock, Unlock, Download, ArrowUp, ArrowDown } from "lucide-react"

// Constants
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const SCALES: Record<string, number[]> = {
  "Major": [0, 2, 4, 5, 7, 9, 11],
  "Minor": [0, 2, 3, 5, 7, 8, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Phrygian": [0, 1, 3, 5, 7, 8, 10],
  "Lydian": [0, 2, 4, 6, 7, 9, 11],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "Locrian": [0, 1, 3, 5, 6, 8, 10],
  "Pentatonic Major": [0, 2, 4, 7, 9],
  "Pentatonic Minor": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Whole Tone": [0, 2, 4, 6, 8, 10],
  "Chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

const CHORD_PRESETS: Record<string, number[]> = {
  "Major": [0, 4, 7],
  "Minor": [0, 3, 7],
  "Diminished": [0, 3, 6],
  "Augmented": [0, 4, 8],
  "Sus2": [0, 2, 7],
  "Sus4": [0, 5, 7],
  "Major 7": [0, 4, 7, 11],
  "Minor 7": [0, 3, 7, 10],
  "Dominant 7": [0, 4, 7, 10],
  "Major 6": [0, 4, 7, 9],
  "Minor 6": [0, 3, 7, 9],
  "Diminished 7": [0, 3, 6, 9],
}

const TIME_SIGNATURES = ["3/4", "4/4", "5/4", "6/8", "7/8"]
const BAR_OPTIONS = [4, 8, 16]

// Circle of Fifths data - clockwise from C
const CIRCLE_OF_FIFTHS_MAJOR = [
  { note: "C", camelot: "8B" },
  { note: "G", camelot: "9B" },
  { note: "D", camelot: "10B" },
  { note: "A", camelot: "11B" },
  { note: "E", camelot: "12B" },
  { note: "B", camelot: "1B" },
  { note: "F#", camelot: "2B" },
  { note: "C#", camelot: "3B" },
  { note: "G#", camelot: "4B" },
  { note: "D#", camelot: "5B" },
  { note: "A#", camelot: "6B" },
  { note: "F", camelot: "7B" },
]

const CIRCLE_OF_FIFTHS_MINOR = [
  { note: "Am", camelot: "8A" },
  { note: "Em", camelot: "9A" },
  { note: "Bm", camelot: "10A" },
  { note: "F#m", camelot: "11A" },
  { note: "C#m", camelot: "12A" },
  { note: "G#m", camelot: "1A" },
  { note: "D#m", camelot: "2A" },
  { note: "A#m", camelot: "3A" },
  { note: "Fm", camelot: "4A" },
  { note: "Cm", camelot: "5A" },
  { note: "Gm", camelot: "6A" },
  { note: "Dm", camelot: "7A" },
]

// Helper functions
function getScaleNotes(root: string, scale: string): string[] {
  const rootIdx = NOTES.indexOf(root)
  const pattern = SCALES[scale]
  return pattern.map((interval) => NOTES[(rootIdx + interval) % 12])
}

function calculateFrequency(note: string): number {
  const noteIdx = NOTES.indexOf(note)
  const semitonesFromA = noteIdx - 9 // A is index 9
  return 432 * Math.pow(2, semitonesFromA / 12)
}

function getSemitoneDifference(fromKey: string, toKey: string): number {
  const fromIdx = NOTES.indexOf(fromKey)
  const toIdx = NOTES.indexOf(toKey)
  let diff = toIdx - fromIdx

  // Handle wraparound for shortest path
  if (diff > 6) diff -= 12
  if (diff < -6) diff += 12

  return diff
}

// MIDI Generation Functions
function writeVariableLength(value: number): number[] {
  const bytes: number[] = []
  let v = value
  bytes.push(v & 0x7f)
  v >>= 7
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80)
    v >>= 7
  }
  return bytes
}

function generateMidiFile(
  progression: { notes: string[] }[],
  bpm: number,
  timeSignature: string
): Uint8Array {
  const [numerator, denominator] = timeSignature.split("/").map(Number)
  const ticksPerBeat = 480
  const ticksPerBar = ticksPerBeat * numerator * (4 / denominator)
  const microsecondsPerBeat = Math.round(60000000 / bpm)

  // Track data
  const trackData: number[] = []

  // Tempo meta event
  trackData.push(0x00) // Delta time
  trackData.push(0xff, 0x51, 0x03) // Tempo meta event
  trackData.push((microsecondsPerBeat >> 16) & 0xff)
  trackData.push((microsecondsPerBeat >> 8) & 0xff)
  trackData.push(microsecondsPerBeat & 0xff)

  // Time signature meta event
  trackData.push(0x00) // Delta time
  trackData.push(0xff, 0x58, 0x04) // Time signature meta event
  trackData.push(numerator)
  trackData.push(Math.log2(denominator))
  trackData.push(24) // MIDI clocks per metronome click
  trackData.push(8) // 32nd notes per quarter note

  // Note events for each chord
  progression.forEach((chord, chordIndex) => {
    const deltaTime = chordIndex === 0 ? 0 : ticksPerBar
    const deltaBytes = writeVariableLength(deltaTime)

    // Note-on events
    chord.notes.forEach((note, noteIndex) => {
      const midiNote = NOTES.indexOf(note) + 60 // C4 = 60
      if (noteIndex === 0) {
        trackData.push(...deltaBytes)
      } else {
        trackData.push(0x00)
      }
      trackData.push(0x90, midiNote, 100) // Note-on, channel 0, velocity 100
    })

    // Note-off events (after bar duration)
    const offDeltaBytes = writeVariableLength(ticksPerBar)
    chord.notes.forEach((note, noteIndex) => {
      const midiNote = NOTES.indexOf(note) + 60
      if (noteIndex === 0) {
        trackData.push(...offDeltaBytes)
      } else {
        trackData.push(0x00)
      }
      trackData.push(0x80, midiNote, 0) // Note-off, channel 0, velocity 0
    })
  })

  // End of track
  trackData.push(0x00, 0xff, 0x2f, 0x00)

  // Build MIDI file
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length
    0x00, 0x00, // Format 0
    0x00, 0x01, // 1 track
    (ticksPerBeat >> 8) & 0xff,
    ticksPerBeat & 0xff,
  ]

  const trackLength = trackData.length
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
  ]

  return new Uint8Array([...header, ...trackHeader, ...trackData])
}

export default function MusicTheoryTool() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Pitch Calculator state
  const [baseKey, setBaseKey] = useState("C")
  const [baseScale, setBaseScale] = useState("Major")
  const [targetKey, setTargetKey] = useState("G")
  const [targetScale, setTargetScale] = useState("Major")

  // Chord Generator state
  const [chordRoot, setChordRoot] = useState("C")
  const [selectedNotes, setSelectedNotes] = useState<string[]>(["C", "E", "G"])
  const [isScaleLocked, setIsScaleLocked] = useState(false)
  const [randomKey, setRandomKey] = useState("C")
  const [randomScale, setRandomScale] = useState("Major")

  // Progression Sequencer state
  const [numBars, setNumBars] = useState(8)
  const [timeSignature, setTimeSignature] = useState("4/4")
  const [bpm, setBpm] = useState(120)
  const [progression, setProgression] = useState<{ notes: string[] }[]>([])
  const [isPlayingProgression, setIsPlayingProgression] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1)

  // Circle of Fifths state
  const [circleMode, setCircleMode] = useState<"musical" | "camelot">("musical")
  const [selectedCircleKey, setSelectedCircleKey] = useState<string | null>(null)
  const [selectedCircleKeyType, setSelectedCircleKeyType] = useState<"major" | "minor">("major")

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)
  const progressionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Apply theme class to document
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev
      if (newMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newMode
    })
  }, [])

  // Handle circle key selection
  const handleCircleKeyClick = useCallback((note: string, type: "major" | "minor") => {
    const cleanNote = note.replace("m", "")
    if (selectedCircleKey === note) {
      setSelectedCircleKey(null)
    } else {
      setSelectedCircleKey(note)
      setSelectedCircleKeyType(type)
    }
  }, [selectedCircleKey])

  // Initialize dark mode on mount
  useState(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }
  })

  // Audio playback functions
  const playChord = useCallback((notes: string[]) => {
    stopSound()

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    audioContextRef.current = ctx

    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.connect(ctx.destination)
    gainNodeRef.current = gainNode

    const oscillators: OscillatorNode[] = []

    notes.forEach((note) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(calculateFrequency(note), ctx.currentTime)
      osc.connect(gainNode)
      osc.start()
      oscillators.push(osc)
    })

    oscillatorsRef.current = oscillators
    setIsPlaying(true)
  }, [])

  const stopSound = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
      } catch {}
    })
    oscillatorsRef.current = []

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }

    setIsPlaying(false)
  }, [])

  const playProgression = useCallback(() => {
    if (progression.length === 0) return

    stopSound()
    stopProgression()
    setIsPlayingProgression(true)

    const [numerator, denominator] = timeSignature.split("/").map(Number)
    const beatsPerBar = numerator * (4 / denominator)
    const barDuration = (60000 / bpm) * beatsPerBar

    let currentIndex = 0

    const playNextChord = () => {
      if (currentIndex >= progression.length) {
        setIsPlayingProgression(false)
        setCurrentPlayingIndex(-1)
        stopSound()
        return
      }

      setCurrentPlayingIndex(currentIndex)
      playChord(progression[currentIndex].notes)

      progressionTimeoutRef.current = setTimeout(() => {
        stopSound()
        currentIndex++
        playNextChord()
      }, barDuration)
    }

    playNextChord()
  }, [progression, bpm, timeSignature, playChord, stopSound])

  const stopProgression = useCallback(() => {
    if (progressionTimeoutRef.current) {
      clearTimeout(progressionTimeoutRef.current)
      progressionTimeoutRef.current = null
    }
    stopSound()
    setIsPlayingProgression(false)
    setCurrentPlayingIndex(-1)
  }, [stopSound])

  // Chord functions
  const toggleNote = useCallback((note: string) => {
    setSelectedNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    )
  }, [])

  const applyChordPreset = useCallback((presetName: string) => {
    const intervals = CHORD_PRESETS[presetName]
    const rootIdx = NOTES.indexOf(chordRoot)
    const chordNotes = intervals.map((interval) => NOTES[(rootIdx + interval) % 12])
    setSelectedNotes(chordNotes)
  }, [chordRoot])

  const randomizeChord = useCallback(() => {
    const numNotes = Math.floor(Math.random() * 3) + 2 // 2-4 notes

    if (isScaleLocked) {
      const scaleNotes = getScaleNotes(randomKey, randomScale)
      const shuffled = [...scaleNotes].sort(() => Math.random() - 0.5)
      setSelectedNotes(shuffled.slice(0, numNotes))
    } else {
      const shuffled = [...NOTES].sort(() => Math.random() - 0.5)
      setSelectedNotes(shuffled.slice(0, numNotes))
    }
  }, [isScaleLocked, randomKey, randomScale])

  const addToProgression = useCallback(() => {
    if (selectedNotes.length === 0 || progression.length >= numBars) return
    setProgression((prev) => [...prev, { notes: [...selectedNotes] }])
  }, [selectedNotes, progression.length, numBars])

  const removeFromProgression = useCallback((index: number) => {
    setProgression((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const exportMidi = useCallback(() => {
    if (progression.length === 0) return

    const midiData = generateMidiFile(progression, bpm, timeSignature)
    const blob = new Blob([midiData], { type: "audio/midi" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `chord-progression-${bpm}bpm.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [progression, bpm, timeSignature])

  // Calculations
  const semitoneDiff = getSemitoneDifference(baseKey, targetKey)
  const baseScaleNotes = getScaleNotes(baseKey, baseScale)
  const targetScaleNotes = getScaleNotes(targetKey, targetScale)

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950"
          : "bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100"
      }`}
    >
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-purple-500 to-blue-500"
                  : "bg-gradient-to-br from-rose-400 to-pink-400"
              }`}
            >
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1
              className={`text-xl md:text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Harmonic Studio
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <div
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                isDarkMode
                  ? "bg-purple-500/80 text-white"
                  : "bg-rose-400 text-white"
              }`}
            >
              Composer
            </div>
            <Link
              href="/analyze"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDarkMode
                  ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Analyzer
            </Link>
          </div>

          <button
            onClick={toggleTheme}
            className={`relative p-2.5 rounded-xl overflow-hidden transition-all duration-500 ${
              isDarkMode
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-900"
            }`}
            aria-label="Toggle theme"
          >
            <div className="relative w-5 h-5">
              <Sun 
                className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${
                  isDarkMode 
                    ? "opacity-100 rotate-0 scale-100" 
                    : "opacity-0 -rotate-90 scale-50"
                }`} 
              />
              <Moon 
                className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${
                  isDarkMode 
                    ? "opacity-0 rotate-90 scale-50" 
                    : "opacity-100 rotate-0 scale-100"
                }`} 
              />
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pitch & Scale Calculator */}
          <section
            className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Pitch & Scale Calculator
            </h2>

            {/* Original Key/Scale */}
            <div className="space-y-4 mb-6">
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Original Key
                </label>
                <select
                  value={baseKey}
                  onChange={(e) => setBaseKey(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note} className="bg-gray-900 text-white">
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Original Scale
                </label>
                <select
                  value={baseScale}
                  onChange={(e) => setBaseScale(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {Object.keys(SCALES).map((scale) => (
                    <option key={scale} value={scale} className="bg-gray-900 text-white">
                      {scale}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Key/Scale */}
            <div className="space-y-4 mb-6">
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Target Key
                </label>
                <select
                  value={targetKey}
                  onChange={(e) => setTargetKey(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note} className="bg-gray-900 text-white">
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Target Scale
                </label>
                <select
                  value={targetScale}
                  onChange={(e) => setTargetScale(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {Object.keys(SCALES).map((scale) => (
                    <option key={scale} value={scale} className="bg-gray-900 text-white">
                      {scale}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result Display */}
            <div
              className={`rounded-xl p-4 text-center mb-6 ${
                isDarkMode ? "bg-gradient-to-br from-purple-500/30 to-blue-500/30" : "bg-gradient-to-br from-rose-200/50 to-pink-200/50"
              }`}
            >
              <div
                className={`text-4xl font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {semitoneDiff > 0 ? "+" : ""}
                {semitoneDiff} semitones
              </div>
              <div
                className={`flex items-center justify-center gap-2 text-sm ${
                  isDarkMode ? "text-white/70" : "text-gray-600"
                }`}
              >
                Pitch{" "}
                {semitoneDiff > 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-green-400" /> UP
                  </>
                ) : semitoneDiff < 0 ? (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-400" /> DOWN
                  </>
                ) : (
                  "NO CHANGE"
                )}
              </div>
            </div>

            {/* Scale Notes Display */}
            <div className="space-y-4">
              <div>
                <h3
                  className={`text-sm font-medium mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  {baseKey} {baseScale} Notes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {baseScaleNotes.map((note) => (
                    <span
                      key={note}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        isDarkMode
                          ? "bg-purple-500/50 text-white"
                          : "bg-rose-300/70 text-gray-900"
                      }`}
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  className={`text-sm font-medium mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  {targetKey} {targetScale} Notes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {targetScaleNotes.map((note) => (
                    <span
                      key={note}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        isDarkMode
                          ? "bg-blue-500/50 text-white"
                          : "bg-pink-300/70 text-gray-900"
                      }`}
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Chord Generator */}
          <section
            className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Chord Generator
            </h2>

            {/* Root & Preset Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Root Note
                </label>
                <select
                  value={chordRoot}
                  onChange={(e) => setChordRoot(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note} className="bg-gray-900 text-white">
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Preset
                </label>
                <select
                  onChange={(e) => applyChordPreset(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                  defaultValue=""
                >
                  <option value="" disabled className="bg-gray-900 text-white">
                    Select preset
                  </option>
                  {Object.keys(CHORD_PRESETS).map((preset) => (
                    <option key={preset} value={preset} className="bg-gray-900 text-white">
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note Grid */}
            <div className="mb-6">
              <label
                className={`text-sm font-medium block mb-3 ${
                  isDarkMode ? "text-white/70" : "text-gray-600"
                }`}
              >
                Select Notes
              </label>
              <div className="grid grid-cols-4 gap-2">
                {NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => toggleNote(note)}
                    className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedNotes.includes(note)
                        ? isDarkMode
                          ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white scale-105 shadow-lg"
                          : "bg-gradient-to-br from-rose-400 to-pink-400 text-white scale-105 shadow-lg"
                        : isDarkMode
                        ? "bg-white/10 text-white/70 hover:bg-white/20"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Notes Display with Frequencies */}
            {selectedNotes.length > 0 && (
              <div
                className={`rounded-xl p-4 mb-6 ${
                  isDarkMode ? "bg-white/5" : "bg-gray-50"
                }`}
              >
                <h3
                  className={`text-sm font-medium mb-3 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Selected Notes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNotes.map((note) => (
                    <div
                      key={note}
                      className={`px-3 py-2 rounded-lg ${
                        isDarkMode ? "bg-purple-500/50" : "bg-rose-200"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {note}
                      </div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        {calculateFrequency(note).toFixed(1)} Hz
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Randomization */}
            <div
              className={`rounded-xl p-4 mb-6 ${
                isDarkMode ? "bg-white/5" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Randomize
                </h3>
                <button
                  onClick={() => setIsScaleLocked((prev) => !prev)}
                  className={`p-2 rounded-lg transition-colors ${
                    isScaleLocked
                      ? isDarkMode
                        ? "bg-purple-500/50 text-white"
                        : "bg-rose-300 text-gray-900"
                      : isDarkMode
                      ? "bg-white/10 text-white/50"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  title={isScaleLocked ? "Scale locked" : "Scale unlocked"}
                >
                  {isScaleLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isScaleLocked && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select
                    value={randomKey}
                    onChange={(e) => setRandomKey(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isDarkMode
                        ? "bg-white/10 text-white border-white/10"
                        : "bg-white text-gray-900 border-gray-200"
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                  >
                    {NOTES.map((note) => (
                      <option key={note} value={note} className="bg-gray-900 text-white">
                        {note}
                      </option>
                    ))}
                  </select>
                  <select
                    value={randomScale}
                    onChange={(e) => setRandomScale(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isDarkMode
                        ? "bg-white/10 text-white border-white/10"
                        : "bg-white text-gray-900 border-gray-200"
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                  >
                    {Object.keys(SCALES).map((scale) => (
                      <option key={scale} value={scale} className="bg-gray-900 text-white">
                        {scale}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={randomizeChord}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                    : "bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:opacity-90"
                }`}
              >
                <Shuffle className="w-4 h-4" />
                Random Chord
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => playChord(selectedNotes)}
                disabled={selectedNotes.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedNotes.length === 0
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-green-500/80 text-white hover:bg-green-500"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                <Play className="w-4 h-4" />
                Play
              </button>
              <button
                onClick={stopSound}
                disabled={!isPlaying}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  !isPlaying
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-red-500/80 text-white hover:bg-red-500"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
              <button
                onClick={addToProgression}
                disabled={selectedNotes.length === 0 || progression.length >= numBars}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedNotes.length === 0 || progression.length >= numBars
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-blue-500/80 text-white hover:bg-blue-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </section>

          {/* Chord Progression Sequencer */}
          <section
            className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Progression Sequencer
            </h2>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div>
                <label
                  className={`text-xs font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Bars
                </label>
                <select
                  value={numBars}
                  onChange={(e) => setNumBars(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {BAR_OPTIONS.map((bars) => (
                    <option key={bars} value={bars} className="bg-gray-900 text-white">
                      {bars}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`text-xs font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  Time Sig
                </label>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  {TIME_SIGNATURES.map((sig) => (
                    <option key={sig} value={sig} className="bg-gray-900 text-white">
                      {sig}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`text-xs font-medium block mb-2 ${
                    isDarkMode ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  BPM
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={bpm}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (val === '') {
                      setBpm(40)
                    } else {
                      const num = parseInt(val, 10)
                      setBpm(num)
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (isNaN(val) || val < 40) {
                      setBpm(40)
                    } else if (val > 240) {
                      setBpm(240)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-sm text-center font-medium ${
                    isDarkMode
                      ? "bg-white/20 text-white border-white/10"
                      : "bg-white/60 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                />
              </div>
            </div>

            {/* Progression Status */}
            <div
              className={`text-sm mb-4 ${
                isDarkMode ? "text-white/70" : "text-gray-600"
              }`}
            >
              {progression.length} / {numBars} bars
            </div>

            {/* Progression List */}
            <div
              className={`rounded-xl p-4 mb-6 max-h-64 overflow-y-auto ${
                isDarkMode ? "bg-white/5" : "bg-gray-50"
              }`}
            >
              {progression.length === 0 ? (
                <p
                  className={`text-center text-sm ${
                    isDarkMode ? "text-white/50" : "text-gray-400"
                  }`}
                >
                  No chords yet. Add chords from the generator.
                </p>
              ) : (
                <div className="space-y-3">
                  {progression.map((chord, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        currentPlayingIndex === index
                          ? isDarkMode
                            ? "bg-purple-500/30 ring-2 ring-purple-400"
                            : "bg-rose-200 ring-2 ring-rose-400"
                          : isDarkMode
                          ? "bg-white/10"
                          : "bg-white"
                      }`}
                    >
                      <span
                        className={`text-sm font-mono w-8 ${
                          isDarkMode ? "text-white/50" : "text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {chord.notes.map((note, noteIndex) => (
                          <span
                            key={noteIndex}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isDarkMode
                                ? "bg-purple-500/50 text-white"
                                : "bg-rose-300/70 text-gray-900"
                            }`}
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => removeFromProgression(index)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode
                            ? "hover:bg-red-500/30 text-white/50 hover:text-red-400"
                            : "hover:bg-red-100 text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Playback & Export Controls */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={playProgression}
                  disabled={progression.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                    progression.length === 0
                      ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-green-500/80 text-white hover:bg-green-500"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Play All
                </button>
                <button
                  onClick={stopProgression}
                  disabled={!isPlayingProgression}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                    !isPlayingProgression
                      ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-red-500/80 text-white hover:bg-red-500"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>
              <button
                onClick={exportMidi}
                disabled={progression.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  progression.length === 0
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                    : "bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:opacity-90"
                }`}
              >
                <Download className="w-4 h-4" />
                Export MIDI
              </button>
            </div>
          </section>
        </div>

        {/* Circle of Fifths */}
        <div className="max-w-7xl mx-auto mt-8">
          <div
            className={`rounded-2xl p-6 backdrop-blur-xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Circle of Fifths
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCircleMode("musical")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    circleMode === "musical"
                      ? isDarkMode
                        ? "bg-purple-500/80 text-white"
                        : "bg-rose-400 text-white"
                      : isDarkMode
                      ? "bg-white/10 text-white/70 hover:bg-white/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Musical
                </button>
                <button
                  onClick={() => setCircleMode("camelot")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    circleMode === "camelot"
                      ? isDarkMode
                        ? "bg-purple-500/80 text-white"
                        : "bg-rose-400 text-white"
                      : isDarkMode
                      ? "bg-white/10 text-white/70 hover:bg-white/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Camelot
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Circle SVG */}
              <div className="relative">
                <svg
                  viewBox="0 0 400 400"
                  className="w-[320px] h-[320px] md:w-[380px] md:h-[380px]"
                >
                  {/* Outer ring - Major keys */}
                  {CIRCLE_OF_FIFTHS_MAJOR.map((key, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180)
                    const x = Math.round((200 + 160 * Math.cos(angle)) * 100) / 100
                    const y = Math.round((200 + 160 * Math.sin(angle)) * 100) / 100
                    const isSelected = selectedCircleKey === key.note
                    const camelotLabel = key.camelot
                    const displayLabel = circleMode === "camelot" ? camelotLabel : key.note

                    return (
                      <g key={key.note} className="cursor-pointer" onClick={() => handleCircleKeyClick(key.note, "major")}>
                        <circle
                          cx={x}
                          cy={y}
                          r={28}
                          className={`transition-all duration-300 ${
                            isSelected
                              ? isDarkMode
                                ? "fill-purple-500 stroke-purple-300"
                                : "fill-rose-400 stroke-rose-200"
                              : isDarkMode
                              ? "fill-white/10 stroke-white/20 hover:fill-white/20"
                              : "fill-white stroke-gray-200 hover:fill-gray-50"
                          }`}
                          strokeWidth={2}
                        />
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={`text-sm font-semibold pointer-events-none transition-colors duration-300 ${
                            isSelected
                              ? "fill-white"
                              : isDarkMode
                              ? "fill-white/90"
                              : "fill-gray-800"
                          }`}
                        >
                          {displayLabel}
                        </text>
                      </g>
                    )
                  })}

                  {/* Inner ring - Minor keys */}
                  {CIRCLE_OF_FIFTHS_MINOR.map((key, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180)
                    const x = Math.round((200 + 100 * Math.cos(angle)) * 100) / 100
                    const y = Math.round((200 + 100 * Math.sin(angle)) * 100) / 100
                    const isSelected = selectedCircleKey === key.note
                    const camelotLabel = key.camelot
                    const displayLabel = circleMode === "camelot" ? camelotLabel : key.note

                    return (
                      <g key={key.note} className="cursor-pointer" onClick={() => handleCircleKeyClick(key.note, "minor")}>
                        <circle
                          cx={x}
                          cy={y}
                          r={24}
                          className={`transition-all duration-300 ${
                            isSelected
                              ? isDarkMode
                                ? "fill-blue-500 stroke-blue-300"
                                : "fill-pink-400 stroke-pink-200"
                              : isDarkMode
                              ? "fill-white/5 stroke-white/15 hover:fill-white/15"
                              : "fill-gray-50 stroke-gray-200 hover:fill-gray-100"
                          }`}
                          strokeWidth={2}
                        />
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={`text-xs font-medium pointer-events-none transition-colors duration-300 ${
                            isSelected
                              ? "fill-white"
                              : isDarkMode
                              ? "fill-white/70"
                              : "fill-gray-600"
                          }`}
                        >
                          {displayLabel}
                        </text>
                      </g>
                    )
                  })}

                  {/* Center label */}
                  <circle
                    cx={200}
                    cy={200}
                    r={40}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? "fill-white/5 stroke-white/10" : "fill-white stroke-gray-200"
                    }`}
                    strokeWidth={2}
                  />
                  <text
                    x={200}
                    y={195}
                    textAnchor="middle"
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isDarkMode ? "fill-white/50" : "fill-gray-500"
                    }`}
                  >
                    {circleMode === "camelot" ? "Camelot" : "Circle of"}
                  </text>
                  <text
                    x={200}
                    y={210}
                    textAnchor="middle"
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isDarkMode ? "fill-white/50" : "fill-gray-500"
                    }`}
                  >
                    {circleMode === "camelot" ? "Wheel" : "Fifths"}
                  </text>
                </svg>
              </div>

              {/* Legend and Info */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl ${
                      isDarkMode ? "bg-white/5" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          isDarkMode ? "bg-purple-500" : "bg-rose-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white/90" : "text-gray-700"
                        }`}
                      >
                        Major Keys
                      </span>
                    </div>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-white/50" : "text-gray-500"
                      }`}
                    >
                      {circleMode === "camelot"
                        ? "B notation (1B-12B) - Brighter, energetic tones"
                        : "Outer ring - Brighter, uplifting sound"}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${
                      isDarkMode ? "bg-white/5" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          isDarkMode ? "bg-blue-500" : "bg-pink-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white/90" : "text-gray-700"
                        }`}
                      >
                        Minor Keys
                      </span>
                    </div>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-white/50" : "text-gray-500"
                      }`}
                    >
                      {circleMode === "camelot"
                        ? "A notation (1A-12A) - Darker, moodier tones"
                        : "Inner ring - Darker, emotional sound"}
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-white/5" : "bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isDarkMode ? "text-white/90" : "text-gray-700"
                    }`}
                  >
                    {circleMode === "camelot" ? "Mixing Tips" : "Harmonic Relationships"}
                  </h4>
                  <ul
                    className={`space-y-2 text-xs ${
                      isDarkMode ? "text-white/60" : "text-gray-600"
                    }`}
                  >
                    {circleMode === "camelot" ? (
                      <>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Same Key:</span>
                          Mix tracks with the same Camelot code (e.g., 8A to 8A)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>+1/-1:</span>
                          Move one position clockwise or counter-clockwise (e.g., 8A to 9A)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>A/B Switch:</span>
                          Switch between same number A and B (e.g., 8A to 8B)
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Adjacent:</span>
                          Keys next to each other share 6 of 7 notes
                        </li>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Relative:</span>
                          Major/minor pairs share all 7 notes (same position)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Opposite:</span>
                          Keys across the circle create tension (tritone)
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {selectedCircleKey && (
                  <div
                    className={`p-4 rounded-xl ${
                      isDarkMode ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20" : "bg-gradient-to-r from-rose-100 to-pink-100"
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold mb-2 ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Selected: {selectedCircleKey} {selectedCircleKeyType === "major" ? "Major" : "Minor"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setBaseKey(selectedCircleKey.replace("m", "").replace("#", "#"))
                          setBaseScale(selectedCircleKeyType === "major" ? "Major" : "Minor")
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isDarkMode
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Set as Base Key
                      </button>
                      <button
                        onClick={() => {
                          setTargetKey(selectedCircleKey.replace("m", "").replace("#", "#"))
                          setTargetScale(selectedCircleKeyType === "major" ? "Major" : "Minor")
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isDarkMode
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Set as Target Key
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="max-w-7xl mx-auto mt-8">
          <div
            className={`rounded-2xl p-6 backdrop-blur-xl ${
              isDarkMode ? "bg-white/5" : "bg-white/60"
            }`}
          >
            <h3
              className={`text-sm font-semibold mb-4 ${
                isDarkMode ? "text-white/70" : "text-gray-700"
              }`}
            >
              Quick Reference
            </h3>
            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-xs ${
                isDarkMode ? "text-white/50" : "text-gray-500"
              }`}
            >
              <div>
                <strong className={isDarkMode ? "text-white/70" : "text-gray-600"}>
                  Pitch Calculator:
                </strong>{" "}
                Calculate semitone differences between keys and scales for transposing
                samples in your DAW.
              </div>
              <div>
                <strong className={isDarkMode ? "text-white/70" : "text-gray-600"}>
                  Chord Generator:
                </strong>{" "}
                Build chords using presets or manual selection. Lock to a scale for
                tonal randomization. Tuned to A=432Hz.
              </div>
              <div>
                <strong className={isDarkMode ? "text-white/70" : "text-gray-600"}>
                  Sequencer:
                </strong>{" "}
                Create progressions up to 16 bars. Export as standard MIDI for use in
                Ableton, FL Studio, Logic, and more.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
