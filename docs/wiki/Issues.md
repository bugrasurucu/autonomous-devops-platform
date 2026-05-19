# 🏥 Issues & Self-Healing Anomaly Streams

The **SRE Agent** manages system reliability and operates the automated incident remediation loop. It detects errors, executes root-cause-analysis, and heals services.

---

## 🔁 The SAAV Self-Healing Loop

The self-healing workflow utilizes the four-stage **SAAV (Sense, Analyze, Act, Verify)** cycle:

```
    ┌─────────────────────────┐
    │          SENSE          │  CloudWatch Alarm / Prometheus metric threshold
    └────────────┬────────────┘
                 │ Alert payload
                 ▼
    ┌─────────────────────────┐
    │         ANALYZE         │  SRE Agent executes RAG search, parses system logs
    └────────────┬────────────┘
                 │ Remediation action plan
                 ▼
    ┌─────────────────────────┐
    │           ACT           │  Executes container restarts, scaling or rollbacks
    └────────────┬────────────┘
                 │ Execution status
                 ▼
    ┌─────────────────────────┐
    │         VERIFY          │  Health-check probe confirms success; alerts team
    └─────────────────────────┘
```

1.  **Sense:** Prometheus or CloudWatch metrics detect warning levels (e.g., CPU > 90% or 5xx HTTP codes).
2.  **Analyze:** The SRE Agent intercepts the event, gathers diagnostic context, and runs RAG reasoning to formulate a fix.
3.  **Act:** The agent issues API commands to the infrastructure provider (e.g., restarts the service or adjusts replica count).
4.  **Verify:** The agent checks health probes. If solved, the incident is closed and a summary reports to Slack/Teams.

---

## 📈 Real-Time Anomaly Detection

*   **Metric Threshold Filtering:** Alarms triggers immediately when anomalies persist for more than 3 consecutive evaluation cycles.
*   **Log Analytics:** SRE utilizes log streams to detect memory leaks, unhandled exceptions, or database connection pool depletion.
*   **Simulated Incidents:** Developers can test the SRE response by clicking "Simulate Incident" on the dashboard, confirming the SAAV steps update live.
