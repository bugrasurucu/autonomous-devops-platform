# 🚀 Orbitron — Autonomous DevOps AI Platform

[![CI](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/ci.yml)
[![CD](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/cd.yml/badge.svg)](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/cd.yml)

Orbitron is an enterprise-grade, multi-agent AI platform that autonomously provisions AWS infrastructure, manages CI/CD pipelines, tracks cloud costs, and self-heals production incidents. It bridges the gap between simulated visual environments and real host orchestrations by integrating a live Docker socket daemon connection to run actual running containers on local ports.

> **Tech Stack:** NestJS · Next.js 14 · PostgreSQL · Prisma · Redis · RabbitMQ · Docker · Kubernetes · Prometheus · Grafana · Gemini Pro

---

## 🌟 Key Platform Features & Integrations

*   **🐳 Host Mode - Real Local Docker Deployment:** Mounts `/var/run/docker.sock` into the API container and uses `docker-cli` to spin up actual, fully-functioning alpine/nginx containers on dynamically allocated local ports (`http://localhost:4500`+).
*   **👑 Unlimited Admin Quota (Buğrahan Sürücü):** Custom corporate billing rules allowing unlimited admin deployment credentials decorated with a premium gold-neon crown and infinite tag indicators.
*   **🕸️ K8s Interactive Cluster Topology Map:** A premium, real-time developer preview canvas visualizing `ingress-controller` ➔ `frontend-service` ➔ API Gateways (`auth-service`, `payment-service`, `notification-service`) ➔ `postgres-db` with custom pod scaling controls.
*   **🔌 Model Context Protocol (MCP) sidecars:** Seamless plug-and-play capability management for standard agents utilizing Anthropic MCP server protocols.
*   **📈 Telemetry & Monitoring:** Bundled with Prometheus (`9090`) and Grafana (`3002`) containers to stream CPU, memory, log anomalies, and agent token usage metrics.

---

## ## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORBITRON WEB UI  (Next.js 14)                     │
│              Dashboard · FinOps · Agents · Pipeline · SRE           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ REST / WebSocket
┌───────────────────────────▼─────────────────────────────────────────┐
│                  NestJS API  (Port 3001)                             │
│  Auth · Agents · Deployments · GitHub · FinOps · SRE · Billing      │
│  PostgreSQL (Prisma) · Redis · RabbitMQ · JWT · WebSocket Gateway   │
│  Docker Socket (/var/run/docker.sock) ──➔ Real Container Deployment │
└──────┬───────────────┬───────────────┬──────────────┬───────────────┘
       │               │               │              │
  ┌────▼────┐    ┌─────▼────┐   ┌─────▼──┐    ┌─────▼───┐
  │  INFRA  │    │  FINOPS  │   │PIPELINE│    │   SRE   │
  │  AGENT  │    │  AGENT   │   │ AGENT  │    │  AGENT  │
  ├─────────┤    ├──────────┤   ├────────┤    ├─────────┤
  │Terraform│    │Infracost │   │GitHub  │    │CloudWatch│
  │CDK/CFn  │    │Pricing   │   │Actions │    │EventBrg  │
  │Checkov  │    │OPA/Rego  │   │Browser │    │Lambda    │
  └────┬────┘    └────┬─────┘   └───┬────┘    └─────┬────┘
       └──────────────┴─────────────┴───────────────┘
                            │
              ┌─────────────▼─────────────┐
              │       AWS MCP SERVERS      │
              │  Cloud Control · IaC       │
              │  Pricing · CloudWatch/Logs │
              └────────────────────────────┘
```

---

## 🆕 Latest Features (Phase 15)

*   **⌘K Command Palette:** Instantly navigate anywhere in the platform using keyboard shortcuts with fuzzy search
*   **🌓 Dark/Light Theme Toggle:** System-aware theme switching with localStorage persistence
*   **🛡️ API Rate Limiting:** Redis-backed sliding window rate limiter with plan-based quotas (Free: 60/min, Starter: 200/min, Pro: 1000/min)
*   **📋 Audit Logging:** Every mutation (POST/PUT/DELETE) is automatically logged with user, IP, endpoint, and request metadata
*   **🔔 Real-time Notifications:** WebSocket push notifications (replacing polling) with desktop notification support
*   **💳 Stripe Webhook Hardening:** `invoice.payment_failed` and `customer.subscription.updated` event handlers
*   **🧪 Cypress E2E Tests:** Automated auth flow, dashboard navigation, and theme toggle tests
*   **🐳 Production Docker Compose:** Nginx reverse proxy with gzip, security headers, and resource limits

---

## 🛠️ Quick Start

### Option 1: Docker Compose (Recommended)

Make sure Docker is running on your host machine to allow the container daemon to bind to the socket!

```bash
cp .env.example .env              # Configure your GEMINI_API_KEY and other credentials
docker compose up --build -d      # Start all Orbitron core services
# → Frontend Dashboard: http://localhost:3000
# → API Service Node:   http://localhost:3001
# → Prometheus Metrics: http://localhost:9090
# → Grafana Visuals:    http://localhost:3002
# → RabbitMQ Gateway:   http://localhost:15672
```

### Option 2: Production Mode (Nginx Reverse Proxy)

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build -d
# → All traffic through Nginx: http://localhost:80
```

### Option 3: Local Development

```bash
# 1. Start core data engines
docker compose up postgres redis rabbitmq prometheus grafana -d

# 2. Start NestJS Backend
cd backend
npm install
npx prisma db push
npm run start:dev              # Running on http://localhost:3001

# 3. Start Next.js Frontend
cd frontend
npm install
npm run dev                    # Running on http://localhost:3000
```

### Running Tests

```bash
# Backend unit tests
cd backend && npx jest --forceExit

# Frontend E2E tests (requires running dev servers)
cd frontend && npx cypress run

# Frontend build check
cd frontend && npm run build
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Validate current session |
| GET | `/api/health` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe (DB check) |
| GET | `/api/stats` | Platform statistics |
| GET | `/api/agents` | List agents |
| POST | `/api/deploy` | Trigger deployment |
| GET | `/api/deployments` | Deployment history |
| POST | `/api/deployments/:id/live-container` | Spin up a REAL running Docker container locally |
| GET | `/api/github/status` | GitHub connection status |
| GET | `/api/github/repos` | List repositories |
| GET | `/api/finops` | Cost analytics |
| GET | `/api/incidents` | Active incidents |

---

## 🤖 Autonomous Agent Registry & Fleets

*   **Auto-Bootstrap:** Initial codebase analyzer. Inspects languages, folders, frameworks, and designs the orchestration plan.
*   **Infra Agent:** Automatically writes production Terraform HCL, CDK scripts, running automated Checkov checks.
*   **Pipeline Agent:** Installs multi-architecture Docker compilations, configures Github Actions pipelines, and executes visual QA.
*   **FinOps Agent:** AWS Pricing MCP & Infracost analyzer. Automatically verifies the monthly cost projections against limits.
*   **SRE Agent:** Tracks CloudWatch metrics, creates automated alarms, and operates on SAAV (Sense-Analyze-Act-Verify) self-healing loop.

---

## 📚 Complete Platform Wiki & Documentation

For in-depth guides and connected platform architectural wikis, please check the [Orbitron Wiki Portal](docs/wiki/Wiki.md) containing:
1. [⚙️ Code Architecture & Core Orchestrator](docs/wiki/Code.md)
2. [🏥 Self-Healing & Incident Streams](docs/wiki/Issues.md)
3. [🚀 Pull Requests, Checkov & FinOps Gates](docs/wiki/Pull_Requests.md)
4. [🤖 A2A Agent Cards & Capability Registry](docs/wiki/Agents.md)
5. [👥 Team collaboration & Quota rules](docs/wiki/Discussions.md)
6. [🎬 Automated Workflows & Visual QA Actions](docs/wiki/Actions.md)
7. [📋 Master Plan & Sequential Pipelines](docs/wiki/Projects.md)
8. [🛡️ Security, RBAC & Isolation Systems](docs/wiki/Security_and_Quality.md)
9. [📈 Grafana Dashboards & Telemetry Insights](docs/wiki/Insights.md)
10. [🔑 Custom Models & Gemini API settings](docs/wiki/Settings.md)
