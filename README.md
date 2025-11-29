# Audio Emotion Detection System

A professional-grade audio emotion detection system using machine learning models and modern web technologies.

## 🏗️ Architecture

- **Backend**: FastAPI (Python 3.10)
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **ML Models**: 9 pre-trained models (KNN, Logistic Regression, MLP, Neural Network, Random Forest, SVM, XGBoost)
- **Feature Extraction**: openSMILE (ComParE_2016)
- **Deployment**: Docker + Docker Compose

---

## 📋 Prerequisites

### For Windows Users:

1. **Python 3.10+**
   - Download from [python.org](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"

2. **Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Includes npm automatically

3. **FFmpeg** (Required for audio processing)
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Add to system PATH:
     - Extract FFmpeg to `C:\ffmpeg`
     - Add `C:\ffmpeg\bin` to Environment Variables PATH
   - Verify: Open Command Prompt and run `ffmpeg -version`

4. **Docker Desktop** (For containerized deployment)
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Enable WSL 2 backend during installation

5. **Git** (Optional but recommended)
   - Download from [git-scm.com](https://git-scm.com/downloads)

---

## 📁 Project Structure

```
audio-emotion-detection/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py              # Configuration settings
│   │   └── services/
│   │       ├── __init__.py
│   │       └── prediction_service.py  # ML prediction logic
│   ├── saved_models/                  
│   │   ├── KNN.joblib
│   │   ├── KNN_tuned.joblib
│   │   ├── Logistic_Regression.joblib
│   │   ├── MLP_best.joblib
│   │   ├── Neural_Network.h5
│   │   ├── Random_Forest.joblib      
│   │   ├── SVM.joblib
│   │   ├── XGBoost.joblib
│   │   ├── label_encoder.joblib
│   │   └── nn_scaler.joblib
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx               # Main page component
│   │       ├── layout.tsx
│   │       └── globals.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── Dockerfile
│   └── .env.local
├── docker-compose.yml
└── README.md
```

---

## 🚀 Local Setup (Without Docker)

### Step 1: Prepare Model Files

1. Create the project structure
2. **IMPORTANT**: Rename `Random Forest.joblib` to `Random_Forest.joblib` (replace space with underscore)
3. Place all model files in `backend/saved_models/`:
   - KNN.joblib
   - KNN_tuned.joblib
   - Logistic_Regression.joblib
   - MLP_best.joblib (rename from "MLP best.joblib")
   - Neural_Network.h5
   - Random_Forest.joblib (**renamed**)
   - SVM.joblib
   - XGBoost.joblib
   - label_encoder.joblib
   - nn_scaler.joblib

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows Command Prompt:
venv\Scripts\activate.bat
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Git Bash / WSL:
source venv/Scripts/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional)
echo DEBUG=True > .env
echo HOST=0.0.0.0 >> .env
echo PORT=8000 >> .env

# Run the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/api/docs`

### Step 3: Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

# Run the development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---


## 🧪 Testing the Application

### 1. Check Backend Health

Open browser or use curl:
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": 9,
  "available_models": ["KNN", "KNN_tuned", "Logistic_Regression", ...]
}
```

### 2. Test via Frontend

1. Open `http://localhost:3000`
2. Select a model from dropdown
3. Upload an MP3 or WAV file
4. (Optional) Enter chorus start/end times
5. Click "Detect Emotion"

### 3. Test via API Documentation

1. Navigate to `http://localhost:8000/api/docs`
2. Try the `/api/predict` endpoint with Swagger UI
3. Upload a test audio file

---

## 📝 Additional Configuration Files

### Frontend: next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
```

### Frontend: tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Frontend: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Frontend: src/app/layout.tsx

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Audio Emotion Detector',
  description: 'AI-powered emotion analysis from audio files',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Frontend: src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 15, 23, 42;
  --background-end-rgb: 15, 23, 42;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

### Backend: app/__init__.py

```python
# Empty file to make app a package
```

### Backend: app/core/__init__.py

```python
# Empty file
```

### Backend: app/services/__init__.py

```python
# Empty file
```

---

## 🔧 Troubleshooting

### Common Issues on Windows:

1. **"FFmpeg not found"**
   - Ensure FFmpeg is installed and in PATH
   - Restart terminal after adding to PATH
   - Test with: `ffmpeg -version`

2. **"Module not found" errors**
   - Verify virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt`

3. **Port already in use**
   - Backend: Change port in `.env` or command line
   - Frontend: Next.js will offer port 3001 automatically

4. **openSMILE installation fails**
   - Install Visual C++ Build Tools from Microsoft
   - Or use pre-built wheel: `pip install opensmile --no-build-isolation`

5. **Docker issues**
   - Ensure Docker Desktop is running
   - Check WSL 2 integration is enabled
   - Restart Docker Desktop

6. **CORS errors**
   - Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
   - Verify backend CORS settings in `config.py`

---

## 🎯 API Endpoints

### GET `/api/health`
Check API health and loaded models

### GET `/api/models`
List all available models

### POST `/api/predict`
Predict emotion from audio
- **Parameters**:
  - `file`: Audio file (MP3/WAV)
  - `model_name`: Model to use
  - `chorus_start`: Optional start time (seconds)
  - `chorus_end`: Optional end time (seconds)

---

## 📊 Model Information

The system supports 9 different models:

1. **KNN** - K-Nearest Neighbors
2. **KNN_tuned** - Optimized KNN
3. **Logistic_Regression** - Linear classifier
4. **MLP_best** - Multi-Layer Perceptron
5. **Neural_Network** - Deep learning model (requires scaler)
6. **Random_Forest** - Ensemble method
7. **SVM** - Support Vector Machine
8. **XGBoost** - Gradient boosting

Each model may have different accuracy and speed characteristics.

---

## 🚢 Production Deployment

For production deployment:

1. Set `DEBUG=False` in backend `.env`
2. Use proper CORS origins in `config.py`
3. Add authentication/authorization
4. Use production-grade database for logging
5. Set up proper monitoring and logging
6. Use reverse proxy (nginx) for backend
7. Enable HTTPS with SSL certificates

---
## 👥 Contributors

Ahmed M'barek .
## 📧 Support

For issues or questions, please open an issue on GitHub or 
contact me on my email Ahmedmbarek61@gmail.com .


---

**Built with ❤️ using FastAPI, Next.js, and Machine Learning**
