"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, Music, Loader2, AlertCircle, CheckCircle2, Zap, Sparkles } from "lucide-react"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface PredictionResult {
  emotion: string
  confidence: number | null
  model_used: string
  processing_time_ms: number
  timestamp: string
}

interface Model {
  name: string
  displayName: string
}

export default function Home() {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [chorusStart, setChorusStart] = useState<string>("")
  const [chorusEnd, setChorusEnd] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string>("")
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    checkApiHealth()
    fetchModels()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`)
      setApiStatus("online")
    } catch (err) {
      setApiStatus("offline")
      setError("Cannot connect to API server. Please ensure the backend is running.")
    }
  }

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/models`)
      setModels(response.data.models)
      if (response.data.models.length > 0) {
        setSelectedModel(response.data.models[0])
      }
    } catch (err) {
      console.error("Failed to fetch models:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.toLowerCase().endsWith(".mp3") || file.name.toLowerCase().endsWith(".wav")) {
        setAudioFile(file)
        setError("")
      } else {
        setError("Please upload a valid MP3 or WAV file")
        setAudioFile(null)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.toLowerCase().endsWith(".mp3") || file.name.toLowerCase().endsWith(".wav")) {
        setAudioFile(file)
        setError("")
      } else {
        setError("Please upload a valid MP3 or WAV file")
        setAudioFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setError("Please select an audio file")
      return
    }

    if (!selectedModel) {
      setError("Please select a model")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("model_name", selectedModel)

    if (chorusStart) {
      formData.append("chorus_start", chorusStart)
    }
    if (chorusEnd) {
      formData.append("chorus_end", chorusEnd)
    }

    try {
      const response = await axios.post<PredictionResult>(`${API_URL}/api/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setResult(response.data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Prediction failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: "text-yellow-400",
      sad: "text-blue-400",
      angry: "text-red-400",
      neutral: "text-gray-400",
      fear: "text-purple-400",
      disgust: "text-green-400",
      surprise: "text-pink-400",
    }
    return colors[emotion.toLowerCase()] || "text-white"
  }

  const getEmotionGradient = (emotion: string) => {
    const gradients: { [key: string]: string } = {
      happy: "from-yellow-500/20 to-orange-500/20",
      sad: "from-blue-500/20 to-cyan-500/20",
      angry: "from-red-500/20 to-pink-500/20",
      neutral: "from-gray-500/20 to-slate-500/20",
      fear: "from-purple-500/20 to-indigo-500/20",
      disgust: "from-green-500/20 to-emerald-500/20",
      surprise: "from-pink-500/20 to-rose-500/20",
    }
    return gradients[emotion.toLowerCase()] || "from-purple-500/20 to-pink-500/20"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-pink-600/5 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6 animate-in fade-in slide-in-from-top duration-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse transition-all duration-300 group-hover:opacity-100" />
              <div className="relative bg-slate-950 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                <Music className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 group-hover:scale-125 transition-transform duration-300" />
              </div>
            </div>
            <h1 className="text-6xl font-black text-white ml-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white group-hover:via-pink-200 transition-all duration-500">
              Audio Emotion
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-purple-300 mb-4 animate-in fade-in slide-in-from-top duration-1000 delay-100">
            Detector
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-in fade-in duration-1000 delay-200">
            Intelligent AI-powered emotion analysis from your audio files using advanced machine learning
          </p>

          <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-slate-800/80 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 animate-in fade-in duration-1000 delay-300 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 cursor-default">
            <div
              className={`w-3 h-3 rounded-full ${
                apiStatus === "online"
                  ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"
                  : apiStatus === "offline"
                    ? "bg-red-400 shadow-lg shadow-red-400/50"
                    : "bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50"
              }`}
            />
            <span className="text-sm font-medium text-gray-200">
              API:{" "}
              <span
                className={
                  apiStatus === "online"
                    ? "text-emerald-400"
                    : apiStatus === "offline"
                      ? "text-red-400"
                      : "text-yellow-400"
                }
              >
                {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Disconnected" : "Checking..."}
              </span>
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Form Card */}
          <div className="animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 card-hover">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Model Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    <label className="block text-sm font-semibold text-gray-200">Select AI Model</label>
                  </div>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 hover:bg-slate-700/70 placeholder-gray-500 font-medium hover:shadow-lg hover:shadow-purple-500/10"
                    disabled={models.length === 0}
                  >
                    {models.length === 0 ? (
                      <option>Loading models...</option>
                    ) : (
                      models.map((model) => (
                        <option key={model} value={model}>
                          {model.replace(/_/g, " ")}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* File Upload - Enhanced with drag and drop */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <label className="block text-sm font-semibold text-gray-200">Upload Audio File</label>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".mp3,.wav"
                      onChange={handleFileChange}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center w-full px-6 py-12 bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-2 transition-all duration-300 rounded-2xl cursor-pointer group ${
                        isDragging
                          ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                          : audioFile
                            ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/10"
                            : "border-dashed border-slate-600/50 hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10"
                      }`}
                    >
                      <div className="text-center">
                        <Upload
                          className={`w-14 h-14 mx-auto mb-3 transition-all duration-300 ${
                            isDragging
                              ? "text-purple-400 scale-110"
                              : audioFile
                                ? "text-emerald-400 scale-100"
                                : "text-gray-500 group-hover:text-purple-400 group-hover:scale-110"
                          }`}
                        />
                        <p className="text-gray-200 font-semibold text-lg">
                          {audioFile ? audioFile.name : "Drag & drop or click to upload"}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">MP3 or WAV • Maximum 50MB</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Chorus Time Inputs */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <label className="block text-sm font-semibold text-gray-200">Optional Chorus Timing</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={chorusStart}
                        onChange={(e) => setChorusStart(e.target.value)}
                        placeholder="Start time (seconds)"
                        className="w-full px-5 py-3.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 hover:bg-slate-700/70 placeholder-gray-500 hover:shadow-lg hover:shadow-purple-500/10"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={chorusEnd}
                        onChange={(e) => setChorusEnd(e.target.value)}
                        placeholder="End time (seconds)"
                        className="w-full px-5 py-3.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 hover:bg-slate-700/70 placeholder-gray-500 hover:shadow-lg hover:shadow-purple-500/10"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !audioFile || apiStatus === "offline"}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 disabled:shadow-none transform hover:scale-105 disabled:hover:scale-100 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Analyzing Audio...</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-6 h-6" />
                      <span>Detect Emotion</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Message */}
              {error && (
                <div className="mt-8 p-5 bg-red-500/15 border border-red-500/50 rounded-xl flex items-start gap-4 animate-in slide-in-from-top duration-300 hover:bg-red-500/20 transition-all">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Result Display */}
              {result && (
                <div
                  className={`mt-10 p-8 rounded-2xl border transition-all duration-500 animate-in fade-in scale-in duration-500 bg-gradient-to-br ${getEmotionGradient(result.emotion)} border-slate-600/50 hover:border-purple-500/30 shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-pulse" />
                    <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Detected Emotion
                      </p>
                      <p
                        className={`text-5xl font-black tracking-tight ${getEmotionColor(result.emotion)} drop-shadow-lg`}
                      >
                        {result.emotion.toUpperCase()}
                      </p>
                    </div>

                    {result.confidence !== null && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                          Confidence Score
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-slate-600/30 rounded-full h-4 overflow-hidden border border-slate-500/30">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-700 rounded-full shadow-lg shadow-purple-500/50"
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-bold text-lg min-w-fit">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-600/30">
                      <div className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Model</p>
                        <p className="text-white font-semibold">{result.model_used.replace(/_/g, " ")}</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Processing Time
                        </p>
                        <p className="text-white font-semibold">{result.processing_time_ms.toFixed(0)}ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* How It Works */}
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">How It Works</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Upload an MP3 or WAV audio file",
                    "Choose your preferred AI model",
                    "Optionally specify chorus timing",
                    "Get instant emotion detection results",
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 group hover:translate-x-1 transition-transform">
                      <div className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-purple-500/50 transition-all">
                        {idx + 1}
                      </div>
                      <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-all">
                    <Zap className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Key Features</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Advanced openSMILE audio analysis",
                    "Multiple ML models for accuracy",
                    "Confidence scoring system",
                    "Real-time processing & results",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 group hover:translate-x-1 transition-transform">
                      <div className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0 mt-2 group-hover:scale-150 transition-transform" />
                      <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
