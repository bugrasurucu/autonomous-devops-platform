# 🛡️ Security, RBAC & Isolation Systems

Security is a primary design goal of Orbitron. The platform implements multiple isolation layers to protect customer credentials and production environments.

---

## 🔒 1. Cryptographic Security Engine

*   **AES-256 Encryption:** Third-party OAuth tokens, GitHub SSH keys, and cloud credentials (e.g., `AWS_ACCESS_KEY_ID`) are encrypted at rest inside PostgreSQL utilizing the `EncryptionService` node.
*   **Decryption Isolation:** Decryption keys are stored inside environment variables (`ENCRYPTION_KEY`) and are never exposed to agents or frontend clients.

---

## 👮 2. Role-Based Access Control (RBAC)

Orbitron enforces strict tenant isolation and role permissions across organizations:

*   **User Isolation:** Database queries use scoped ORM clauses (`where: { tenantId }`) to prevent cross-customer data leakage.
*   **Granular Roles:**
    *   `Admin`: Complete control over billing, invite links, cloud keys, and deployments.
    *   `Developer`: Can trigger deployment pipelines and inspect agent logs, but cannot view raw credentials or alter billing plans.
    *   `Viewer`: Read-only access to dashboards, topology maps, and metrics.

---

## 🤖 3. Least-Privileged Agent IAM Roles

Agents do not run with full root admin cloud access. Each otonom agent is assigned a dedicated AWS IAM role restricted to its specific task:

```
┌──────────────┐      ┌─────────────────────────┐
│ Infra Agent  │ ──➔  │ IAM Policy: EC2/ECS/RDS │ (Write-only Cloud Control)
└──────────────┘      └─────────────────────────┘
┌──────────────┐      ┌─────────────────────────┐
│ FinOps Agent │ ──➔  │ IAM Policy: Pricing API │ (Read-only Price listings)
└──────────────┘      └─────────────────────────┘
┌──────────────┐      ┌─────────────────────────┐
│  SRE Agent   │ ──➔  │ IAM Policy: CloudWatch  │ (Read-only telemetry, alert writes)
└──────────────┘      └─────────────────────────┘
```

---

## 🛑 4. Terminal Control & Sandboxing

*   **Allow/Deny Lists:** Agent shell executors block destructive shell scripts or attempts to access directories outside the repository workspace (`/app`).
*   **Human Approval Gates:** Standard agent runs require manual developer sign-off on the dashboard before executing commands like `terraform destroy`.
