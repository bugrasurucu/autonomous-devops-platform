# 💻 Code Architecture & Core Codebase Layout

Orbitron is organized as a monorepo containing three core segments: the **Frontend dashboard client**, the **Backend API gateway server**, and the **Python AI Orchestrator**.

---

## 📂 Repository File Structure

```
autonomous-devops-platform/
├── .agent/                  # Multi-agent prompt guidelines, rules, and workspace skills
│   ├── rules/               # Security guardrails & execution instructions
│   └── skills/              # Auto-bootstrap, infra, pipeline, finops, sre agent skill instructions
├── backend/                 # NestJS Web API gateway service node
│   ├── src/
│   │   ├── auth/            # JWT token generation, OAuth handlers, database registers
│   │   ├── deployments/     # Local Host Docker orchestrator (with docker socket binding)
│   │   ├── agents/          # AgentExecution polling services, simulations
│   │   └── finops/          # AWS Pricing API integrations
│   ├── prisma/              # PostgreSQL ORM schema definitions and migrations
│   └── Dockerfile           # Multi-stage production compilation runner
├── frontend/                # Next.js 14 client dashboard
│   ├── src/
│   │   ├── app/             # App router pages (dashboard, deployments, preview, settings)
│   │   ├── components/      # Observation widgets, TerminalLogger, MetricsWidget Recharts
│   │   └── lib/             # API HTTP custom wrappers
│   └── Dockerfile           # Standalone Next.js production runner
├── orchestrator/            # Python agent orchestration platform
│   ├── agent_registry.py    # A2A agent registration, CapabilityCard definitions
│   └── main.py              # Multi-agent state synchronization
├── monitoring/              # Grafana & Prometheus templates and targets
└── docker-compose.yml       # Complete multi-container microservice definition
```

---

## ⚙️ Core Backend Services

### 🐳 Deployments & Host Socket Orchestrator (`deployments.service.ts`)
This service interfaces with the Docker socket `/var/run/docker.sock` to orchestrate actual host container lifetimes. When a user requests a real local container:
1.  It verifies the deployment schema inside the PostgreSQL database.
2.  It contacts the Docker daemon utilizing standard Docker CLI executors.
3.  It allocates a free host port and launches a container configured with a custom nginx/alpine chatbot interface.

### 🔑 Security & Authentication Gateway (`auth.service.ts`)
Validates user claims via enterprise-grade JSON Web Tokens (JWT). Admin rights are decorated via specific database attributes. Admin users like **Buğrahan Sürücü** bypass the standard subscription limits, gaining the gold-neon badge and unlimited host Docker allocations.

---

## 📊 Database Schema (`schema.prisma`)

*   **User:** Stores username, email, encrypted password, role, and corporate billing details.
*   **Deployment:** Stores deployment metadata (name, state, source URL, region, assigned local host port, container ID).
*   **AgentExecution:** Keeps logs of all cognitive steps executed by standard agents (Bootstrap, Infra, FinOps, SRE, Pipeline).
*   **BillingPlan:** Models subscription pricing plans (Starter, Pro, Enterprise, Unlimited Admin).
