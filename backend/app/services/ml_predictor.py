import os
import joblib
import pandas as pd
from typing import Dict, Any, Optional

class MLPredictor:
    """
    ML Prediction Service using serialized scikit-learn Random Forest model.
    Falls back gracefully if model artifact is not loaded.
    """
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Check primary artifact path
            paths_to_check = [
                os.path.join(os.path.dirname(__file__), "ml_artifacts", "fault_classifier.joblib"),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "artifacts", "fault_classifier.joblib")
            ]
            for p in paths_to_check:
                if os.path.exists(p):
                    try:
                        cls._model = joblib.load(p)
                        break
                    except Exception as e:
                        print(f"Warning: Failed to load model artifact at {p}: {e}")
        return cls._model

    @classmethod
    def predict(cls, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference on telemetry features.
        Returns prediction, calibrated score/confidence, and all class probabilities.
        """
        model = cls.get_model()
        if model is None:
            return {
                "available": False,
                "prediction": "Prediction model not available",
                "model_score": 0.0,
                "confidence_level": "insufficient_evidence",
                "probabilities": {}
            }

        input_data = pd.DataFrame([{
            "cpu_usage_pct": float(metrics.get("cpu_usage_pct", 0.0)),
            "ram_usage_pct": float(metrics.get("ram_usage_pct", 0.0)),
            "available_memory_mb": float(metrics.get("available_memory_mb", 8192.0)),
            "disk_usage_pct": float(metrics.get("disk_usage_pct", 0.0)),
            "free_disk_gb": float(metrics.get("free_disk_gb", 50.0)),
            "network_status": metrics.get("network_status", "connected"),
            "failed_connectivity_checks": int(metrics.get("failed_connectivity_checks", 0)),
            "log_error_count": int(metrics.get("log_error_count", 0)),
        }])

        try:
            pred_class = model.predict(input_data)[0]
            pred_proba = model.predict_proba(input_data)[0]
            classes = model.classes_
            prob_dict = {str(c): round(float(p), 4) for c, p in zip(classes, pred_proba)}
            max_score = float(max(pred_proba))

            # Calibrated confidence level
            if max_score > 0.85:
                confidence_level = "high"
            elif max_score > 0.60:
                confidence_level = "moderate"
            else:
                confidence_level = "low"

            return {
                "available": True,
                "prediction": str(pred_class),
                "model_score": round(max_score, 4),
                "confidence_level": confidence_level,
                "probabilities": prob_dict,
                "model_version": "RandomForest-v1.0"
            }
        except Exception as e:
            return {
                "available": False,
                "prediction": "Inference Error",
                "model_score": 0.0,
                "confidence_level": "insufficient_evidence",
                "error": str(e),
                "probabilities": {}
            }
