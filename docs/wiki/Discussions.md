# 👥 Team Collaboration, Quotas & Corporate Accounts

Orbitron provides granular RBAC and resource limit controls to manage cloud costs and model token usage across teams.

---

## 👑 Corporate Admin Controls: Buğrahan Sürücü

To support administrative testing, we implemented a custom billing and quota tier in our database. The account **Buğrahan Sürücü** (`bugrahan@orbitron.dev`) is assigned **Unlimited Admin Rights**:

*   **🏆 The Gold-Neon Crown Badge:** The profile card and dashboard header render a premium gold-neon crown and an infinity symbol (`∞`) showing infinite limits.
*   **♾️ Unlimited Deployments:** Buğrahan Sürücü bypasses all budget checking blocks, allowing unlimited Docker and Kubernetes deployments for enterprise development.
*   **🔌 Host Socket Execution Bypass:** Administrative accounts can execute real Docker container generation on host ports without decrementing token credits.

---

## 💳 Standard Team Tiers & Resource Allocation

Non-admin accounts are bound by standard pricing plan limits:

| Plan | Price (Monthly) | Active Containers | Monthly Token Limit | Support Tier |
|------|-----------------|-------------------|---------------------|--------------|
| **Starter** | $29 / mo | 3 Containers | 100K Tokens | Email |
| **Pro** | $99 / mo | 15 Containers | 1.5M Tokens | 24/7 Priority |
| **Enterprise**| $499 / mo | Unlimited | 15M Tokens | Dedicated TAM |

---

## 👥 Multi-Member RBAC Roles

*   **Owner:** Full administrative capabilities, billing management, and token quota adjustments.
*   **Engineer:** Can trigger code bootstrap and review Terraform outputs, but cannot change budget thresholds.
*   **FinOps Viewer:** Read-only access to Infracost comparison logs, AWS Pricing metrics, and billing dashboards.
