# 📖 Orbitron Portal Developer Wiki & Knowledge Base

Welcome to the official developer wiki of **Orbitron**. This portal houses in-depth architectural guides, engineering choices, integration details, and guides to the autonomous multi-agent fleet.

---

## 🗺️ Portal Navigation Map

Browse the developer wiki using the tabs below to explore the core components and systems:

*   **[💻 Code Architecture](Code.md)**
    Deep dive into the repository code layout, directories, data layer schemas, and core NestJS/Next.js services.
*   **[🏥 Issues & Incident Resolution](Issues.md)**
    Details on the SRE Agent's SAAV (Sense-Analyze-Act-Verify) self-healing loop, CloudWatch integration, and log anomaly filters.
*   **[🚀 Pull Requests & Gated Pipelines](Pull_Requests.md)**
    How FinOps limits and Checkov security checks acts as deployment gating mechanisms before pull requests get compiled.
*   **[🤖 Agent Capability Registry](Agents.md)**
    The A2A (Agent-to-Agent) registration protocol, `.well-known/agent.json` specifications, and Anthropic MCP sidecar systems.
*   **[👥 Team Discussions & Quotas](Discussions.md)**
    Corporate resource allocation, custom pricing tiers, and unlimited admin privileges designed for Buğrahan Sürücü.
*   **[🎬 Workflows & Visual QA Actions](Actions.md)**
    GitHub Actions CI/CD workflows and visual UI quality assurance utilizing the automated Browser Subagent.
*   **[📋 Master Projects Pipeline](Projects.md)**
    Understanding the 5 sequential deployment phases: Bootstrap ➔ Infrastructure ➔ FinOps ➔ CI/CD ➔ SRE Monitoring.
*   **[🛡️ Security, RBAC & Quality Guards](Security_and_Quality.md)**
    Encryption engines, least-privileged AWS IAM definitions, and container boundaries.
*   **[📈 Grafana Insights & Telemetry](Insights.md)**
    Prometheus configuration, pre-built dashboard schemas, and Recharts token widgets.
*   **[🔑 Custom Models & AI Settings](Settings.md)**
    Gemini API token bindings (`GEMINI_API_KEY` mapping), routing options, and model hyperparameters.

---

## 🪐 Core Philosophy: "Drop & Deploy"

Orbitron changes how teams deploy. Instead of manually writing thousands of lines of Terraform, Dockerfiles, and GitHub Actions YAML, developers simply link a repository. The autonomous agent fleet does the rest. By mounting `/var/run/docker.sock`, Orbitron allows running the output in a **real, live host container** during previewing, validating that compiled assets perform perfectly under actual Nginx Alpine ingress conditions.
