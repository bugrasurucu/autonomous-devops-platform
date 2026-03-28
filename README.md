# 🚀 Autonomous DevOps Platform — Mission Control

Çoklu ajan mimarisi (MAS) ile AWS altyapısını otomatik kuran, CI/CD pipeline'ı yöneten, maliyetleri takip eden ve servis kesintilerini kendi kendine iyileştiren tam yığın DevOps platformu.

> **Tech Stack:** NestJS (Backend) · Next.js (Frontend) · PostgreSQL · Prisma · Redis · RabbitMQ · Docker

---

## 🏗 Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MISSION CONTROL  (Web UI)                        │
│           Next.js 14 · WebSocket Real-time · Shadcn + Tailwind      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ REST / WebSocket
┌───────────────────────────▼─────────────────────────────────────────┐
│                  NestJS BACKEND  (Port 3001)                         │
│  Auth · Agents · Deployments · GitHub Integration · FinOps · SRE    │
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
       └───────────────┴────────────┴────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │       AWS MCP SERVERS      │
              │  Cloud Control · IaC       │
              │  Pricing · CloudWatch/Logs │
              └────────────────────────────┘
```

---

## 📂 Proje Yapısı

```
autonomous-devops-platform/
├── backend/                          # NestJS API
│   ├── src/
│   │   ├── agents/                   # Agent state & orchestration
│   │   ├── auth/                     # JWT auth, bcrypt
│   │   ├── deployments/              # Deploy trigger & flow
│   │   ├── github/                   # GitHub OAuth + repo API
│   │   ├── finops/                   # Cost analytics
│   │   ├── incidents/                # Self-healing incidents
│   │   ├── gateway/                  # WebSocket events
│   │   └── settings/                 # API keys, agent models
│   └── prisma/schema.prisma          # PostgreSQL ORM schema
├── frontend/                         # Next.js 14 Dashboard
│   └── src/app/dashboard/
│       ├── page.tsx                  # Ana panel (stats, deploy modal)
│       ├── repositories/             # GitHub repo browser
│       ├── agents/                   # Agent status & trigger
│       ├── pipeline/                 # CI/CD pipeline view
│       ├── finops/                   # Maliyet analizi
│       ├── self-healing/             # Incident yönetimi
│       └── settings/                 # Modeller, API anahtarları
├── .agent/
│   ├── rules/                        # Güvenlik kuralları ve guardrails
│   ├── skills/                       # Uzman ajan yetenekleri
│   │   ├── auto-bootstrap/           # Orkestratör — Drop & Deploy
│   │   ├── infra-agent/              # Platform & Altyapı Ajanı
│   │   ├── pipeline-agent/           # CI/CD Boru Hattı Ajanı
│   │   ├── finops-agent/             # FinOps Maliyet Ajanı
│   │   └── sre-agent/               # SRE & Self-Healing Ajanı
│   └── workflows/                    # /deploy-aws, /bootstrap, /self-heal
├── orchestrator/                     # Python A2A orkestrasyon motoru
├── infrastructure/
│   ├── terraform/modules/            # VPC, ECS, RDS, Monitoring
│   ├── lambda/                       # Self-healing webhook
│   └── iam/                          # Ajan IAM rolleri
├── policies/finops/                  # Maliyet politikaları (YAML)
├── templates/github-actions/         # CI/CD şablonları
├── docker-compose.yml                # PostgreSQL + Redis + RabbitMQ
└── mcp_config.json                   # MCP sunucu yapılandırması
```

---

## ⚡ Hızlı Başlangıç

### Gereksinimler

- Docker Desktop
- Node.js v20+
- PostgreSQL (Docker ile otomatik)

### 1. Altyapıyı Başlat

```bash
docker-compose up -d           # PostgreSQL + Redis + RabbitMQ
```

### 2. Backend

```bash
cd backend
cp .env.example .env           # Düzenle: DATABASE_URL, JWT_SECRET
npx prisma db push             # Şemayı uygula
npm install
npm run start:dev              # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env           # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                    # http://localhost:3000
```

### 4. GitHub Entegrasyonu (Opsiyonel)

[github.com/settings/developers](https://github.com/settings/developers) → New OAuth App:
- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3001/api/github/callback`

```bash
# backend/.env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

### 5. Otonom Dağıtım (Ajan Workflow)

```bash
/deploy-aws     # Drop & Deploy — tüm ajanları sıralı tetikler
/bootstrap      # Yalnızca analiz ve planlama
/self-heal      # CloudWatch alarmı sonrası otonom iyileştirme
```

---

## 🌐 API Endpoint'leri

| Yöntem | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş (JWT) |
| GET | `/api/stats` | Platform istatistikleri |
| GET | `/api/agents` | Ajan listesi |
| POST | `/api/deploy` | Deploy tetikle |
| GET | `/api/deployments` | Geçmiş deploylar |
| GET | `/api/github/status` | GitHub bağlantı durumu |
| GET | `/api/github/repos` | Repo listesi |
| GET | `/api/finops` | Maliyet verileri |
| GET | `/api/incidents` | Aktif olaylar |

---

## 🤖 Ajan Rolleri

| Ajan | Sorumluluk | Araçlar |
|------|-----------|---------|
| **Auto-Bootstrap** | Repo analizi & ajan koordinasyonu | Tüm MCP'ler |
| **Infra** | Terraform/CDK/CFn altyapı kodu üretimi | Cloud Control, IaC, Checkov |
| **Pipeline** | CI/CD yapılandırması, test, görsel QA | GitHub Actions, mcpdoc |
| **FinOps** | Maliyet analizi, bütçe geçidi | AWS Pricing, Infracost |
| **SRE** | Anomali tespiti, RCA, otonom iyileştirme | CloudWatch, EventBridge |

---

## ⚠️ Mevcut Sınırlamalar

| Alan | Mevcut Durum | Yol Haritası |
|------|-------------|--------------|
| **Cloud Provider** | Sadece **AWS** | Azure, GCP (kredi bulunursa) |
| **CI/CD** | Sadece **GitHub Actions** | GitLab CI, Jenkins (server tabanlı olduğundan karmaşık) |
| **GitHub Actions Limiti** | Free/Pro'da dakika sınırı var | Enterprise plan veya self-hosted runner |
| **IaC** | Terraform, CDK, CloudFormation | Pulumi |
| **Kod Dili** | Dile bağımsız (Dockerfile ile çalışır) | — |

---

## 🛡 Güvenlik

- **Minimum Ayrıcalık:** Her ajan kendi IAM rolüne sahip
- **Allow/Deny Listeleri**: Yıkıcı komutlar insan onayı gerektirir
- **Şifreleme:** API key'ler ve GitHub token'lar AES-256 ile şifrelenir
- **Devre Kesici:** Bütçe aşımında pipeline otomatik durur
- **Artifact İnceleme:** Tüm Terraform planları dağıtım öncesi onaylanır

---

## 📖 Belgeler

- [Güvenlik Kuralları](.agent/rules/security-guardrails.md)
- [Auto-Bootstrap SKILL](.agent/skills/auto-bootstrap/SKILL.md)
- [Infra Agent SKILL](.agent/skills/infra-agent/SKILL.md)
- [Pipeline Agent SKILL](.agent/skills/pipeline-agent/SKILL.md)
- [FinOps Agent SKILL](.agent/skills/finops-agent/SKILL.md)
- [SRE Agent SKILL](.agent/skills/sre-agent/SKILL.md)
- [A2A Ajan Kartı](.well-known/agent.json)
