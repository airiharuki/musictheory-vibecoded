"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Sun, Moon, Play, Square, Plus, Trash2, Shuffle, Lock, Unlock, Download } from "lucide-react"

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const SCALES: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
  "Pentatonic Major": [0, 2, 4, 7, 9],
  "Pentatonic Minor": [0, 3, 5, 7, 10],
  Blues: [0, 3, 5, 6, 7, 10],
  "Whole Tone": [0, 2, 4, 6, 8, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

const CHORD_PRESETS: Record<string, number[]> = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Diminished: [0, 3, 6],
  Augmented: [0, 4, 8],
  Sus2: [0, 2, 7],
  Sus4: [0, 5, 7],
  "Major 7": [0, 4, 7, 11],
  "Minor 7": [0, 3, 7, 10],
  "Dominant 7": [0, 4, 7, 10],
  "Major 6": [0, 4, 7, 9],
  "Minor 6": [0, 3, 7, 9],
  "Diminished 7": [0, 3, 6, 9],
}

const TIME_SIGNATURES = ["3/4", "4/4", "5/4", "6/8", "7/8"]
const BAR_OPTIONS = [4, 8, 16]
const A4_FREQ = 432

const freqToNote = (freq: number, baseFreq: number = A4_FREQ): string => {
  const semitones = 12 * Math.log2(freq / baseFreq) + 57
  const noteIndex = Math.round(semitones) % 12
  return NOTES[noteIndex < 0 ? noteIndex + 12 : noteIndex]
}

const getNoteFrequency = (noteIndex: number, octave: number = 4): number => {
  const semitone = noteIndex - 9 + (octave - 4) * 12
  return A4_FREQ * Math.pow(2, semitone / 12)
}

export default function ComposerPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Pitch Calculator
  const [origKey, setOrigKey] = useState("C")
  const [origScale, setOrigScale] = useState("Major")
  const [targetKey, setTargetKey] = useState("G")
  const [targetScale, setTargetScale] = useState("Major")
  
  // Chord Generator
  const [chordRoot, setChordRoot] = useState("C")
  const [chordPreset, setChordPreset] = useState("Major")
  const [manualNotes, setManualNotes] = useState<number[]>([0, 4, 7])
  const [scaleLocked, setScaleLocked] = useState(false)
  
  // Progression Sequencer
  const [bars, setBars] = useState(8)
  const [timeSignature, setTimeSignature] = useState("4/4")
  const [bpm, setBpm] = useState(120)
  const [progression, setProgression] = useState<string[]>([])
  const [isPlayingSequence, setIsPlayingSequence] = useState(false)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])

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

  const calculateSemitones = () => {
    const origKeyIdx = NOTES.indexOf(origKey)
    const targetKeyIdx = NOTES.indexOf(targetKey)
    return (targetKeyIdx - origKeyIdx + 12) % 12
  }

  const getScaleNotes = (key: string, scale: string) => {
    const keyIdx = NOTES.indexOf(key)
    const scaleIntervals = SCALES[scale] || SCALES.Major
    return scaleIntervals.map((interval) => NOTES[(keyIdx + interval) % 12])
  }

  const playChord = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    const rootIdx = NOTES.indexOf(chordRoot)
    const frequencies = manualNotes.map((offset) => getNoteFrequency((rootIdx + offset) % 12, 4))

    oscillatorsRef.current.forEach((osc) => osc.stop())
    oscillatorsRef.current = []

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = "sine"
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1)
      oscillatorsRef.current.push(osc)
    })
  }

  const stopChord = () => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
      } catch {}
    })
    oscillatorsRef.current = []
  }

  const addChordToProgression = () => {
    if (progression.length < bars) {
      setProgression([...progression, chordRoot])
    }
  }

  const randomizeChord = () => {
    if (scaleLocked) {
      const scaleNotes = getScaleNotes(chordRoot, origScale)
      const randomNotes = CHORD_PRESETS[Object.keys(CHORD_PRESETS)[Math.floor(Math.random() * Object.keys(CHORD_PRESETS).length)]]
      setManualNotes(randomNotes.filter((n) => scaleNotes.includes(NOTES[(NOTES.indexOf(chordRoot) + n) % 12])))
    } else {
      const randomPreset = Object.keys(CHORD_PRESETS)[Math.floor(Math.random() * Object.keys(CHORD_PRESETS).length)]
      setChordPreset(randomPreset)
      setManualNotes(CHORD_PRESETS[randomPreset])
    }
  }

  const exportMidi = () => {
    if (progression.length === 0) return
    
    const noteEvents: number[] = []
    progression.forEach((noteStr) => {
      const noteIdx = NOTES.indexOf(noteStr)
      noteEvents.push(60 + noteIdx)
    })

    const midiData = buildMidiFile(noteEvents, bpm, timeSignature)
    const blob = new Blob([midiData], { type: "audio/midi" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "progression.mid"
    a.click()
  }

  const buildMidiFile = (notes: number[], tempo: number, timeSig: string): Uint8Array => {
    const [beats, noteValue] = timeSig.split("/").map(Number)
    const ticksPerBeat = 480
    const barsPerNote = 4

    let midiData: number[] = [
      0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, 0x01, 0xe0, 0x4d, 0x54, 0x72, 0x6b,
    ]

    const trackDataStart = midiData.length + 4
    let trackData: number[] = [
      0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, 0x00, 0xff, 0x58, 0x04, beats, Math.log2(noteValue), 0x18, 0x08,
    ]

    notes.forEach((note, idx) => {
      trackData.push(0x00, 0x90, note, 0x64)
      const duration = Math.floor((ticksPerBeat * beats) / 4)
      trackData.push(0x00, 0x80, note, 0x40)
    })

    trackData.push(0x00, 0xff, 0x2f, 0x00)
    const trackLength = trackData.length
    midiData.push(
      (trackLength >> 24) & 0xff,
      (trackLength >> 16) & 0xff,
      (trackLength >> 8) & 0xff,
      trackLength & 0xff,
      ...trackData
    )

    return new Uint8Array(midiData)
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Harmonic Studio</h1>
            <div className="flex items-center gap-4">
              <Link href="/analyze" className="text-sm font-medium hover:text-primary transition-colors">
                Analyzer
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pitch & Scale Calculator */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pitch & Scale</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Original Key</label>
                <select
                  value={origKey}
                  onChange={(e) => setOrigKey(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Original Scale</label>
                <select
                  value={origScale}
                  onChange={(e) => setOrigScale(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {Object.keys(SCALES).map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Key</label>
                <select
                  value={targetKey}
                  onChange={(e) => setTargetKey(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Scale</label>
                <select
                  value={targetScale}
                  onChange={(e) => setTargetScale(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {Object.keys(SCALES).map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-semibold">Semitones: +{calculateSemitones()}</p>
                <p className="text-xs text-muted-foreground">
                  {getScaleNotes(origKey, origScale).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* Chord Generator */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Chord Generator</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Root Note</label>
                <select
                  value={chordRoot}
                  onChange={(e) => setChordRoot(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Preset</label>
                <select
                  value={chordPreset}
                  onChange={(e) => {
                    setChordPreset(e.target.value)
                    setManualNotes(CHORD_PRESETS[e.target.value])
                  }}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {Object.keys(CHORD_PRESETS).map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={playChord}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" /> Play
                </button>
                <button
                  onClick={stopChord}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={randomizeChord}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
                >
                  <Shuffle className="w-4 h-4" /> Random
                </button>
                <button
                  onClick={() => setScaleLocked(!scaleLocked)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scaleLocked
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {scaleLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  Lock
                </button>
              </div>
              <button
                onClick={addChordToProgression}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add to Sequence
              </button>
            </div>
          </div>

          {/* Progression Sequencer */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Sequencer</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Bars</label>
                <select
                  value={bars}
                  onChange={(e) => setBars(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {BAR_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b} bars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Time Signature</label>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {TIME_SIGNATURES.map((ts) => (
                    <option key={ts} value={ts}>
                      {ts}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value))))}
                  min="40"
                  max="240"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2 items-start content-start">
                {progression.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Add chords to build progression</p>
                ) : (
                  progression.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => setProgression(progression.filter((_, i) => i !== idx))}
                      className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-80 transition-opacity"
                    >
                      {note} ✕
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => setProgression([])}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/20 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
              <button
                onClick={exportMidi}
                disabled={progression.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export MIDI
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
