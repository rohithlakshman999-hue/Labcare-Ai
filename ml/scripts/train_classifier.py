import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

def train_fault_classifier():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "lab_fault_dataset.csv")
    if not os.path.exists(data_path):
        from generate_data import generate_telemetry_dataset
        df = generate_telemetry_dataset(num_samples=2100)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    numeric_features = [
        "cpu_usage_pct",
        "ram_usage_pct",
        "available_memory_mb",
        "disk_usage_pct",
        "free_disk_gb",
        "failed_connectivity_checks",
        "log_error_count"
    ]
    categorical_features = ["network_status"]
    
    X = df[numeric_features + categorical_features]
    y = df["fault_label"]

    # Stratified Train/Test Split (80% train, 20% test) to prevent data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )

    model_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])

    print("Training Random Forest Classifier on telemetry data...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Validation Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred))

    # Save artifact
    artifact_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
    os.makedirs(artifact_dir, exist_ok=True)
    model_file = os.path.join(artifact_dir, "fault_classifier.joblib")
    joblib.dump(model_pipeline, model_file)
    print(f"Model successfully saved to {model_file}")

    # Also save to backend services directory for live inference
    backend_artifact_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "backend", "app", "services", "ml_artifacts"
    )
    os.makedirs(backend_artifact_dir, exist_ok=True)
    backend_model_file = os.path.join(backend_artifact_dir, "fault_classifier.joblib")
    joblib.dump(model_pipeline, backend_model_file)
    print(f"Copied model artifact to backend service: {backend_model_file}")

if __name__ == "__main__":
    train_fault_classifier()
