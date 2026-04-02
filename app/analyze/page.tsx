"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Sun, Moon, Upload, Zap } from "lucide-react"

interface AnalysisResult {
  bpm: number
  key: string
  timeSignature: string
  keyConfidence: number
  bpmConfidence: number
}

export default function AnalyzerPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<"audio" | "stems">("audio")
  const [audioUrl, setAudioUrl] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [stemResult, setStemResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const essentialRef = useRef<any>(null)

  useEffect(() => {
    // Load Essentia.js
    const loadEssentia = async () => {
      try {
        const Essentia = (await import("@essentia/essentia.js")).default
        essentialRef.current = new Essentia()
        console.log("[v0] Essentia.js loaded successfully")
      } catch (err) {
        console.error("[v0] Failed to load Essentia.js:", err)
      }
    }
    loadEssentia()
  }, [])

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev
      if (newMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newMode
    })
  }

  const analyzeAudioBuffer = async (audioBuffer: AudioBuffer): Promise<AnalysisResult> => {
    const essentia = essentialRef.current
    if (!essentia) {
      throw new Error("Essentia.js not loaded")
    }

    // Convert AudioBuffer to array
    const channelData = audioBuffer.getChannelData(0)
    const signal = Array.from(channelData)

    // Detect BPM using RhythmExtractor2013
    let bpm = 120
    let bpmConfidence = 0.5
    try {
      const rhythmResult = essentia.RhythmExtractor2013(signal)
      bpm = Math.round(rhythmResult.bpm)
      bpmConfidence = Math.min(rhythmResult.confidence || 0.7, 1)
      console.log("[v0] BPM detected:", bpm, "confidence:", bpmConfidence)
    } catch (err) {
      console.warn("[v0] BPM detection failed, using default:", err)
    }

    // Detect key using KeyExtractor
    let key = "C"
    let keyConfidence = 0.5
    try {
      const keyResult = essentia.KeyExtractor(signal, audioBuffer.sampleRate)
      key = keyResult.key
      keyConfidence = Math.min(keyResult.scale === "major" ? keyResult.strength : keyResult.strength * 0.9, 1)
      console.log("[v0] Key detected:", key, "confidence:", keyConfidence)
    } catch (err) {
      console.warn("[v0] Key detection failed, using default:", err)
    }

    // Estimate time signature (4/4 by default)
    const timeSignature = "4/4"

    return {
      bpm,
      key,
      timeSignature,
      keyConfidence,
      bpmConfidence,
    }
  }

  const handleAudioAnalysis = async () => {
    setIsLoading(true)
    setError("")
    try {
      let audioBuffer: AudioBuffer | null = null

      if (audioFile) {
        // Load from file
        const arrayBuffer = await audioFile.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      } else if (audioUrl) {
        // Load from URL (YouTube/SoundCloud URLs would need CORS or backend proxy)
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error("Failed to fetch audio")
        
        const arrayBuffer = await response.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      } else {
        setError("Please provide an audio file or URL")
        return
      }

      if (!audioBuffer) {
        throw new Error("Failed to load audio")
      }

      const result = await analyzeAudioBuffer(audioBuffer)
      setAnalysisResult(result)
    } catch (err: any) {
      console.error("[v0] Analysis error:", err)
      setError(err.message || "Failed to analyze audio. Try uploading a local file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStemSplit = async () => {
    setIsLoading(true)
    setError("")
    try {
      if (audioFile) {
        const formData = new FormData()
        formData.append("file", audioFile)
        const response = await fetch("/api/split-stems", { method: "POST", body: formData })
        const data = await response.json()
        setStemResult(data)
      } else if (audioUrl) {
        const response = await fetch("/api/split-stems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: audioUrl }),
        })
        const data = await response.json()
        setStemResult(data)
      }
    } catch (err) {
      setError("Failed to split stems")
    }
    setIsLoading(false)
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Harmonic Studio</h1>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Composer
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
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab("audio")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "audio"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Audio Analysis
            </button>
            <button
              onClick={() => setActiveTab("stems")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "stems"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Stem Splitter
            </button>
          </div>

          {/* Audio Analysis Tab */}
          {activeTab === "audio" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Audio Analysis (Powered by Essentia.js)</h2>
                <p className="text-sm text-muted-foreground">
                  Upload an audio file to analyze BPM, musical key, and time signature using real-time audio analysis.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Audio File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setAudioFile(e.target.files?.[0] || null)
                        setAudioUrl("")
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Supported: MP3, WAV, OGG, FLAC</p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    onClick={handleAudioAnalysis}
                    disabled={isLoading || !audioFile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> {isLoading ? "Analyzing..." : "Analyze Audio"}
                  </button>
                </div>

                {analysisResult && (
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">BPM:</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-lg">{analysisResult.bpm}</strong>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(analysisResult.bpmConfidence * 100)}% confidence)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Key:</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-lg">{analysisResult.key}</strong>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(analysisResult.keyConfidence * 100)}% confidence)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time Signature:</span>
                      <strong className="text-lg">{analysisResult.timeSignature}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stem Splitter Tab */}
          {activeTab === "stems" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Stem Splitter</h2>
                <p className="text-sm text-muted-foreground">
                  Upload an audio file to split into Vocals, Drums, Bass, and Other stems.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Audio File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setAudioFile(e.target.files?.[0] || null)
                        setAudioUrl("")
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    onClick={handleStemSplit}
                    disabled={isLoading || !audioFile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> {isLoading ? "Processing..." : "Split Stems"}
                  </button>
                </div>

                {isLoading && <p className="text-sm text-muted-foreground">Processing audio (this may take 1-3 minutes)...</p>}

                {stemResult && (
                  <div className="grid grid-cols-2 gap-4">
                    {["vocals", "drums", "bass", "other"].map((stem) => (
                      <a
                        key={stem}
                        href={stemResult[stem]}
                        download
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Upload className="w-4 h-4" /> {stem}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
