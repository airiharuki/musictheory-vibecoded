"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, Music, Loader, AlertCircle, Check, Sun, Moon } from "lucide-react"

export default function StemsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [url, setUrl] = useState("")
  const [format, setFormat] = useState<"wav" | "mp3">("wav")
  const [shouldDownload, setShouldDownload] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [analysis, setAnalysis] = useState<any>(null)

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

  const handleProcess = async () => {
    setError("")
    setIsProcessing(true)
    
    if (!url.trim()) {
      setError("Please enter a YouTube or SoundCloud URL")
      setIsProcessing(false)
      return
    }

    try {
      // Call backend analyze endpoint
      const response = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: url.trim(),
          download: shouldDownload,
          format: shouldDownload ? format : "wav"
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to analyze audio")
      }

      const data = await response.json()
      setAnalysis(data)
      setError("")
    } catch (err: any) {
      setError(err.message || "An error occurred while processing the audio")
      console.error("[v0] Error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async (stem: "full") => {
    try {
      if (analysis?.download_available) {
        // In production, implement actual stem downloads
        setError("Download feature coming soon. For now, you can use the analysis results.")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
          : "bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl transition-colors duration-500 ${
          isDarkMode ? "bg-white/5 border-white/10" : "bg-white/40 border-white/20"
        } border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className={`w-6 h-6 ${isDarkMode ? "text-purple-400" : "text-rose-500"}`} />
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
            <div
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                isDarkMode
                  ? "bg-purple-500/80 text-white"
                  : "bg-rose-400 text-white"
              }`}
            >
              Stems
            </div>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div
          className={`rounded-2xl p-8 backdrop-blur-xl ${
            isDarkMode ? "bg-white/10" : "bg-white/80"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Audio Analyzer & Stem Splitter
          </h2>
          <p
            className={`text-sm mb-6 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}
          >
            Paste a YouTube or SoundCloud link to analyze BPM, key, and time signature
          </p>

          {/* Input Section */}
          <div className="space-y-4 mb-6">
            <div>
              <label
                className={`text-sm font-medium block mb-2 ${
                  isDarkMode ? "text-white/80" : "text-gray-700"
                }`}
              >
                Audio URL
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium ${
                  isDarkMode
                    ? "bg-white/20 text-white border-white/10 placeholder-white/40"
                    : "bg-white/60 text-gray-900 border-gray-200 placeholder-gray-400"
                } border focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`text-sm font-medium block mb-2 ${
                    isDarkMode ? "text-white/80" : "text-gray-700"
                  }`}
                >
                  Download Format
                </label>
                <div className="flex gap-2">
                  {["wav", "mp3"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt as "wav" | "mp3")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        format === fmt
                          ? isDarkMode
                            ? "bg-purple-500/80 text-white"
                            : "bg-rose-400 text-white"
                          : isDarkMode
                          ? "bg-white/10 text-white/70 hover:bg-white/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={shouldDownload}
                    onChange={(e) => setShouldDownload(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-white/80" : "text-gray-700"
                    }`}
                  >
                    Download original audio
                  </span>
                </label>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={isProcessing || !url.trim()}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isProcessing || !url.trim()
                  ? isDarkMode
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-purple-500/80 text-white hover:bg-purple-500 active:scale-95"
                  : "bg-rose-400 text-white hover:bg-rose-500 active:scale-95"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  Analyze Audio
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                isDarkMode ? "bg-red-500/20" : "bg-red-100"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? "text-red-400" : "text-red-600"
                }`}
              />
              <p className={isDarkMode ? "text-red-200" : "text-red-700"}>{error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Analysis Results
              </h3>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-white/5" : "bg-white/40"
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-2 ${
                      isDarkMode ? "text-white/60" : "text-gray-600"
                    }`}
                  >
                    BPM
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {analysis.bpm}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-white/40" : "text-gray-500"
                    }`}
                  >
                    {analysis.bpm_half} / {analysis.bpm_double}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-white/5" : "bg-white/40"
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-2 ${
                      isDarkMode ? "text-white/60" : "text-gray-600"
                    }`}
                  >
                    Key
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {analysis.key}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-white/5" : "bg-white/40"
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-2 ${
                      isDarkMode ? "text-white/60" : "text-gray-600"
                    }`}
                  >
                    Camelot
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {analysis.camelot}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-white/5" : "bg-white/40"
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-2 ${
                      isDarkMode ? "text-white/60" : "text-gray-600"
                    }`}
                  >
                    Time Sig
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {analysis.time_signature}
                  </p>
                </div>
              </div>

              {/* Confidence Meters */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      BPM Confidence
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      {analysis.bpm_confidence}%
                    </p>
                  </div>
                  <div
                    className={`h-2 rounded-full ${
                      isDarkMode ? "bg-white/10" : "bg-white/40"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${analysis.bpm_confidence}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      Key Confidence
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      {analysis.key_confidence}%
                    </p>
                  </div>
                  <div
                    className={`h-2 rounded-full ${
                      isDarkMode ? "bg-white/10" : "bg-white/40"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                      style={{ width: `${analysis.key_confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {analysis.download_available && (
                  <button
                    onClick={() => handleDownload("full")}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? "bg-purple-500/80 text-white hover:bg-purple-500"
                        : "bg-rose-400 text-white hover:bg-rose-500"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download Audio
                  </button>
                )}
                <button
                  onClick={() => {
                    setAnalysis(null)
                    setUrl("")
                    setError("")
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isDarkMode
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Clear Results
                </button>
              </div>

              {/* Info Box */}
              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-blue-100/40 border-blue-200"
                }`}
              >
                <p
                  className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
                >
                  <strong>Note:</strong> Stem splitting is coming soon! Use these analysis results to manually create stems in your DAW or combine with other tools.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
