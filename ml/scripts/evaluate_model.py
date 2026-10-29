import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def evaluate():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "lab_fault_dataset.csv")
    model_path = os.path.join(os.path.dirname(__file__), "..", "artifacts", "fault_classifier.joblib")
    
    if not os.path.exists(model_path):
        from train_classifier import train_fault_classifier
        train_fault_classifier()
        
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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    model = joblib.load(model_path)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    report_dict = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_).tolist()
    acc = accuracy_score(y_test, y_pred)

    results = {
        "model_name": "LabCare Telemetry Fault Random Forest",
        "accuracy": acc,
        "classes": list(model.classes_),
        "classification_report": report_dict,
        "confusion_matrix": cm,
        "test_sample_count": len(y_test)
    }

    artifact_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
    metrics_path = os.path.join(artifact_dir, "evaluation_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    report_md_path = os.path.join(artifact_dir, "evaluation_report.md")
    with open(report_md_path, "w") as f:
        f.write("# Model Evaluation Report — LabCare AI\n\n")
        f.write(f"- **Overall Accuracy**: {acc * 100:.2f}%\n")
        f.write(f"- **Evaluated Samples**: {len(y_test)} (held-out test split, stratified)\n\n")
        f.write("### Per-Class Performance\n\n")
        f.write("| Fault Category | Precision | Recall | F1-Score | Support |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for cls in model.classes_:
            if cls in report_dict:
                row = report_dict[cls]
                f.write(f"| {cls} | {row['precision']:.3f} | {row['recall']:.3f} | {row['f1-score']:.3f} | {int(row['support'])} |\n")
        f.write("\n### Confusion Matrix\n\n")
        f.write(f"Labels order: {list(model.classes_)}\n\n")
        f.write("```json\n" + json.dumps(cm, indent=2) + "\n```\n")

    print(f"Markdown report written to {report_md_path}")

if __name__ == "__main__":
    evaluate()
