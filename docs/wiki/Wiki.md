# 📖 Orbitron Portal Developer Wiki & Knowledge Base

Welcome to the official developer wiki of **Orbitron**. This portal houses in-depth architectural guides, engineering choices, integration details, and guides to the autonomous multi-cloud agent fleet.

> 📌 **Start Here:** Read **[`ORBITRON_MASTER_PLAN.md`](../../ORBITRON_MASTER_PLAN.md)** for the complete A-to-Z architectural analysis, current capability inventory, multi-cloud design (`AWS`, `GCP`, `Azure`, `Kubernetes`, `Local Docker`), and 11-phase roadmap.

---

## 🗺️ Portal Navigation Map

Browse the developer wiki using the links below to explore the core components and systems:

*   **[📐 Architecture Overview](../architecture.md)**
    Multi-Cloud Control Plane design, 5-agent pipeline, Cloud Provider matrix, and Host Docker integration.
*   **[💻 Code Architecture](Code.md)**
    Deep dive into the repository code layout, directories, Prisma data layer schemas, and core NestJS/Next.js services.
*   **[🏥 Issues & Incident Resolution](Issues.md)**
    Details on the SRE Agent's SAAV (`Sense → Analyze → Act → Verify`) self-healing loop, telemetry integration, and anomaly filters.
*   **[🚀 Pull Requests & Gated Pipelines](Pull_Requests.md)**
    How FinOps budget limits and security checks act as deployment gating mechanisms before pull requests get deployed.
*   **[🤖 Agent Capability Registry](Agents.md)**
    The A2A (Agent-to-Agent) registration protocol, `.well-known/agent.json` specifications, and MCP sidecar systems.
*   **[👥 Team Discussions & Quotas](Discussions.md)**
    Corporate resource allocation, custom pricing tiers, and unlimited admin privileges.
*   **[🎬 Workflows & Visual QA Actions](Actions.md)**
    Multi-cloud GitHub Actions CI/CD workflows and automated smoke/visual QA verification.
*   **[📋 Master Projects Pipeline](Projects.md)**
    Understanding the 5 sequential deployment phases: `Auto-Bootstrap ➔ Multi-Cloud Infra ➔ FinOps ➔ CI/CD Pipeline ➔ SRE Monitoring`.
*   **[🛡️ Security, RBAC & Quality Guards](Security_and_Quality.md)**
    Encryption engines, least-privileged OIDC IAM definitions, and container boundaries.
*   **[📈 Grafana Insights & Telemetry](Insights.md)**
    Prometheus configuration, pre-built dashboard schemas, and Recharts token widgets.
*   **[🔑 Custom Models & AI Settings](Settings.md)**
    Gemini API token bindings (`GEMINI_API_KEY` mapping), routing options, and model hyperparameters.
