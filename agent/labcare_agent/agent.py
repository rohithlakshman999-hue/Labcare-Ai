import time
import logging
from labcare_agent.config import config
from labcare_agent.collectors.system_metrics import SystemMetricsCollector
from labcare_agent.transport.client import BackendClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [AGENT] %(levelname)s: %(message)s")
logger = logging.getLogger("labcare_agent")

class LabCareAgent:
    def __init__(self, cfg=config):
        self.config = cfg
        self.client = BackendClient(
            backend_url=cfg.backend_url,
            agent_token=cfg.agent_token,
            max_retries=cfg.max_retries,
            retry_delay=cfg.retry_delay_seconds
        )
        self.running = False

    def run_once(self) -> bool:
        """Collect and transmit a single snapshot and heartbeat."""
        logger.info(f"Collecting telemetry for device {self.config.device_id}...")
        metrics = SystemMetricsCollector.collect(host_to_check=self.config.ping_host)
        
        hb_ok = self.client.send_heartbeat(self.config.device_id)
        if hb_ok:
            logger.info("Heartbeat sent successfully.")
        else:
            logger.warning("Heartbeat failed to reach backend.")

        metrics_ok = self.client.send_metrics(self.config.device_id, metrics)
        if metrics_ok:
            logger.info(f"Metrics transmitted (CPU: {metrics['cpu_usage_pct']}%, RAM: {metrics['ram_usage_pct']}%, Disk: {metrics['disk_usage_pct']}%).")
        else:
            logger.warning("Failed to transmit metrics snapshot.")

        return hb_ok and metrics_ok

    def start(self):
        """Continuous monitoring loop."""
        self.running = True
        logger.info(f"LabCare Agent starting on {self.config.device_id}. Interval: {self.config.collection_interval_seconds}s")
        while self.running:
            try:
                self.run_once()
            except Exception as e:
                logger.error(f"Error during agent loop tick: {e}")
            time.sleep(self.config.collection_interval_seconds)

    def stop(self):
        self.running = False
        logger.info("LabCare Agent stopped.")
