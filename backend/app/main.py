# backend/app/main.py

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import tempfile
import logging
from datetime import datetime

from app.services.prediction_service import PredictionService
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Audio Emotion Detection API",
    description="ML-powered audio emotion analysis using multiple models",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction service
prediction_service = PredictionService()


# Pydantic models
class PredictionResponse(BaseModel):
    emotion: str
    confidence: Optional[float]
    model_used: str
    processing_time_ms: float
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    models_loaded: int
    available_models: List[str]


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# Routes
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Audio Emotion Detection API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health"
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    try:
        models = prediction_service.get_available_models()
        return HealthResponse(
            status="healthy",
            models_loaded=len(models),
            available_models=models
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unhealthy")


@app.get("/api/models", tags=["Models"])
async def get_models():
    """Get list of available models"""
    try:
        models = prediction_service.get_available_models()
        return {
            "models": models,
            "count": len(models)
        }
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_emotion(
        file: UploadFile = File(..., description="Audio file (MP3 or WAV)"),
        model_name: str = Form(..., description="Model to use for prediction"),
        chorus_start: Optional[float] = Form(None, description="Chorus start time (seconds)"),
        chorus_end: Optional[float] = Form(None, description="Chorus end time (seconds)")
):
    """
    Predict emotion from audio file

    Parameters:
    - file: Audio file (MP3 or WAV format)
    - model_name: Name of the model to use
    - chorus_start: Optional start time of chorus segment
    - chorus_end: Optional end time of chorus segment

    Returns:
    - Predicted emotion with confidence score
    """
    start_time = datetime.now()
    temp_path = None

    try:
        # Validate file type
        if not file.filename.lower().endswith(('.mp3', '.wav')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only MP3 and WAV files are supported."
            )

        # Validate model exists
        available_models = prediction_service.get_available_models()
        if model_name not in available_models:
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' not found. Available models: {', '.join(available_models)}"
            )

        # Save uploaded file to temporary location
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        logger.info(f"Processing file: {file.filename} with model: {model_name}")

        # Make prediction
        emotion, confidence, error = prediction_service.predict(
            model_name=model_name,
            file_path=temp_path,
            chorus_start=chorus_start,
            chorus_end=chorus_end
        )

        if error:
            raise HTTPException(status_code=500, detail=error)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return PredictionResponse(
            emotion=emotion,
            confidence=confidence,
            model_used=model_name,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    finally:
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {e}")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )