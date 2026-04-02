"use client"

import { useState } from "react"
import Link from "next/link"
import { Sun, Moon, Upload, Zap } from "lucide-react"

export default function AnalyzerPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<"audio" | "stems">("audio")
  const [audioUrl, setAudioUrl] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [stemResult, setStemResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

  const handleAudioAnalysis = async () => {
    setIsLoading(true)
    setError("")
    try {
      if (audioFile) {
        const formData = new FormData()
        formData.append("file", audioFile)
        const response = await fetch("/api/analyze", { method: "POST", body: formData })
        const data = await response.json()
        setAnalysisResult(data)
      } else if (audioUrl) {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: audioUrl }),
        })
        const data = await response.json()
        setAnalysisResult(data)
      }
    } catch (err) {
      setError("Failed to analyze audio")
    }
    setIsLoading(false)
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
                <h2 className="text-lg font-semibold">Audio Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Upload an audio file or paste a YouTube/SoundCloud URL to analyze BPM, key, and time signature.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Audio URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Or Upload File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    onClick={handleAudioAnalysis}
                    disabled={isLoading || (!audioUrl && !audioFile)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> Analyze
                  </button>
                </div>

                {isLoading && <p className="text-sm text-muted-foreground">Analyzing audio...</p>}

                {analysisResult && (
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <strong>BPM:</strong> {analysisResult.bpm || "N/A"}
                    </p>
                    <p>
                      <strong>Key:</strong> {analysisResult.key || "N/A"}
                    </p>
                    <p>
                      <strong>Time Signature:</strong> {analysisResult.time_signature || "N/A"}
                    </p>
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
                  Upload an audio file or paste a URL to split into Vocals, Drums, Bass, and Other stems.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Audio URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Or Upload File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    onClick={handleStemSplit}
                    disabled={isLoading || (!audioUrl && !audioFile)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> Split Stems
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
