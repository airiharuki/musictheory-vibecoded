"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, Music, Loader, AlertCircle, Check } from "lucide-react"

export default function StemsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [url, setUrl] = useState("")
  const [format, setFormat] = useState<"wav" | "mp3">("wav")
  const [shouldDownload, setShouldDownload] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<any>(null)
  const [sessionId, setSessionId] = useState("")
  const [analysis, setAnalysis] = useState<any>(null)

  const handleProcess = async () => {
    setError("")
    setIsProcessing(true)
    
    try {
      // Step 1: Download audio
      const downloadRes = await fetch("/api/download-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format })
      })

      if (!downloadRes.ok) {
        throw new Error("Failed to download audio")
      }

      const downloadData = await downloadRes.json()
      const { session_id, file_path, title } = downloadData
      setSessionId(session_id)

      // Step 2: Analyze audio
      const analyzeRes = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path })
      })

      if (analyzeRes.ok) {
        const analysisData = await analyzeRes.json()
        setAnalysis(analysisData)
      }

      // Step 3: Split stems
      const stemsRes = await fetch("/api/split-stems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path })
      })

      if (!stemsRes.ok) {
        throw new Error("Failed to split stems")
      }

      const stemsData = await stemsRes.json()
      setResults({
        title,
        stems: stemsData.stems,
        session_id
      })
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadStem = async (stem: string) => {
    try {
      const res = await fetch(`/api/download-stem?session_id=${sessionId}&stem=${stem}`)
      if (!res.ok) throw new Error("Failed to download")
      
      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${stem}.${format}`
      link.click()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCleanup = async () => {
    try {
      await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      })
      setResults(null)
      setUrl("")
      setAnalysis(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" : "bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50"}`}>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Stem Splitter
            </h1>
            <p className={`text-sm mt-2 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
              Isolate vocals, drums, bass, and more from any track
            </p>
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
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div
            className={`lg:col-span-1 rounded-2xl p-6 backdrop-blur-xl ${
              isDarkMode ? "bg-white/10" : "bg-white/80"
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Process Track
            </h2>

            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className={`text-xs font-medium block mb-2 ${isDarkMode ? "text-white/70" : "text-gray-600"}`}>
                  YouTube / SoundCloud URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a link..."
                  disabled={isProcessing}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${
                    isDarkMode
                      ? "bg-white/20 text-white placeholder-white/40 border-white/10"
                      : "bg-white/60 text-gray-900 placeholder-gray-400 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50`}
                />
              </div>

              {/* Format Toggle */}
              <div>
                <label className={`text-xs font-medium block mb-2 ${isDarkMode ? "text-white/70" : "text-gray-600"}`}>
                  Download Format
                </label>
                <div className="flex gap-2">
                  {(["wav", "mp3"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      disabled={isProcessing}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        format === fmt
                          ? isDarkMode
                            ? "bg-purple-500/80 text-white"
                            : "bg-rose-400 text-white"
                          : isDarkMode
                          ? "bg-white/10 text-white/70 hover:bg-white/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Option */}
              <label className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                isDarkMode
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-white hover:bg-gray-50"
              }`}>
                <input
                  type="checkbox"
                  checked={shouldDownload}
                  onChange={(e) => setShouldDownload(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4"
                />
                <span className={`text-sm font-medium ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>
                  Download original audio
                </span>
              </label>

              {/* Process Button */}
              <button
                onClick={handleProcess}
                disabled={!url || isProcessing}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isProcessing || !url
                    ? isDarkMode
                      ? "bg-white/10 text-white/50 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-purple-500/80 text-white hover:bg-purple-500"
                    : "bg-rose-400 text-white hover:bg-rose-500"
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
                    Split Stems
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className={`p-3 rounded-xl flex gap-2 ${
                  isDarkMode
                    ? "bg-red-500/20 text-red-300"
                    : "bg-red-100 text-red-700"
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis Results */}
            {analysis && (
              <div className={`rounded-2xl p-6 backdrop-blur-xl ${isDarkMode ? "bg-white/10" : "bg-white/80"}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Track Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className={`text-xs font-medium mb-1 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                      BPM
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {analysis.bpm}
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                      {analysis.bpm_half} / {analysis.bpm_double}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className={`text-xs font-medium mb-1 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                      Key
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {analysis.key}
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                      {analysis.camelot}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className={`text-xs font-medium mb-1 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                      Time Sig
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {analysis.time_signature}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className={`text-xs font-medium mb-1 ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                      Confidence
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {Math.round(analysis.confidence.bpm * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stems Results */}
            {results && (
              <div className={`rounded-2xl p-6 backdrop-blur-xl ${isDarkMode ? "bg-white/10" : "bg-white/80"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <Check className="w-5 h-5 inline mr-2 text-green-500" />
                    Stems Ready
                  </h3>
                  <button
                    onClick={handleCleanup}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDarkMode
                        ? "bg-white/10 text-white/70 hover:bg-white/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(results.stems).map(([stem, path]) => (
                    <button
                      key={stem}
                      onClick={() => handleDownloadStem(stem)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                        isDarkMode
                          ? "bg-white/5 hover:bg-white/10 border border-white/10"
                          : "bg-white hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div>
                        <div className={`font-semibold capitalize ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {stem}
                        </div>
                        <div className={`text-xs ${isDarkMode ? "text-white/50" : "text-gray-500"}`}>
                          Click to download
                        </div>
                      </div>
                      <Download className={`w-4 h-4 ${isDarkMode ? "text-white/60" : "text-gray-400"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!results && (
              <div className={`rounded-2xl p-12 backdrop-blur-xl text-center ${isDarkMode ? "bg-white/5" : "bg-white/40"}`}>
                <Music className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-white/30" : "text-gray-300"}`} />
                <p className={`text-sm ${isDarkMode ? "text-white/50" : "text-gray-500"}`}>
                  Paste a URL and hit Split Stems to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
