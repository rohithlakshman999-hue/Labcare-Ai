# Model Evaluation Report — LabCare AI

- **Overall Accuracy**: 99.52%
- **Evaluated Samples**: 420 (held-out test split, stratified)

### Per-Class Performance

| Fault Category | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| Excessive CPU Usage | 1.000 | 1.000 | 1.000 | 60 |
| Healthy | 1.000 | 1.000 | 1.000 | 60 |
| High Memory Utilization | 1.000 | 1.000 | 1.000 | 60 |
| Low Disk Space | 1.000 | 1.000 | 1.000 | 60 |
| Network Connectivity Failure | 1.000 | 1.000 | 1.000 | 60 |
| Service Failure | 0.968 | 1.000 | 0.984 | 60 |
| Software / Application Errors | 1.000 | 0.967 | 0.983 | 60 |

### Confusion Matrix

Labels order: ['Excessive CPU Usage', 'Healthy', 'High Memory Utilization', 'Low Disk Space', 'Network Connectivity Failure', 'Service Failure', 'Software / Application Errors']

```json
[
  [
    60,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    60,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    60,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    60,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    0,
    60,
    0,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    60,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    2,
    58
  ]
]
```
