# 🪐 Orbitron: Multi-Cloud Autonomous DevOps Platform — Product Overview

> **See [`ORBITRON_MASTER_PLAN.md`](./ORBITRON_MASTER_PLAN.md) for the complete A-to-Z architectural audit, gap analysis, and multi-cloud roadmap.**

**Orbitron** is an autonomous, multi-cloud DevOps Control Plane powered by specialized AI agents. It enables engineering teams to analyze repositories, generate cloud-native Infrastructure-as-Code (AWS, GCP, Azure, Kubernetes), run CI/CD pipelines, optimize cloud costs (FinOps), and self-heal production incidents (SAAV) from a unified dashboard.

*"Ship Infrastructure, Not YAML."*

---

## 🛠 Technology Stack & Architecture

### 1. Multi-Cloud Infrastructure Synthesis (AWS, GCP, Azure, Kubernetes)
* **Supported Clouds:**
  * **AWS:** ECS Fargate, RDS PostgreSQL, ALB, ECR, CloudWatch (`hashicorp/aws`)
  * **Google Cloud (GCP):** Cloud Run v2, Cloud SQL, Artifact Registry, Cloud Monitoring (`hashicorp/google`)
  * **Microsoft Azure:** Azure Container Apps, Azure Database for PostgreSQL Flexible Server, ACR, Azure Monitor (`hashicorp/azurerm`)
  * **Kubernetes (Any Cluster):** Deployment, Service, Ingress, HorizontalPodAutoscaler (`k8s/manifest.yaml`)
  * **Local Docker Runtime:** Live container spawning on ports `4500–4900` via `/var/run/docker.sock`

### 2. 5-Stage Autonomous Agent Fleet
1. **Auto-Bootstrap Agent:** Inspects GitHub repositories via the GitHub REST API (`/repos/:owner/:repo` & `/contents`) to detect languages, frameworks, databases, and Dockerfiles.
2. **Infra Agent:** Synthesizes a 6-file Production DevOps Bundle (`Dockerfile`, `docker-compose.prod.yml`, provider-specific `terraform/main.tf`, `.github/workflows/orbitron-ci-cd.yml`, `k8s/manifest.yaml`, and `sre/cloudwatch-saav.tf`).
3. **FinOps Agent:** Computes monthly cloud cost breakdowns across compute, database, networking, and storage, and provides one-click architectural cost optimization (`POST /api/finops/optimize/:id`).
4. **Pipeline Agent:** Executes build/test stages, generates OIDC-ready GitHub Actions workflows, and supports one-click **Promote to Production**, **Redeploy**, and **Rollback**.
5. **SRE Agent:** Runs the autonomous **SAAV (`Sense → Analyze → Act → Verify`)** loop to detect anomalies, auto-remediate incidents (`POST /api/incidents/:id/auto-heal`), and verify service recovery.

### 3. Frontend & Developer Console (`frontend/`)
* **Technology:** Next.js App Router (TypeScript), Socket.IO real-time telemetry, Recharts observability widgets.
* **Key Capabilities:**
  * Multi-Cloud Provider & Region selector in deployment modals
  * Interactive 6-file DevOps IaC & CI/CD Bundle viewer and downloader
  * Real-time WebSocket terminal log streaming & pipeline stage inspector
  * GitHub connection via OAuth, Personal Access Token (PAT), or zero-config GitHub Username lookup
  * Interactive Kubernetes topology visualizer & pod replica scaler

### 4. Backend Control Plane (`backend/`)
* **Technology:** NestJS, Prisma ORM, PostgreSQL 16, Redis 7, RabbitMQ 3, `@google/genai` SDK.
* **Key Capabilities:**
  * Persistent activity event log (`Activity` model + `@OnEvent('activity.new')`)
  * Real Docker container status & log inspection (`GET /api/deployments/:id/container-status`)
  * Multi-cloud Terraform & CI/CD template generator tailored to each repository's detected stack

---

## 🗺️ Strategic Roadmap Summary

For the detailed 11-phase engineering checklist, security remediation plan, and `CloudProvider` adapter specifications, consult [`ORBITRON_MASTER_PLAN.md`](./ORBITRON_MASTER_PLAN.md).
