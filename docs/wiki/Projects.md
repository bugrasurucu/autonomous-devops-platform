# 📋 Master Projects & Sequential Deployment Pipelines

Orbitron runs an autonomous deployment pipeline divided into 5 sequential phases. This "Drop & Deploy" pipeline takes raw code from a repository and delivers a fully monitored production service.

---

## 🏁 The 5-Phase Deployment Pipeline

```
  📁 Code Uploaded
         │
         ▼
 ┌───────────────┐
 │ 1. BOOTSTRAP  │ ➔ Scan codebase, determine tech stack and architecture
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ 2. INFRA IaC  │ ➔ Generate Terraform modules and provision cloud resources
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │   3. FINOPS   │ ➔ Estimate costs, verify budgets, enforce OPA policies
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ 4. DEPLOYMENT │ ➔ Build container images, push to registry, deploy service
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │    5. SRE     │ ➔ Set up CloudWatch alarms, dashboards, and SAAV loops
 └───────────────┘
```

---

## 🔍 Detailed Phase Breakdown

### Phase 1: Auto-Bootstrap
*   Scans the repository structure to detect programming languages, dependencies, and frameworks.
*   Determines whether the app is a single monolith or a microservices K8s structure.
*   Formulates the execution plan and selects the appropriate agents.

### Phase 2: Platform Infrastructure (IaC)
*   The **Infra Agent** writes customized Terraform modular configuration files (VPC, ECS, RDS database engines, load balancers).
*   Runs Checkov security checks before triggering `terraform plan`.

### Phase 3: FinOps Gate
*   The **FinOps Agent** utilizes AWS Pricing API sidecars to predict cloud costs.
*   Compares estimates against the remaining token budget.
*   If passed, it signs off the plan; otherwise, a circuit breaker blocks execution.

### Phase 4: CI/CD Delivery
*   The **Pipeline Agent** compiles Docker images.
*   It configures the deployment and tests the results with automated visual smoke tests.

### Phase 5: SRE Monitoring & Healing
*   The **SRE Agent** deploys Prometheus metrics targets and Grafana dashboards.
*   Configures CloudWatch logs alerts and begins monitoring system health.
