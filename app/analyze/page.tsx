"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Sun,
  Moon,
  Music,
  Youtube,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  Gauge,
  Key,
  FileMusic,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"

// Simulated analysis results based on YouTube video characteristics
// In production, this would connect to a backend service using audio analysis libraries
interface AnalysisResult {
  key: string
  scale: string
  camelot: string
  bpm: number
  bpmConfidence: number
  timeSignature: string
  timeSignatureConfidence: number
  keyConfidence: number
  genre: string
  energy: number
  danceability: number
}

interface VideoInfo {
  title: string
  channel: string
  duration: string
  thumbnail: string
}

// Camelot wheel mapping
const CAMELOT_MAP: Record<string, string> = {
  "C Major": "8B",
  "G Major": "9B",
  "D Major": "10B",
  "A Major": "11B",
  "E Major": "12B",
  "B Major": "1B",
  "F# Major": "2B",
  "C# Major": "3B",
  "G# Major": "4B",
  "D# Major": "5B",
  "A# Major": "6B",
  "F Major": "7B",
  "A Minor": "8A",
  "E Minor": "9A",
  "B Minor": "10A",
  "F# Minor": "11A",
  "C# Minor": "12A",
  "G# Minor": "1A",
  "D# Minor": "2A",
  "A# Minor": "3A",
  "F Minor": "4A",
  "C Minor": "5A",
  "G Minor": "6A",
  "D Minor": "7A",
}

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const SCALES = ["Major", "Minor"]
const TIME_SIGS = ["3/4", "4/4", "5/4", "6/8", "7/8"]

// Simulated analysis function - in production this would call a backend API
function simulateAnalysis(videoId: string): Promise<{ analysis: AnalysisResult; video: VideoInfo }> {
  return new Promise((resolve) => {
    // Use video ID hash to generate consistent "random" results
    const hash = videoId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const keyIndex = hash % 12
    const scaleIndex = hash % 2
    const key = KEYS[keyIndex]
    const scale = SCALES[scaleIndex]
    const camelotKey = `${key} ${scale}`

    const baseBpm = 80 + (hash % 100)
    const bpm = Math.round(baseBpm)

    setTimeout(() => {
      resolve({
        analysis: {
          key,
          scale,
          camelot: CAMELOT_MAP[camelotKey] || "8B",
          bpm,
          bpmConfidence: 75 + (hash % 20),
          timeSignature: TIME_SIGS[(hash % 5)],
          timeSignatureConfidence: 80 + (hash % 15),
          keyConfidence: 70 + (hash % 25),
          genre: ["Electronic", "Pop", "Rock", "Hip-Hop", "Classical", "Jazz"][hash % 6],
          energy: 40 + (hash % 50),
          danceability: 30 + (hash % 60),
        },
        video: {
          title: "Loading video info...",
          channel: "Unknown Artist",
          duration: `${Math.floor((hash % 300) / 60)}:${String((hash % 300) % 60).padStart(2, "0")}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        },
      })
    }, 2000 + (hash % 1500))
  })
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function AnalyzePage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ analysis: AnalysisResult; video: VideoInfo } | null>(null)
  const [copied, setCopied] = useState(false)

  // Initialize theme from document class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
    if (!document.documentElement.classList.contains("dark") && !document.documentElement.classList.contains("light")) {
      document.documentElement.classList.add("dark")
    }
  }, [])

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

  const handleAnalyze = async () => {
    setError(null)
    setResult(null)

    const videoId = extractVideoId(url.trim())
    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID")
      return
    }

    setIsAnalyzing(true)
    try {
      const analysisResult = await simulateAnalysis(videoId)
      setResult(analysisResult)
    } catch {
      setError("Failed to analyze the video. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ConfidenceMeter = ({ value, label }: { value: number; label: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>{label}</span>
        <span className={isDarkMode ? "text-white/80" : "text-gray-700"}>{value}%</span>
      </div>
      <div
        className={`h-1.5 rounded-full overflow-hidden ${
          isDarkMode ? "bg-white/10" : "bg-gray-200"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            value > 85
              ? "bg-green-500"
              : value > 70
              ? isDarkMode
                ? "bg-purple-500"
                : "bg-rose-400"
              : "bg-amber-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950"
          : "bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
          isDarkMode
            ? "bg-black/20 border-white/10"
            : "bg-white/60 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-rose-400 to-pink-400"
              }`}
            >
              <Music className="w-5 h-5 text-white" />
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
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDarkMode
                  ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Composer
            </Link>
            <div
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                isDarkMode
                  ? "bg-purple-500/80 text-white"
                  : "bg-rose-400 text-white"
              }`}
            >
              Analyzer
            </div>
            <Link
              href="/stems"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDarkMode
                  ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Stems
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
      <main className="px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Input Section */}
          <div
            className={`rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-2.5 rounded-xl ${
                  isDarkMode ? "bg-red-500/20" : "bg-red-100"
                }`}
              >
                <Youtube
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-red-400" : "text-red-500"
                  }`}
                />
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  YouTube Audio Analyzer
                </h2>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-white/60" : "text-gray-500"
                  }`}
                >
                  Detect key, BPM, and time signature from any YouTube video
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && handleAnalyze()}
                  placeholder="Paste YouTube URL or video ID..."
                  className={`w-full px-4 py-3 pl-11 rounded-xl text-sm transition-colors ${
                    isDarkMode
                      ? "bg-white/10 text-white placeholder-white/40 border-white/10"
                      : "bg-white text-gray-900 placeholder-gray-400 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                />
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? "text-white/40" : "text-gray-400"
                  }`}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url.trim()}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isAnalyzing || !url.trim()
                    ? isDarkMode
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    : "bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:from-rose-500 hover:to-pink-500"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileMusic className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                  isDarkMode ? "bg-red-500/20" : "bg-red-50"
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    isDarkMode ? "text-red-400" : "text-red-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  {error}
                </span>
              </div>
            )}

            {/* Demo Notice */}
            <div
              className={`mt-4 p-4 rounded-xl ${
                isDarkMode ? "bg-amber-500/10" : "bg-amber-50"
              }`}
            >
              <p
                className={`text-xs ${
                  isDarkMode ? "text-amber-300/80" : "text-amber-700"
                }`}
              >
                <strong>Demo Mode:</strong> This analyzer uses simulated results for demonstration.
                For production use, integrate with audio analysis APIs like Essentia.js, ACRCloud, or a custom backend with librosa.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div
              className={`rounded-2xl p-8 backdrop-blur-xl shadow-2xl ${
                isDarkMode ? "bg-white/10" : "bg-white/80"
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full border-4 border-t-transparent animate-spin ${
                      isDarkMode ? "border-purple-500" : "border-rose-400"
                    }`}
                  />
                  <Music
                    className={`absolute inset-0 m-auto w-6 h-6 ${
                      isDarkMode ? "text-purple-400" : "text-rose-400"
                    }`}
                  />
                </div>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-white/60" : "text-gray-500"
                  }`}
                >
                  Analyzing audio properties...
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isAnalyzing && (
            <div className="space-y-6">
              {/* Video Preview */}
              <div
                className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                  isDarkMode ? "bg-white/10" : "bg-white/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={result.video.thumbnail}
                      alt="Video thumbnail"
                      className="w-full sm:w-48 h-auto rounded-xl object-cover"
                      crossOrigin="anonymous"
                    />
                    <div
                      className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                        isDarkMode ? "bg-black/70 text-white" : "bg-black/80 text-white"
                      }`}
                    >
                      {result.video.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold truncate ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.video.title}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkMode ? "text-white/60" : "text-gray-500"
                      }`}
                    >
                      {result.video.channel}
                    </p>
                    <a
                      href={`https://youtube.com/watch?v=${extractVideoId(url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 mt-3 text-sm ${
                        isDarkMode
                          ? "text-purple-400 hover:text-purple-300"
                          : "text-rose-500 hover:text-rose-600"
                      }`}
                    >
                      Open on YouTube
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Main Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Key */}
                <div
                  className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                    isDarkMode ? "bg-white/10" : "bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Key
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-purple-400" : "text-rose-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      Key
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.analysis.key}
                    </span>
                    <span
                      className={`text-lg ${
                        isDarkMode ? "text-white/60" : "text-gray-500"
                      }`}
                    >
                      {result.analysis.scale}
                    </span>
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${
                      isDarkMode
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    Camelot: {result.analysis.camelot}
                  </div>
                  <div className="mt-4">
                    <ConfidenceMeter value={result.analysis.keyConfidence} label="Confidence" />
                  </div>
                </div>

                {/* BPM */}
                <div
                  className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                    isDarkMode ? "bg-white/10" : "bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Gauge
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-blue-400" : "text-pink-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      BPM
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.analysis.bpm}
                    </span>
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-white/40" : "text-gray-400"
                      }`}
                    >
                      beats/min
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-sm ${
                      isDarkMode ? "text-white/50" : "text-gray-500"
                    }`}
                  >
                    Half: {Math.round(result.analysis.bpm / 2)} | Double: {result.analysis.bpm * 2}
                  </div>
                  <div className="mt-4">
                    <ConfidenceMeter value={result.analysis.bpmConfidence} label="Confidence" />
                  </div>
                </div>

                {/* Time Signature */}
                <div
                  className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                    isDarkMode ? "bg-white/10" : "bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-green-400" : "text-emerald-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      Time Signature
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {result.analysis.timeSignature}
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-sm ${
                      isDarkMode ? "text-white/50" : "text-gray-500"
                    }`}
                  >
                    Genre: {result.analysis.genre}
                  </div>
                  <div className="mt-4">
                    <ConfidenceMeter
                      value={result.analysis.timeSignatureConfidence}
                      label="Confidence"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div
                className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                  isDarkMode ? "bg-white/10" : "bg-white/80"
                }`}
              >
                <h3
                  className={`text-sm font-semibold mb-4 ${
                    isDarkMode ? "text-white/70" : "text-gray-700"
                  }`}
                >
                  Audio Characteristics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        Energy
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {result.analysis.energy}%
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-white/10" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          isDarkMode
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-rose-400 to-pink-400"
                        }`}
                        style={{ width: `${result.analysis.energy}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        Danceability
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {result.analysis.danceability}%
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-white/10" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          isDarkMode
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                            : "bg-gradient-to-r from-pink-400 to-purple-400"
                        }`}
                        style={{ width: `${result.analysis.danceability}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy Results */}
              <div
                className={`rounded-2xl p-6 backdrop-blur-xl shadow-2xl ${
                  isDarkMode ? "bg-white/10" : "bg-white/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white/70" : "text-gray-700"
                      }`}
                    >
                      Quick Copy
                    </h3>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-white/50" : "text-gray-500"
                      }`}
                    >
                      {result.analysis.key} {result.analysis.scale} | {result.analysis.bpm} BPM | {result.analysis.timeSignature} | {result.analysis.camelot}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Key: ${result.analysis.key} ${result.analysis.scale} (${result.analysis.camelot}) | BPM: ${result.analysis.bpm} | Time: ${result.analysis.timeSignature}`
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      copied
                        ? isDarkMode
                          ? "bg-green-500/20 text-green-400"
                          : "bg-green-100 text-green-600"
                        : isDarkMode
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
