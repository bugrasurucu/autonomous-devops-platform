# 🚀 Pull Requests & Gated Deployment Controls

Orbitron implements gated deployment checks on pull requests. These guardrails ensure that no insecure infrastructure or budget-breaching plans reach the production environment.

---

## 🔒 The Three Gated Quality Gates

When a new pull request is opened, Orbitron executes three sequential automated validation gates:

```
    Pull Request Opened
             │
             ▼
   ┌───────────────────┐
   │ 1. SECURITY GATE  │ ➔ Checkov scans Terraform code for credentials or open ports
   └─────────┬─────────┘
             │ Passed
             ▼
   ┌───────────────────┐
   │  2. FINOPS GATE   │ ➔ Infracost estimates cost differences against token budgets
   └─────────┬─────────┘
             │ Passed
             ▼
   ┌───────────────────┐
   │ 3. PIPELINE GATE  │ ➔ Automated unit tests run, followed by visual smoke tests
   └─────────┬─────────┘
             │ Passed
             ▼
    Ready for Merging
```

### 1. The Security Gate (Checkov)
*   Scans Terraform HCL blocks or Kubernetes YAML configurations for vulnerabilities.
*   Enforces security policies (e.g., blocks open ports like `0.0.0.0/0` on port 22).

### 2. The FinOps Gate (Infracost)
*   Estimates the change in monthly cloud spend based on the PR diff.
*   If the new spend exceeds the remaining token budget, the pipeline triggers a **circuit breaker**, blocking the merge until an admin approves the overage.

### 3. The Pipeline Gate (Visual QA)
*   Runs unit tests and packages the application inside a temporary container.
*   The **Browser Subagent** performs visual smoke tests on the UI to ensure no layouts or assets are broken.

---

## 🔁 Automated Rollbacks

If a deployment succeeds but subsequently triggers an SRE anomaly alarm within the first 5 minutes of release, the Pipeline Agent initiates a roll-back:
1.  Locates the last known healthy deployment commit hash.
2.  Deploys the safe version back to host environments.
3.  Marks the current release as degraded, keeping details available for post-incident review.
