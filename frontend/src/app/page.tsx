// frontend/src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Upload, Music, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PredictionResult {
  emotion: string;
  confidence: number | null;
  model_used: string;
  processing_time_ms: number;
  timestamp: string;
}

interface Model {
  name: string;
  displayName: string;
}

export default function Home() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [chorusStart, setChorusStart] = useState<string>('');
  const [chorusEnd, setChorusEnd] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
    fetchModels();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      setApiStatus('online');
    } catch (err) {
      setApiStatus('offline');
      setError('Cannot connect to API server. Please ensure the backend is running.');
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/models`);
      setModels(response.data.models);
      if (response.data.models.length > 0) {
        setSelectedModel(response.data.models[0]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
        setAudioFile(file);
        setError('');
      } else {
        setError('Please upload a valid MP3 or WAV file');
        setAudioFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model_name', selectedModel);

    if (chorusStart) {
      formData.append('chorus_start', chorusStart);
    }
    if (chorusEnd) {
      formData.append('chorus_end', chorusEnd);
    }

    try {
      const response = await axios.post<PredictionResult>(
        `${API_URL}/api/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Prediction failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'text-yellow-400',
      sad: 'text-blue-400',
      angry: 'text-red-400',
      neutral: 'text-gray-400',
      fear: 'text-purple-400',
      disgust: 'text-green-400',
      surprise: 'text-pink-400',
    };
    return colors[emotion.toLowerCase()] || 'text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-purple-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">
              Audio Emotion Detector
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            AI-powered emotion analysis from audio files
          </p>

          {/* API Status Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-400 animate-pulse' : 
              apiStatus === 'offline' ? 'bg-red-400' : 
              'bg-yellow-400 animate-pulse'
            }`} />
            <span className="text-sm text-gray-300">
              API: {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Form Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-2xl p-8 border border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  disabled={models.length === 0}
                >
                  {models.length === 0 ? (
                    <option>Loading models...</option>
                  ) : (
                    models.map((model) => (
                      <option key={model} value={model}>
                        {model.replace(/_/g, ' ')}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Audio File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".mp3,.wav"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-8 bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition group"
                  >
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2 group-hover:text-purple-400 transition" />
                      <p className="text-gray-300">
                        {audioFile ? audioFile.name : 'Click to upload MP3 or WAV file'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Maximum file size: 50MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Chorus Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chorus Start (seconds) - Optional
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={chorusStart}
                    onChange={(e) => setChorusStart(e.target.value)}
                    placeholder="e.g., 45.5"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chorus End (seconds) - Optional
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={chorusEnd}
                    onChange={(e) => setChorusEnd(e.target.value)}
                    placeholder="e.g., 75.5"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !audioFile || apiStatus === 'offline'}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Audio...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    Detect Emotion
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Analysis Complete</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Detected Emotion</p>
                    <p className={`text-4xl font-bold ${getEmotionColor(result.emotion)}`}>
                      {result.emotion.toUpperCase()}
                    </p>
                  </div>

                  {result.confidence !== null && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Confidence Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                    <div>
                      <p className="text-sm text-gray-400">Model Used</p>
                      <p className="text-white font-medium">{result.model_used.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Processing Time</p>
                      <p className="text-white font-medium">{result.processing_time_ms.toFixed(0)}ms</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-slate-800/30 backdrop-blur rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Upload an MP3 or WAV audio file of your choice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Optionally specify chorus timing for more accurate results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Our AI models analyze audio features using openSMILE</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Get instant emotion detection with confidence scores</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}