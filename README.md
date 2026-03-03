# 🚀 Otonom DevOps ve Self-Healing Platformu

Google Antigravity ve Çoklu Ajan Mimarisi (MAS) temelinde inşa edilmiş, AWS altyapısını otonom olarak kurabilen, dört uzman ajan ile donatılmış bir DevOps platformu.

## 🏗 Mimari Genel Bakış

```
┌──────────────────────────────────────────────┐
│          AUTO-BOOTSTRAP ORKESTRATÖR          │
│    (Repo Araştırma → Ajan Koordinasyonu)     │
└────────┬──────────┬──────────┬───────────────┘
         │          │          │
    ┌────▼────┐┌────▼────┐┌───▼────┐┌─────────┐
    │ INFRA   ││ FINOPS  ││PIPELINE││   SRE   │
    │ AGENT   ││ AGENT   ││ AGENT  ││  AGENT  │
    ├─────────┤├─────────┤├────────┤├─────────┤
    │Terraform││Infracost││GitHub  ││CloudWatch│
    │CDK/CFn  ││Pricing  ││Actions ││EventBrg │
    │Checkov  ││OPA/Rego ││Browser ││Lambda   │
    └────┬────┘└────┬────┘└───┬────┘└────┬────┘
         │          │          │          │
    ┌────▼──────────▼──────────▼──────────▼────┐
    │              AWS MCP SUNUCULARI           │
    │  Cloud Control │ IaC │ Pricing │ CW/Logs │
    └──────────────────────────────────────────┘
```

## 📂 Proje Yapısı

```
autonomous-devops-platform/
├── .agent/
│   ├── rules/                    # Güvenlik kuralları ve guardrails
│   ├── skills/                   # Uzman ajan yetenekleri
│   │   ├── auto-bootstrap/       # Orkestratör — Drop & Deploy
│   │   ├── infra-agent/          # Platform & Altyapı Ajanı
│   │   ├── pipeline-agent/       # CI/CD Boru Hattı Ajanı
│   │   ├── finops-agent/         # FinOps Maliyet Ajanı
│   │   └── sre-agent/            # SRE & Self-Healing Ajanı
│   └── workflows/                # Komut kısayolları
├── orchestrator/                 # A2A orkestrasyon motoru
├── infrastructure/
│   ├── terraform/modules/        # VPC, ECS, RDS, Monitoring
│   ├── lambda/                   # Self-healing webhook
│   └── iam/                      # Ajan IAM rolleri
├── policies/finops/              # Maliyet politikaları
├── templates/github-actions/     # CI/CD şablonları
├── .well-known/agent.json        # A2A protokolü ajan kartı
└── mcp_config.json               # MCP sunucu yapılandırması
```

## ⚡ Hızlı Başlangıç

### 1. Otonom Dağıtım (Drop & Deploy)
```bash
# Proje dosyalarınızı workspace'e ekleyin, sonra:
/deploy-aws
```

### 2. Yalnızca Analiz
```bash
/bootstrap
```

### 3. Self-Healing Tetikleme
```bash
/self-heal
```

## 🛡 Güvenlik

- **Minimum Ayrıcalık:** Her ajan kendi IAM rolüne sahip
- **Allow/Deny Listeleri:** Yıkıcı komutlar insan onayı gerektirir
- **Sandbox:** Ajanlar yalnızca workspace'e erişebilir
- **Devre Kesici:** Bütçe aşımı veya hata döngüsünde pipeline durur
- **Artifact İnceleme:** Tüm planlar dağıtım öncesi görselleştirilir

## 🤖 Ajan Rolleri

| Ajan | MCP Sunucuları | Sorumluluk |
|------|---------------|------------|
| **Infra** | Cloud Control, IaC, Terraform | Altyapı kodu üretimi ve provizyonlama |
| **Pipeline** | mcpdoc GitHub/AWS | CI/CD yapılandırma, test, görsel QA |
| **FinOps** | Pricing | Maliyet analizi, bütçe doğrulama |
| **SRE** | CloudWatch | Anomali tespiti, RCA, otonom iyileştirme |

## 📖 Belgeler

- [Mimari Tasarım Raporu](docs/architecture.md)
- [Güvenlik Kuralları](.agent/rules/security-guardrails.md)
- [A2A Ajan Kartı](.well-known/agent.json)
