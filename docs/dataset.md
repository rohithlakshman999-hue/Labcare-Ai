# LabCare AI — Telemetry Dataset & ML Model Pipeline

## 1. Overview
The machine learning pipeline predicts fault categories on computer lab workstations using multi-variate telemetry features.

### Supported Fault Categories
1. **Healthy**: Normal lab operations (CPU < 65%, RAM < 75%, Disk < 78%, 0 failed pings, 0 log errors).
2. **Excessive CPU Usage**: Sustained processor saturation (CPU 85-100%, compiler or runaway process).
3. **High Memory Utilization**: Memory exhaustion or unbounded memory leaks (RAM 88-99.5%, available RAM < 500 MB).
4. **Low Disk Space**: Volume storage depletion (Disk usage > 90%, free space < 5 GB).
5. **Network Connectivity Failure**: Repeated packet drops or link disconnection (failed pings >= 3, network degraded/disconnected).
6. **Software / Application Errors**: Elevated event log crash and exception frequency (error count >= 4).
7. **Service Failure**: Stopped system daemons or background lab services.

## 2. Dataset Generation (`ml/scripts/generate_data.py`)
- Generates 2,100 balanced, realistic samples with Gaussian-distributed symptoms.
- Features: `cpu_usage_pct`, `ram_usage_pct`, `available_memory_mb`, `disk_usage_pct`, `free_disk_gb`, `failed_connectivity_checks`, `log_error_count`, `network_status`.
- Shuffled and persisted to `ml/data/lab_fault_dataset.csv`.

## 3. Preprocessing & Model Architecture
- **Numeric Pipeline**: `StandardScaler` applied to continuous telemetry dimensions.
- **Categorical Pipeline**: `OneHotEncoder(handle_unknown='ignore')` applied to discrete network status.
- **Classifier**: `RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced', random_state=42)`.
- **Stratified Held-Out Split**: 80% train (1,680 samples), 20% test (420 samples). Zero test-data leakage.

## 4. Evaluation Results
- **Overall Accuracy**: **99.52%**
- **Macro F1-Score**: **0.995**

| Fault Category | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| **Excessive CPU Usage** | 1.000 | 1.000 | 1.000 | 60 |
| **Healthy** | 1.000 | 1.000 | 1.000 | 60 |
| **High Memory Utilization** | 1.000 | 1.000 | 1.000 | 60 |
| **Low Disk Space** | 1.000 | 1.000 | 1.000 | 60 |
| **Network Connectivity Failure** | 1.000 | 1.000 | 1.000 | 60 |
| **Service Failure** | 0.968 | 1.000 | 0.984 | 60 |
| **Software / Application Errors** | 1.000 | 0.967 | 0.983 | 60 |

## 5. Loghub Integration Reference
As documented in the project prompt, **Loghub** ([https://github.com/logpai/loghub](https://github.com/logpai/loghub)) provides a collection of system log datasets (Windows, Linux, HDFS, Spark, BGL).
- Loghub datasets can be used for text-log classification experiments.
- Real-world log datasets must not be assumed to have ground-truth fault labels without manual inspection or log template extraction (e.g. Drain / Spell).
- In LabCare AI, log error frequency is parsed into structured telemetry features, with unparsed raw text maintained as untrusted audit data.
