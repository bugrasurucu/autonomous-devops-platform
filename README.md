# 🚀 Orbitron — Autonomous DevOps AI Platform

[![CI](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/ci.yml)
[![CD](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/cd.yml/badge.svg)](https://github.com/bugrasurucu/autonomous-devops-platform/actions/workflows/cd.yml)

Multi-agent AI platform that autonomously provisions AWS infrastructure, manages CI/CD pipelines, tracks cloud costs, and self-heals production incidents.

> **Tech Stack:** NestJS · Next.js 14 · PostgreSQL · Prisma · Redis · RabbitMQ · Docker · Kubernetes

---

## Architecture

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

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cp .env.example .env              # Configure environment variables
docker compose up --build -d      # Start all 5 services
# → Frontend: http://localhost:3000
# → API:      http://localhost:3001
# → RabbitMQ:  http://localhost:15672
```

### Option 2: Local Development

```bash
# 1. Start infrastructure
docker compose up postgres redis rabbitmq -d

# 2. Backend
cd backend
npm install
npx prisma db push
npm run start:dev              # http://localhost:3001

# 3. Frontend
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

### GitHub OAuth (Optional)

1. Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
2. Homepage: `http://localhost:3000`
3. Callback: `http://localhost:3001/api/github/callback`
4. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to your `.env`

---

## API Endpoints

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
| GET | `/api/github/status` | GitHub connection status |
| GET | `/api/github/repos` | List repositories |
| GET | `/api/finops` | Cost analytics |
| GET | `/api/incidents` | Active incidents |

---

## Agent Fleet

| Agent | Responsibility | Tools |
|-------|---------------|-------|
| **Auto-Bootstrap** | Repo analysis & agent coordination | All MCP servers |
| **Infra** | Terraform/CDK/CFn infrastructure code generation | Cloud Control, IaC, Checkov |
| **Pipeline** | CI/CD configuration, testing, visual QA | GitHub Actions, mcpdoc |
| **FinOps** | Cost analysis, budget gate | AWS Pricing, Infracost |
| **SRE** | Anomaly detection, RCA, autonomous remediation | CloudWatch, EventBridge |

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | System stats, MetricsWidget charts, TerminalLogger, recommendations |
| **Agents** | Agent fleet overview, trigger executions, real-time step polling |
| **FinOps** | Cost breakdown, pricing tiers, AWS Free Tier info, smart suggestions |
| **Pipeline** | Deployment history table with status, region, cost, duration |
| **Self-Healing** | SAAV heal cycle visualization, incident timeline |
| **Repositories** | GitHub OAuth, repo browser, one-click deploy |
| **Token Usage** | Monthly budget tracking, model & agent distribution |
| **Billing** | Plan comparison, Stripe checkout integration |
| **Team** | Member management, invite system, role assignments |
| **Settings** | Profile, AI models, API key management |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET` | JWT signing key | (required) |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | (optional) |
| `STRIPE_PRICE_*` | Stripe Price IDs | placeholder |

---

## CI/CD

- **CI** (`ci.yml`): Runs on push/PR to `main` — backend type-check + build (with Postgres), frontend type-check + build
- **CD** (`cd.yml`): Runs on push to `main` or version tags — builds and pushes Docker images to GitHub Container Registry (GHCR)

---

## Security

- **Least Privilege**: Each agent has its own IAM role
- **Allow/Deny Lists**: Destructive commands require human approval
- **Encryption**: API keys and GitHub tokens encrypted with AES-256
- **Circuit Breaker**: Pipeline halts on budget overrun
- **Artifact Review**: All Terraform plans reviewed before deployment

---

## Current Limitations

| Area | Current | Roadmap |
|------|---------|---------|
| Cloud Provider | AWS only | Azure, GCP |
| CI/CD | GitHub Actions only | GitLab CI, Jenkins |
| Auth | Custom JWT | NextAuth.js / Auth0 |
| IaC | Terraform, CDK, CFn | Pulumi |

---

## Documentation

- [Security Guardrails](.agent/rules/security-guardrails.md)
- [Auto-Bootstrap SKILL](.agent/skills/auto-bootstrap/SKILL.md)
- [Infra Agent SKILL](.agent/skills/infra-agent/SKILL.md)
- [Pipeline Agent SKILL](.agent/skills/pipeline-agent/SKILL.md)
- [FinOps Agent SKILL](.agent/skills/finops-agent/SKILL.md)
- [SRE Agent SKILL](.agent/skills/sre-agent/SKILL.md)
- [Production Plan](ORBITRON_PRODUCTION_PLAN.md)
- [Product Overview](ORBITRON_PRODUCT_OVERVIEW.md)
