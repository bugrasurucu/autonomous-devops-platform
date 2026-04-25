# 🪐 Orbitron: Autonomous DevOps Platform — Product Overview

**Orbitron** is a fully autonomous DevOps platform powered by AI agents. It enables engineering teams to provision infrastructure, manage CI/CD pipelines, optimize cloud costs, and self-heal production incidents — all without human intervention.

*"Ship Infrastructure, Not YAML."* — The platform transforms traditional "manage infrastructure with code" into "tell the agent your intent, it manages for you."

---

## 🛠 Technology Choices & Rationale

Orbitron is more than a web application — it's a Platform-as-a-Service with complex AI orchestration under the hood. Every technology choice prioritizes scalability, security, and speed.

### 1. Orchestration & Agent Architecture: Kubernetes & kagent (CRD)
* **Technology:** Kubernetes, Custom Resource Definitions (CRD)
* **Why:** Running AI agents as plain Node.js/Python scripts works locally but fails at SaaS scale. Agents need multi-tenant isolation (no cross-customer data access), stateful crash recovery (restart on failure), and horizontal pod autoscaling (HPA) under load.
* **How:** We created a custom K8s object called `kagent`. Orbitron talks to the Kubernetes control plane and launches agents as K8s Pods — leveraging K8s power without additional orchestration software.

### 2. Agent Integration: MCP (Model Context Protocol) Sidecars
* **Technology:** Anthropic MCP, K8s Mutating Webhooks
* **Why:** Giving LLMs direct access to AWS, Terraform, or GitHub creates security risks. Modifying agent code for every new tool creates monolithic coupling.
* **How:** Tools (AWS Pricing, GitHub API, Kubernetes Control) are attached as **Sidecar Containers** via the MCP layer. When an agent pod starts, independent tool containers spin up alongside it — enabling plug-and-play capability management.

### 3. Frontend & UI/UX: Next.js + Electric DevOps Aesthetic
* **Technology:** Next.js 14 (TypeScript), Custom CSS Design System
* **Why:** A B2B/SaaS product needs flawless SEO and fast first-load (SSR) for the landing page, while the dashboard requires complex state management (agent logs, token counters). Next.js App Router unifies both.
* **Why Electric Cyan / Neon Green?** The initial purple theme looked generic. DevOps teams are familiar with dark themes, terminal screens, Kubernetes' ocean blue, and CI/CD "passed" greens. We designed a bespoke palette — `Electric Cyan (#00d4ff)` and `Neon Green (#00ff88)` — to evoke trust and technical authority.

### 4. Backend & Data Layer: NestJS + Prisma/PostgreSQL
* **Technology:** NestJS, Prisma ORM, PostgreSQL
* **Why:** Customer billing, token budgets, and team management (RBAC) require strict business rules. Rather than loosely-typed Express, we chose NestJS — a TypeScript-first, Dependency Injection-based enterprise framework. PostgreSQL ensures transactional safety for critical financial data.

---

## 🚀 What Has Been Built

1. **Rebranding (Mission Control → Orbitron):** Complete rebrand with professional SaaS-grade identity, logo, and visual language.
2. **Landing Page:** 6-layer marketing site:
   * **Terminal Hero:** Live deploy command simulation
   * **Pipeline Steps:** 6-step autonomous process visualization
   * **AI Agent Fleet:** Introduction of all 4 agents
   * **K8s Architecture:** Engineering-depth Kubernetes infrastructure diagram
   * **Tech Stack Grid:** 18 supported DevOps technologies
   * **Pricing:** Dynamic 3-tier pricing section
3. **Dashboard Integrations:**
   * **Token Usage & Billing:** Credit/plan tracking, fully English, bug-free
   * **MetricsWidget & TerminalLogger:** Real-time observability with Recharts + streaming logs
   * **Stabilization:** Fixed React state deadlocks on agent page transitions; optimized component architectures
4. **Realistic Simulation:** Backend services (Agent Simulation) 100% compatible with frontend for live demos and investor pitches.

---

## 🔮 Future Vision & Product Roadmap

### Phase 1: Multi-Cloud Intelligence (Month 3)
Currently AWS-focused, the Infra Agent will expand to support GCP and Azure. When a user says *"Set up my e-commerce infrastructure in the cheapest European region"*, the FinOps agent compares pricing across all clouds and auto-selects AWS Terraform or Azure Bicep templates.

### Phase 2: BYOA Marketplace — Bring Your Own Agent (Month 6)
A marketplace where customers can upload custom AI DevOps agents for their internal systems. Enterprise clients can run proprietary agents (e.g., custom security scanners) in isolated K8s namespaces via our CRD infrastructure.

### Phase 3: Fully Autonomous Self-Healing (Year 1)
Beyond provisioning — the system will *heal* itself. The SRE Agent reads CloudWatch/Datadog alarms before humans. Database CPU hits 99%? At 3 AM, the agent wakes up, adds a read replica, distributes traffic, and reports via Slack in the morning: *"Fixed this issue overnight — here's the cost impact."*

### Phase 4: Air-Gapped On-Premise (Enterprise)
For banks and defense contractors: an air-gapped version of Orbitron that installs directly into bare-metal Kubernetes clusters in private data centers, running local LLMs (Llama-3, Mistral) instead of cloud APIs.

---

*Orbitron — The Future of Automated Infrastructure Engineering*
