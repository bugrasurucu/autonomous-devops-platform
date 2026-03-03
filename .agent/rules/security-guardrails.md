---
description: Security guardrails — IAM least privilege, circuit breakers, context isolation
---

# Güvenlik Bariyerleri ve Operasyonel Sınırlar

## 1. Minimum Ayrıcalık Prensibi (Least Privilege)

### Ajan IAM Rol Eşleştirmesi

| Ajan | IAM Rolü | İzin Kapsamı |
|------|----------|-------------|
| **Infra Agent** | `devops-infra-agent-role` | VPC/ECS/RDS CRUD, S3 bucket oluşturma, CloudFormation yürütme. **Yalnızca belirli VPC'lerde.** |
| **Pipeline Agent** | `devops-pipeline-agent-role` | CodePipeline/CodeBuild CRUD, ECR push, S3 artifact okuma/yazma. **IAM değişikliği yok.** |
| **FinOps Agent** | `devops-finops-agent-role` | Cost Explorer ReadOnly, Pricing API, Budgets ReadOnly. **Hiçbir kaynak oluşturamaz.** |
| **SRE Agent** | `devops-sre-agent-role` | CloudWatch ReadOnly, EC2 Reboot, ECS UpdateService, SSM RunCommand. **Silme yetkisi yok.** |

### Mutlak Yasaklar
- Hiçbir ajan root/admin yetkisiyle çalıştırılmaz.
- IAM politika değişikliği yalnızca Infra Agent'a açıktır ve Request Review modundadır.
- Tüm API çağrıları AWS CloudTrail ile denetlenir.

## 2. Devre Kesici (Circuit Breaker) Mantığı

```yaml
circuit_breaker:
  max_retries: 3
  retry_backoff_seconds: [5, 15, 60]
  finops_gate:
    monthly_budget_threshold_usd: 500
    per_deploy_cost_threshold_usd: 50
    action_on_breach: "HALT_PIPELINE"
    notification_channel: "slack:#devops-alerts"
  sre_healing:
    max_auto_remediation_per_hour: 5
    escalation_after_failures: 2
    action_on_escalation: "PAGE_HUMAN_ONCALL"
```

## 3. Bağlam İzolasyonu
- Her ajan kendi sistem prompt'u ile çalışır — çapraz bağlam kontaminasyonu yoktur.
- Ajan çıktıları aktarılmadan önce statik analiz ve şema doğrulaması uygulanır.
- Shared State yazma işlemleri append-only loga kaydedilir.
- Arızalı ajan orkestratör tarafından izole edilir.

## 4. Dosya Erişim Sınırları (Sandboxing)

```yaml
file_access:
  allowed_paths:
    - "${WORKSPACE_ROOT}/**"
    - "~/.gemini/antigravity/skills/**"
  denied_paths:
    - "~/.ssh/**"
    - "~/.aws/credentials"
    - "~/.env"
    - "/etc/**"
    - "~/.gnupg/**"
  settings:
    agent_non_workspace_file_access: false
```

## 5. Artifact İnceleme Politikası
- Tüm Implementation Plan'lar dağıtım öncesinde kullanıcıya sunulur.
- Terraform plan çıktısı her zaman Artifact olarak kaydedilir.
- Maliyet raporu her dağıtımda Artifact olarak üretilir.
