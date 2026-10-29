import os
import random
import numpy as np
import pandas as pd

def generate_telemetry_dataset(num_samples: int = 1500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic lab computer telemetry dataset with realistic symptom patterns
    and labeled fault categories for college computer labs.
    
    Fault Categories:
    - Healthy
    - Excessive CPU Usage
    - High Memory Utilization
    - Low Disk Space
    - Network Connectivity Failure
    - Software / Application Errors
    - Service Failure
    """
    np.random.seed(random_seed)
    random.seed(random_seed)
    
    categories = [
        "Healthy",
        "Excessive CPU Usage",
        "High Memory Utilization",
        "Low Disk Space",
        "Network Connectivity Failure",
        "Software / Application Errors",
        "Service Failure"
    ]
    
    records = []
    
    # Generate balanced realistic distribution
    samples_per_cat = num_samples // len(categories)
    
    for cat in categories:
        for i in range(samples_per_cat):
            lab_id = random.choice(["LAB-A", "LAB-B", "LAB-C"])
            pc_num = random.randint(1, 20)
            device_id = f"{lab_id}-{pc_num:02d}"
            
            if cat == "Healthy":
                cpu = float(np.clip(np.random.normal(25, 12), 3, 65))
                ram = float(np.clip(np.random.normal(45, 12), 15, 75))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(55, 12), 15, 78))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = int(np.random.choice([0, 1], p=[0.95, 0.05]))
                log_errors = int(np.random.choice([0, 1], p=[0.90, 0.10]))
                net_status = "connected" if failed_pings == 0 else "degraded"
                
            elif cat == "Excessive CPU Usage":
                cpu = float(np.clip(np.random.normal(92, 5), 82, 100))
                ram = float(np.clip(np.random.normal(55, 15), 20, 80))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(50, 15), 20, 80))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = 0
                log_errors = int(np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1]))
                net_status = "connected"
                
            elif cat == "High Memory Utilization":
                cpu = float(np.clip(np.random.normal(40, 15), 10, 75))
                ram = float(np.clip(np.random.normal(93, 4), 86, 99.5))
                total_ram_mb = 16384
                avail_ram = float(np.clip(np.random.normal(450, 150), 50, 950))
                disk = float(np.clip(np.random.normal(55, 15), 20, 80))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = 0
                log_errors = int(np.random.choice([0, 1, 2], p=[0.6, 0.3, 0.1]))
                net_status = "connected"
                
            elif cat == "Low Disk Space":
                cpu = float(np.clip(np.random.normal(30, 12), 5, 65))
                ram = float(np.clip(np.random.normal(50, 12), 20, 75))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(94, 3), 89, 99.8))
                free_disk_gb = float(np.clip(np.random.normal(3.5, 1.8), 0.2, 8.0))
                failed_pings = 0
                log_errors = int(np.random.choice([0, 1, 3], p=[0.5, 0.3, 0.2]))
                net_status = "connected"
                
            elif cat == "Network Connectivity Failure":
                cpu = float(np.clip(np.random.normal(25, 10), 5, 55))
                ram = float(np.clip(np.random.normal(45, 10), 20, 70))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(50, 12), 20, 75))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = int(np.random.choice([3, 4, 5, 6], p=[0.4, 0.3, 0.2, 0.1]))
                log_errors = int(np.random.choice([1, 2, 4], p=[0.4, 0.4, 0.2]))
                net_status = "disconnected" if failed_pings >= 4 else "degraded"
                
            elif cat == "Software / Application Errors":
                cpu = float(np.clip(np.random.normal(45, 15), 15, 75))
                ram = float(np.clip(np.random.normal(55, 12), 25, 78))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(55, 12), 20, 80))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = 0
                log_errors = int(np.random.choice([4, 6, 8, 12], p=[0.3, 0.3, 0.25, 0.15]))
                net_status = "connected"
                
            elif cat == "Service Failure":
                cpu = float(np.clip(np.random.normal(20, 8), 5, 45))
                ram = float(np.clip(np.random.normal(40, 10), 15, 65))
                total_ram_mb = 16384
                avail_ram = float(total_ram_mb * (1 - ram / 100.0))
                disk = float(np.clip(np.random.normal(50, 12), 20, 75))
                free_disk_gb = float(500 * (1 - disk / 100.0))
                failed_pings = 0
                log_errors = int(np.random.choice([2, 3, 5], p=[0.5, 0.3, 0.2]))
                net_status = "connected"

            records.append({
                "device_id": device_id,
                "cpu_usage_pct": round(cpu, 1),
                "ram_usage_pct": round(ram, 1),
                "available_memory_mb": round(avail_ram, 1),
                "disk_usage_pct": round(disk, 1),
                "free_disk_gb": round(free_disk_gb, 1),
                "network_status": net_status,
                "failed_connectivity_checks": failed_pings,
                "log_error_count": log_errors,
                "fault_label": cat,
                "source_type": "simulated"
            })
            
    df = pd.DataFrame(records)
    # Shuffle records
    df = df.sample(frac=1, random_state=random_seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "lab_fault_dataset.csv")
    
    df = generate_telemetry_dataset(num_samples=2100)
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} samples saved to {out_path}")
    print(df["fault_label"].value_counts())
