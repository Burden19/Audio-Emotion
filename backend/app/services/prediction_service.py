import os
import sys
import numpy as np
import joblib
from tensorflow.keras.models import load_model
import opensmile
from pydub import AudioSegment
from typing import Tuple, Optional, List
import logging

logger = logging.getLogger(__name__)


class PredictionService:
    """Service for handling emotion predictions from audio files"""

    def __init__(self):
        self.BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.SAVE_DIR = os.path.join(self.BASE_DIR, "saved_models")

        # Verify directory exists
        if not os.path.exists(self.SAVE_DIR):
            raise RuntimeError(f"Model directory not found at {self.SAVE_DIR}")

        logger.info(f"Model directory: {self.SAVE_DIR}")

        # Load label encoder and scaler
        self.label_encoder = self._load_label_encoder()
        self.nn_scaler = self._load_nn_scaler()

        # Cache for loaded models
        self._model_cache = {}

    def _load_label_encoder(self):
        """Load the label encoder"""
        try:
            path = os.path.join(self.SAVE_DIR, "label_encoder.joblib")
            le = joblib.load(path)
            logger.info("LabelEncoder loaded successfully")
            return le
        except Exception as e:
            logger.error(f"Error loading LabelEncoder: {e}")
            raise

    def _load_nn_scaler(self):
        """Load the neural network scaler"""
        try:
            path = os.path.join(self.SAVE_DIR, "nn_scaler.joblib")
            scaler = joblib.load(path)
            logger.info("Neural Network scaler loaded successfully")
            return scaler
        except Exception as e:
            logger.warning(f"Could not load NN scaler: {e}")
            return None

    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        models = []

        try:
            for filename in os.listdir(self.SAVE_DIR):
                # Skip support files
                if filename in ['label_encoder.joblib', 'nn_scaler.joblib']:
                    continue

                # Handle .joblib files
                if filename.endswith('.joblib'):
                    model_name = filename.replace('.joblib', '')
                    model_name = model_name.replace(' ', '_')
                    models.append(model_name)

                # Handle Neural Network .keras file
                elif filename == 'Neural_Network.keras':
                    models.append('Neural_Network')

            logger.info(f"Available models: {models}")
            return sorted(models)

        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []

    def _load_model(self, model_name: str):
        """Load a specific model (with caching)"""
        # Check cache first
        if model_name in self._model_cache:
            return self._model_cache[model_name]

        try:
            if model_name == "Neural_Network":
                model_path = os.path.join(self.SAVE_DIR, "Neural_Network.keras")
                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"Neural Network model not found at {model_path}")
                model = load_model(model_path)
            else:
                # Try with underscore first
                model_path = os.path.join(self.SAVE_DIR, f"{model_name}.joblib")

                # Fallback: try with spaces (for legacy files)
                if not os.path.exists(model_path):
                    model_name_with_spaces = model_name.replace('_', ' ')
                    model_path = os.path.join(self.SAVE_DIR, f"{model_name_with_spaces}.joblib")

                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"Model file not found: {model_path}")

                model = joblib.load(model_path)

            # Cache the model
            self._model_cache[model_name] = model
            logger.info(f"Model '{model_name}' loaded successfully")
            return model

        except Exception as e:
            logger.error(f"Error loading model {model_name}: {e}")
            raise

    def _extract_chorus_segment(
            self,
            audio_path: str,
            start_sec: Optional[float] = None,
            end_sec: Optional[float] = None,
            segment_duration: int = 30
    ) -> str:
        """Extract chorus segment from audio file"""
        try:
            song = AudioSegment.from_file(audio_path)

            if start_sec is not None and end_sec is not None:
                chorus = song[start_sec * 1000:end_sec * 1000]
                if len(chorus) < 1000:
                    logger.warning("Chorus segment too short, using middle segment")
                    total_duration = len(song) / 1000
                    mid_start = max(0, total_duration / 2 - segment_duration / 2)
                    mid_end = mid_start + segment_duration
                    chorus = song[mid_start * 1000:mid_end * 1000]
            else:
                # Use middle segment
                total_duration = len(song) / 1000
                mid_start = max(0, total_duration / 2 - segment_duration / 2)
                mid_end = mid_start + segment_duration
                chorus = song[mid_start * 1000:mid_end * 1000]

            # Save temporary file
            output_path = f"temp_chorus_{os.getpid()}.wav"
            chorus.export(output_path, format="wav")
            return output_path

        except Exception as e:
            logger.error(f"Error extracting chorus: {e}")
            raise

    def _extract_features(self, file_path: str) -> np.ndarray:
        """Extract features using openSMILE"""
        try:
            smile = opensmile.Smile(
                feature_set=opensmile.FeatureSet.ComParE_2016,
                feature_level=opensmile.FeatureLevel.Functionals
            )

            features = smile.process_file(file_path)
            all_features = features.values.flatten()
            feature_names = features.columns.tolist()

            # Target features (from your original code)
            target_features = [
                'audspec_lengthL1norm_sma_meanSegLen', 'audspec_lengthL1norm_sma_stddev',
                'audspec_lengthL1norm_sma_skewness', 'audspec_lengthL1norm_sma_kurtosis',
                'audspec_lengthL1norm_sma_maxSegLen', 'audspecRasta_lengthL1norm_sma_meanSegLen',
                'audspecRasta_lengthL1norm_sma_stddev', 'audspecRasta_lengthL1norm_sma_skewness',
                'audspecRasta_lengthL1norm_sma_kurtosis', 'audspecRasta_lengthL1norm_sma_maxSegLen',
                'pcm_RMSenergy_sma_meanSegLen', 'pcm_RMSenergy_sma_stddev',
                'pcm_RMSenergy_sma_skewness', 'pcm_RMSenergy_sma_kurtosis',
                'pcm_RMSenergy_sma_maxSegLen', 'pcm_zcr_sma_meanSegLen',
                'pcm_zcr_sma_stddev', 'pcm_zcr_sma_skewness',
                'pcm_zcr_sma_kurtosis', 'pcm_zcr_sma_maxSegLen',
                'audspec_lengthL1norm_sma_de_meanSegLen', 'audspec_lengthL1norm_sma_de_stddev',
                'audspec_lengthL1norm_sma_de_skewness', 'audspec_lengthL1norm_sma_de_kurtosis',
                'audspec_lengthL1norm_sma_de_maxSegLen', 'audspecRasta_lengthL1norm_sma_de_meanSegLen',
                'audspecRasta_lengthL1norm_sma_de_stddev', 'audspecRasta_lengthL1norm_sma_de_skewness',
                'audspecRasta_lengthL1norm_sma_de_kurtosis', 'audspecRasta_lengthL1norm_sma_de_maxSegLen',
                'audSpec_Rfilt_sma[0]_meanSegLen', 'audSpec_Rfilt_sma[0]_stddev',
                'audSpec_Rfilt_sma[1]_meanSegLen', 'audSpec_Rfilt_sma[1]_stddev',
                'audSpec_Rfilt_sma[2]_meanSegLen', 'pcm_RMSenergy_sma_risetime',
                'pcm_zcr_sma_risetime', 'audspec_lengthL1norm_sma_risetime',
                'audspecRasta_lengthL1norm_sma_risetime'
            ]

            extracted_features = []
            for feature in target_features:
                matching_features = [f for f in feature_names if feature in f]
                if matching_features:
                    idx = feature_names.index(matching_features[0])
                    extracted_features.append(all_features[idx])
                else:
                    logger.warning(f"Feature '{feature}' not found")
                    extracted_features.append(0.0)

            return np.array(extracted_features).reshape(1, -1)

        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            raise

    def predict(
            self,
            model_name: str,
            file_path: str,
            chorus_start: Optional[float] = None,
            chorus_end: Optional[float] = None
    ) -> Tuple[Optional[str], Optional[float], Optional[str]]:
        """
        Make emotion prediction

        Returns:
            Tuple of (emotion, confidence, error_message)
        """
        segment_file = None

        try:
            # Load model
            model = self._load_model(model_name)

            # Extract chorus segment
            segment_file = self._extract_chorus_segment(file_path, chorus_start, chorus_end)

            # Extract features
            X = self._extract_features(segment_file)
            logger.info(f"Input features shape: {X.shape}")

            # Make prediction
            if model_name == "Neural_Network":
                if self.nn_scaler is None:
                    return None, None, "No scaler found for Neural Network"

                X_scaled = self.nn_scaler.transform(X)
                pred_probs = model.predict(X_scaled, verbose=0)
                pred_idx = np.argmax(pred_probs, axis=1)
                confidence = float(pred_probs[0][pred_idx[0]])
            else:
                pred_idx = model.predict(X)
                if hasattr(model, 'predict_proba'):
                    probas = model.predict_proba(X)
                    confidence = float(probas[0][pred_idx[0]])
                else:
                    confidence = None

            emotion = self.label_encoder.inverse_transform(pred_idx)[0]
            logger.info(f"Predicted emotion: {emotion} with confidence: {confidence}")

            return emotion, confidence, None

        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            return None, None, str(e)

        finally:
            # Cleanup temporary file
            if segment_file and os.path.exists(segment_file):
                try:
                    os.remove(segment_file)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file: {e}")
