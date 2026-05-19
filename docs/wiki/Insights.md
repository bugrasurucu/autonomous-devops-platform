# 📈 Telemetry, Prometheus & Grafana Dashboard Insights

Orbitron provides full observability into infrastructure health, model execution latency, and financial performance.

---

## 📊 1. Bundled Telemetry Stack

The production `docker-compose.yml` deploys a complete monitoring stack alongside the application:

```
                  ┌──────────────────────┐
                  │ Next.js Dashboard    │ (Renders MetricsWidget charts via Recharts)
                  └──────────▲───────────┘
                             │ Rest/WebSockets
                  ┌──────────┴───────────┐
                  │ NestJS API Gateway   │
                  └──────────▲───────────┘
                             │ Prometheus metrics endpoint
                  ┌──────────┴───────────┐
                  │ Prometheus Container │ (Port 9090 - scrapes compute/agent states)
                  └──────────▲───────────┘
                             │ Scrape targets
                  ┌──────────┴───────────┐
                  │  Grafana Container   │ (Port 3002 - pre-built telemetry dashboards)
                  └──────────────────────┘
```

*   **Prometheus (Port `9090`):** Automatically scrapes application metrics and host telemetry targets.
*   **Grafana (Port `3002`):** Contains pre-configured dashboards displaying agent latency, memory footprints, and resource usage.

---

## 📊 2. Dashboard Observation Widgets

The web console provides three real-time telemetry panels:

*   **MetricsWidget:** Uses Recharts to visualize monthly token consumption, model allocation metrics (e.g., Gemini vs Claude), and compute usage.
*   **TerminalLogger:** Streams real-time system logs colored by severity level (Info, Success, Warning, Error) over secure WebSockets.
*   **Live Cluster Topologies:** Renders active pod configurations and replica details inside simulated Kubernetes environments, showing CPU load and memory metrics.

---

## 💸 3. Cost-Tracking SUGGESTIONS (FinOps)

The telemetry layer includes automated financial recommendations:

*   **Idle Resource Detection:** Alerts the team when provisioned VMs or databases receive zero incoming traffic for more than 48 hours.
*   **AWS Free Tier Warnings:** Informs users when they approach AWS Free Tier credit limits.
*   **Auto-Scaling Recommendations:** Suggests shrinking resource allocations when average CPU load stays below 15%.
