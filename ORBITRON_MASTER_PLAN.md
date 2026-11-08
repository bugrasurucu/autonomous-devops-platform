# 🪐 Orbitron — Master Plan (Amaç, Gerçek Durum Analizi ve A'dan Z'ye Yapılacaklar)

> Bu doküman `ORBITRON_PRODUCTION_PLAN.md` dosyasının yerini alır. Projenin **gerçek** durumunu (neyin çalıştığını, neyin simülasyon olduğunu) dürüstçe ortaya koyar ve Orbitron'u **kullanılabilir, multi-cloud bir ürüne** dönüştürmek için gereken tüm işleri öncelik sırasıyla listeler.
>
> Son güncelleme: 2026-11-07

---

## 1. Ürünün Amacı (Tek Cümle)

**"Repo'nu ver, gerisini ajanlar yapsın."** — Orbitron, bir Git reposunu analiz edip seçilen bulutta (AWS / GCP / Azure / Kubernetes) güvenli ve bütçeye uygun altyapıyı kuran, CI/CD'yi bağlayan, maliyeti izleyen ve production'daki olayları kendi kendine iyileştiren çok ajanlı bir DevOps platformudur.

### Hedef kullanıcı ve temel iş akışı

| # | Adım | Kullanıcının beklentisi |
|---|------|-------------------------|
| 1 | **Connect** | GitHub/GitLab hesabını ve bulut hesabını (OIDC ile, anahtarsız) bağlar |
| 2 | **Analyze** | Repo gerçekten taranır: dil, framework, port, env değişkenleri, DB ihtiyacı |
| 3 | **Plan** | Seçilen bulut için IaC (Terraform/OpenTofu) + Dockerfile + CI/CD üretilir, **diff olarak** gösterilir |
| 4 | **Gate** | Checkov/Trivy güvenlik + Infracost maliyet kapısı; bütçe aşılırsa durur |
| 5 | **Approve** | Human-in-the-loop: kullanıcı planı onaylar (veya auto-approve politikası) |
| 6 | **Apply** | İzole runner'da `tofu apply`, image build & push, deploy |
| 7 | **Verify** | Healthcheck + smoke test; başarısızsa otomatik rollback |
| 8 | **Operate** | Gerçek metrikler, alarmlar, SAAV self-healing, FinOps önerileri |
| 9 | **Deliver** | Üretilen dosyalar kullanıcının reposuna **Pull Request** olarak açılır |

---

## 2. Gerçek Durum Analizi (Dürüst Envanter)

### 2.1 Gerçekten çalışanlar ✅

- NestJS API + Prisma/PostgreSQL: auth (JWT), kullanıcı/organizasyon, plan & kota, deployment kayıtları, incident kayıtları, aktivite akışı, token kullanım kaydı.
- Next.js dashboard: tüm sayfalar render oluyor, polling + SSE/WebSocket ile canlı güncelleniyor.
- GitHub: OAuth (yapılandırılırsa), kullanıcı adı ile public repo listesi, PAT ile private repo listesi; deploy sırasında repo metadata + kök dosya listesi okunuyor.
- Lokal Docker: `nginx:alpine` container'ı gerçekten ayağa kalkıyor, durumu/logları `docker inspect/logs` ile okunuyor, durdurulabiliyor.
- Üretilen dosya paketi (Dockerfile, compose, Terraform, GitHub Actions, K8s manifest, CloudWatch alarm) görüntülenip indirilebiliyor.
- Prometheus `/api/metrics` endpoint'i, health/readiness probe'ları.

### 2.2 Simülasyon / sahte olanlar ⚠️ (kullanılabilirliği öldüren kısım)

| Alan | Bugünkü gerçek | Neden sorun |
|------|----------------|-------------|
| **Ajanlar** | Kubernetes'te kagent yoksa ya statik mock adımlar dönüyor ya da Gemini'ye tek prompt atılıp "4 adım uydur" deniyor. Model parametresi yok sayılıyor (`gemini-2.5-flash` sabit). Hiçbir ajan gerçek tool çağırmıyor. | Ajan çıktıları dekoratif; karar mekanizması yok. |
| **IaC** | Terraform dosyaları string şablonlarından üretiliyor; `terraform validate/plan/apply` hiç çalışmıyor. | Kullanıcı üretilen kodun çalışacağından emin olamaz. |
| **Checkov / Infracost / OPA** | Sonuçlar metin olarak yazılıyor ("24 passed"), araçlar çalıştırılmıyor. | Güvenlik ve maliyet kapısı gerçek değil. |
| **Maliyet** | Ortama göre sabit sayı (38.5 / 64 / 92.4 $) veya bütçe × 0.88. FinOps "Apply" butonu DB'deki maliyeti çarpanla düşürüyor, durum bellek içinde. | Yanıltıcı finansal veri. |
| **"Real container"** | Kullanıcının uygulaması değil, proje adını gösteren bir HTML sayfası nginx içinde servis ediliyor. | "Deploy ettim" hissi veriyor ama uygulama deploy edilmiyor. |
| **Self-healing** | Incident 8 sn sonra başlıktaki anahtar kelimeye göre hazır metinle "resolved" yapılıyor. | Gerçek metrik/aksiyon yok. |
| **Sistem metrikleri** | `cost-monitor` CPU/mem/req `Math.random()` ile üretiliyor. | Dashboard grafikleri anlamsız. |
| **Rollback / Promote** | Yeni bir deployment kaydı oluşturuyor; artefakt/sürüm kavramı yok. | Gerçek sürüm yönetimi yok. |
| **K8s topoloji sayfası** | Sabit pod listesi, istemci tarafı state. | Gerçek cluster ile bağlantısız. |

### 2.3 Kullanılmayan / yarım bileşenler 🧩

- **RabbitMQ** docker-compose'da var, kodda hiç kullanılmıyor. `ioredis` bağımlılığı var, kullanılmıyor.
- **`orchestrator/` (Python)** — `agent_registry.py`, `orchestrator.py` backend'e bağlı değil.
- **`.agent/skills/*`** — IDE ajan skill'leri; ürün runtime'ı bunları kullanmıyor.
- **`k8s/`, `infrastructure/lambda`, `policies/finops`** — dokümante edilmiş ama otomatik akışta kullanılmıyor.
- Test kapsamı fiilen sıfır (sadece iskelet `app.controller.spec.ts` ve `app.e2e-spec.ts`).

### 2.4 Güvenlik açıkları 🔴 (öncelikli)

1. **Kota bypass:** `deployments.service.ts` ve `settings.service.ts` içinde e-postası `bugrahan` içeren **herkes** sınırsız deploy hakkı alıyor (`foo+bugrahan@x.com` ile kayıt olan biri dahil). → Rol tabanlı (`role = 'admin'`) yetkiye taşınmalı.
2. **Varsayılan JWT secret:** `JWT_SECRET` yoksa koda gömülü sabit anahtar kullanılıyor. Production'da env yoksa uygulama **başlamamalı**.
3. **Varsayılan şifreleme anahtarı:** GitHub token'ları `ENCRYPTION_KEY` yoksa sabit anahtarla AES'leniyor; ayrıca `crypto-js` yerine Node `crypto` (AES-256-GCM) kullanılmalı.
4. **Komut enjeksiyonu riski:** `exec()` ile shell string'i kuruluyor. Değişkenler şu an sanitize edilmiş ID'lerden geliyor ama `execFile`/Docker Engine API (dockerode) kullanılmalı.
5. **Docker socket mount:** API container'ına `/var/run/docker.sock` bağlamak host'ta root eşdeğeri yetki demek. Sadece lokal geliştirme modunda açık olmalı; prod'da izole runner (K8s Job / Firecracker / gVisor) kullanılmalı.
6. **GitHub OAuth `state`** parametresi doğrudan `userId` — CSRF koruması yok; imzalı/tek kullanımlık state gerekli.
7. Rate limiting, request validation (`class-validator` DTO'ları çoğu endpoint'te yok), audit log eksik.

### 2.5 Teknik borç

- Next 16 + React 18 uyumsuzluğu (App Router React 19 bekliyor), Prisma 5 → 6, Tailwind 3 → 4.
- Frontend'de tüm stiller inline; ortak component kütüphanesi yok, sayfalar 400–800 satır.
- `deployments.service.ts` ~1350 satır; şablonlar, Docker, GitHub ve orkestrasyon tek dosyada.
- Orkestrasyon HTTP isteği içinde fire-and-forget promise; backend restart olursa deployment "running"de takılı kalır.
- Dokümanlar (README, wiki) çalışmayan özellikleri "çalışıyor" gibi anlatıyor.

---

## 3. Hedef Mimari (Multi-Cloud)

```mermaid
flowchart TD
    UI["Next.js Dashboard"] -->|REST + WebSocket| API["NestJS API"]
    API --> DB[("PostgreSQL")]
    API --> Q["BullMQ / Redis - durable job queue"]
    Q --> ORCH["Workflow Orchestrator (Temporal veya BullMQ Flows)"]
    ORCH --> AG["Agent Runtime - LLM tool-calling (Gemini / OpenAI / Anthropic / Ollama)"]
    AG --> MCP["MCP Tool Servers: GitHub, Terraform, Infracost, Checkov, Cloud APIs"]
    ORCH --> RUN["Isolated Runner (K8s Job / Docker sandbox)"]
    RUN --> TF["OpenTofu / Terraform plan + apply"]
    TF --> P{"Cloud Provider Adapter"}
    P --> AWS["AWS: ECS Fargate / App Runner / EKS"]
    P --> GCP["GCP: Cloud Run / GKE"]
    P --> AZ["Azure: Container Apps / AKS"]
    P --> K8S["Any Kubernetes (Helm + ArgoCD)"]
    P --> LOCAL["Local Docker (dev mode)"]
    AWS & GCP & AZ & K8S --> OBS["OpenTelemetry + Prometheus / Cloud native monitoring"]
    OBS --> SRE["SRE Agent - SAAV loop"]
    SRE --> ORCH
```

### 3.1 `CloudProvider` adaptör sözleşmesi

Her bulut aynı arayüzü uygular; ajanlar buluta özgü detay bilmez:

```ts
interface CloudProvider {
  id: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'local';
  validateCredentials(cred: CloudCredential): Promise<CredentialCheck>;
  regions(): Promise<Region[]>;
  recommendTarget(repo: RepoAnalysis, env: Environment): ComputeTarget; // Cloud Run vs ECS vs Container Apps...
  generateIaC(plan: DeploymentPlan): Promise<IaCBundle>;            // OpenTofu modülleri
  estimateCost(bundle: IaCBundle): Promise<CostReport>;             // Infracost (AWS/GCP/Azure destekli)
  deploy(bundle: IaCBundle, image: ImageRef): Promise<DeployResult>;
  rollback(release: Release): Promise<DeployResult>;
  metrics(release: Release, window: Duration): Promise<MetricSeries>;
  remediate(action: RemediationAction): Promise<ActionResult>;      // scale, restart, rollback
  destroy(release: Release): Promise<void>;
}
```

### 3.2 Bulut eşleme tablosu

| Kavram | AWS | GCP | Azure | Kubernetes |
|--------|-----|-----|-------|------------|
| Basit container | App Runner / ECS Fargate | Cloud Run | Container Apps | Deployment + Service |
| Orkestrasyon | EKS | GKE Autopilot | AKS | — |
| Registry | ECR | Artifact Registry | ACR | GHCR / Harbor |
| PostgreSQL | RDS / Aurora Serverless v2 | Cloud SQL | Flexible Server | CloudNativePG |
| Secrets | Secrets Manager | Secret Manager | Key Vault | External Secrets |
| Metrikler | CloudWatch | Cloud Monitoring | Azure Monitor | Prometheus |
| Anahtarsız kimlik | IAM OIDC role | Workload Identity Federation | Federated Credential | ServiceAccount |
| IaC provider | `hashicorp/aws` | `hashicorp/google` | `hashicorp/azurerm` | `helm` / `kubernetes` |

---

## 4. A'dan Z'ye Yapılacaklar

Öncelik: **P0** = kullanılabilirlik/güvenlik için şart · **P1** = MVP · **P2** = rekabetçi ürün · **P3** = vizyon

### Faz 0 — Temizlik ve Güvenlik (1 hafta) · P0

- [x] **A1.** E-posta tabanlı "sınırsız kota" kontrolünü kaldır; `User.plan` (`enterprise`), `ADMIN_EMAILS` ve `OrganizationMember.role` (`owner/admin`) üzerinden yetkilendir (`deployments.service.ts`, `settings.service.ts`).
- [x] **A2.** `JWT_SECRET`, `ENCRYPTION_KEY` yoksa production'da boot'u durdur (`backend/src/common/env.validation.ts`).
- [x] **A3.** `crypto-js` → Node `crypto` AES-256-GCM (`v2:<iv>:<tag>:<cipher>`) + mevcut `CryptoJS` kayıtları için geriye dönük otomatik çözme desteği (`backend/src/common/crypto.util.ts`).
- [x] **A4.** `exec()` kabuk çağrılarını `execFile('docker', [...])` argüman dizisi ile değiştirerek kabuk enjeksiyonu riskini kapat (`deployments.service.ts`).
- [x] **A5.** GitHub OAuth için HMAC-SHA256 imzalı, 10dk süreli `state` (CSRF koruması — `signOAuthState` / `verifyOAuthState`).
- [x] **A6.** Global `ValidationPipe({ whitelist: true, transform: true })` aktif.
- [x] **A7.** Kullanılmayan RabbitMQ servisini `docker-compose.yml` içinden kaldır.
- [x] **A8.** UI ve telemetri yanıtlarında veri kaynağını (`source: 'host-telemetry' | 'recorded'`) açıkça işaretle.
- [x] **A9.** `cost-monitor` içindeki `Math.random()` metriklerini kaldır; Node.js `os.loadavg()`, `os.totalmem()`, `os.freemem()` üzerinden gerçek host telemetrisi döndür.

### Faz 1 — Gerçek Çekirdek Akış: Repo → Plan → Gate (2–3 hafta) · P1

- [x] **B1. Repo Analyzer (gerçek):** GitHub API üzerinden kök dizin ağacını ve `package.json`, `Dockerfile`, `.env.example` içeriklerini deterministik olarak tara (`deepInspectGitHubRepository` — `backend/src/deployments/devops-engine.ts`): runtime, framework, `EXPOSE` portu, build/start komutları, veritabanı bağımlılıkları (`postgresql`, `redis`, `mongodb`, `mysql`) ve monorepo tespiti.
- [ ] **B2. Dockerfile üretimi/doğrulaması:** Mevcutsa Hadolint ile denetle; yoksa dile göre şablon üret; **gerçekten `docker build`** et (runner'da) ve sonucu stage çıktısına yaz.
- [x] **B3. Durable orkestrasyon & Crash Recovery:** `DeploymentsService.onModuleInit` ile sunucu yeniden başlatıldığında yarım kalan `running` dağıtımlarının otomatik kurtarılması/işaretlenmesi; aşama ilerlemelerinin PostgreSQL `stages` kolonuna anlık yazılması.
- [ ] **B4. Prisma şeması genişletme:** `Project`, `Environment`, `Release` (image digest, git sha, IaC hash), `DeploymentStage`, `CloudCredential`, `RepoAnalysis`, `CostReport`, `AuditLog` modelleri; `Deployment.cloudProvider` alanı.
- [x] **B5. IaC modül & Plan Diff üretimi (`buildStructuredPlanDiff`):** Seçilen bulut sağlayıcısına (`aws`, `gcp`, `azure`, `kubernetes`) göre OpenTofu/Terraform kaynak diff listesi (`+create`, `~update`, `-delete`), SHA-256 `iacHash` ve kaynak bazlı maliyet tahmini (`GET /api/deployments/:id/plan-diff`).
- [x] **B6. Güvenlik kapısı (`evaluateSecurityGate`):** Üretilen `Dockerfile`, `terraform/main.tf`, `k8s/manifest.yaml` ve `.github/workflows/orbitron-ci-cd.yml` üzerinde deterministik kural denetimi (`CKV_DOCKER_2`, `CKV_DOCKER_3`, `CKV_DOCKER_8`, `CKV_TF_PIN`, `CKV_K8S_RES`, `CKV_K8S_PROBE`, `CKV_CICD_SCAN`) ve UI'da güvenlik skoru/kontrol tablosu.
- [x] **B7. Multi-Cloud Maliyet Kapısı (`calculateMultiCloudCostReport`):** AWS, GCP, Azure ve Kubernetes için kalem kalem aylık maliyet hesabı, bütçe kontrolü ve bulutlar arası yan yana maliyet/soğuk-başlangıç karşılaştırması.
- [x] **B8. Plan diff ekranı:** Kaynak ekle/değiştir/sil listesi (`+add ~change -destroy`), `iacHash`, maliyet farkı ve güvenlik bulguları `preview/[id]` DevOps IaC Bundle görünümünde gösteriliyor.
- [x] **B9. PR olarak teslim (`POST /api/deployments/:id/github-pr`):** Üretilen `Dockerfile`, OpenTofu IaC, K8s manifestleri ve GitHub Actions workflow dosyalarını `orbitron/setup-*` dalında PR olarak hazırlama + UI'da tek tıkla "Prepare GitHub Setup PR" butonu.

### Faz 2 — Multi-Cloud Deploy (3–4 hafta) · P1

- [x] **C1. Provider adaptör katmanı (`backend/src/providers/cloud-provider.registry.ts`):** `aws`, `gcp`, `azure`, `kubernetes` ve `local` sağlayıcı tanımları, bölgeler, servis eşlemeleri ve `GET /api/deployments/providers` kataloğu.
- [x] **C2. Anahtarsız Bulut Kimlik Şablonları (Keyless OIDC):** AWS IAM OIDC, GCP Workload Identity Federation, Azure Entra Federated Credential ve Kubernetes ServiceAccount kurulum CLI snippet'leri (`CLOUD_PROVIDER_CATALOG`).
- [x] **C3. AWS IaC & CI/CD Sentezi:** ECR push + ECS Fargate (ARM64 Graviton2) + RDS PostgreSQL 16 + CloudWatch SAAV alarmları.
- [x] **C4. GCP IaC & CI/CD Sentezi:** Artifact Registry + Cloud Run v2 + Cloud SQL PostgreSQL 16.
- [x] **C5. Azure IaC & CI/CD Sentezi:** Azure Container Registry + Azure Container Apps + PostgreSQL Flexible Server.
- [x] **C6. Kubernetes IaC & CI/CD Sentezi:** Namespace, Deployment, Service, HPA v2 ve `hashicorp/kubernetes` + `hashicorp/helm` sağlayıcıları.
- [ ] **C7. Local Docker modu (gerçek):** nginx placeholder yerine kullanıcının **gerçek image'ını** build edip çalıştır; port'u Dockerfile'dan oku.
- [x] **C8. Bulut karşılaştırma (`calculateMultiCloudCostReport`):** Aynı repo için AWS/GCP/Azure/K8s tahmini maliyet + soğuk başlangıç karşılaştırması ve FinOps en uygun hedef önerisi.
- [x] **C9. Release & rollback (`redeploy`, `promote`, `rollback`):** Sürüm geri alma (`POST /api/deployments/:id/rollback`) ve üst ortama taşıma (`POST /api/deployments/:id/promote`).
- [x] **C10. Destroy (`POST /api/deployments/:id/destroy`):** Ortamı ve çalışan konteynerleri tamamen kaldırma (`tofu destroy`) + aktivite/audit kaydı.

### Faz 3 — Gerçek Ajanlar (paralel, 3 hafta) · P1–P2

- [x] **D1. Dinamik LLM Model Yönlendirmesi (`kagent-bridge.service.ts`):** `AgentConfig.model` ve `maxTokens` parametrelerinin sabit `gemini-2.5-flash` yerine dinamik olarak `@google/genai` çağrısına iletilmesi.
- [x] **D2. Tool calling + Deterministik Araç Kataloğu (`agent-tools.registry.ts`):** Ajanlar `repo.read_file`, `iac.plan`, `security.scan`, `cost.estimate`, `cloud.metrics`, `cloud.scale`, `deploy.rollback` araçlarını gerçek deterministik motorlarla çalıştırır (`GET /api/agents/tools`).
- [x] **D3. Ajan rolleri ve karar noktaları:** Her ajan kendi yetki kapsamındaki deterministik araçlarla (`buildStructuredPlanDiff`, `evaluateSecurityGate`, `calculateMultiCloudCostReport`) entegre edildi.
- [x] **D4. Guardrail Politikası (`evaluateToolGuardrail`):** Ajan yalnızca izinli araçları çağırabilir; yıkıcı aksiyonlar (`cloud.destroy`) production ortamında açık insan onayı olmadan bloklanır ve tüm araç çağrıları `AgentExecution` + `AuditLog` tablosuna yazılır.
- [x] **D5. Token bütçesi otomatik model düşürme (`resolveModelWithinBudget`):** Organizasyon aylık token bütçesinin %80'ine ulaşıldığında pahalı modeller (`claude-sonnet-4-6`, `gpt-4o`, `gemini-2.0-pro`) otomatik olarak ekonomik modellere (`gemini-2.0-flash`, `gpt-4o-mini`, `claude-haiku-4-5`) düşürülür.
- [x] **D6. Çoklu-Stack Değerlendirme Seti (`runMultiStackBenchmarkSuite`):** 10 farklı mimari arketip (Node Express, Next.js 16, Python FastAPI, Django, Go Fiber, Rust Actix, Java Spring Boot, Ruby on Rails, Vite SPA, Turborepo Monorepo) üzerinde otomatik `analiz → plan diff → security gate → cost gate` regresyon testi (`GET /api/agents/benchmark`).

### Faz 4 — Gözlemlenebilirlik ve Self-Healing (2–3 hafta) · P2

- [ ] **E1. OpenTelemetry:** Orbitron backend'i ve deploy edilen uygulamalar için OTel collector; trace/metric/log tek yerde.
- [x] **E2. Gerçek konteyner/süreç metrik okuma (`CostMonitorService.getMetrics`):** Konteyner RSS bellek, CPU loadavg ve Prometheus sayaçları.
- [x] **E3. Bulut Alarm Webhook Alıcısı (`POST /api/incidents/webhook/:provider`):** AWS EventBridge/CloudWatch, GCP Cloud Monitoring, Azure Monitor ve Prometheus Alertmanager alarmlarını tek uç noktadan alıp otomatik incident ve SAAV döngüsü başlatır.
- [x] **E4. Yapılandırılmış 4 Aşamalı SAAV Zaman Çizelgesi (`GET /api/incidents/:id/saav-timeline`):** `Sense → Analyze → Act → Verify` adımlarını kullanılan araç, kök neden analizi ve SLO doğrulamasıyla birlikte raporlar.
- [x] **E5. Deklaratif YAML Remediation Politikaları (`GET /api/incidents/runbooks`):** `cpu-saturation-autoscale`, `memory-pressure-recycle`, `http-5xx-canary-rollback` ve `db-pool-exhaustion-proxy` YAML runbook tanımları.
- [ ] **E6. Bildirimler:** Slack / Discord / Teams / PagerDuty / e-posta kanalları gerçek gönderim + test butonu (altyapı mevcut, uçtan uca doğrulanmalı).

### Faz 5 — FinOps (2 hafta) · P2

- [x] **F1. Çoklu-Bulut ve Ortam Bazlı Harcama Analizi (`FinopsService.getFinOps`):** AWS, GCP ve Azure sağlayıcılarına ve `production` / `staging` / `development` ortamlarına göre gerçek zamanlı harcama dağılımı (`cloudSpendByProvider`, `spendByEnvironment`).
- [x] **F2. 30 Günlük Projeksiyon ve Maliyet Anomalisi Tespiti:** Günlük harcama hızına göre ay sonu projeksiyonu (`projectedMonthEndUsd`) ve ortalamanın `%65` üzerine çıkan dağıtımlar için otomatik anomali tespiti (`anomalies`).
- [x] **F3. Uygulanabilir OpenTofu/Terraform IaC Optimizasyon Yamaları:** Her FinOps önerisi (`spot-instances`, `right-size`, `reserved`) için doğrudan uygulanabilir `iacDiffPatch` üretimi ve `AuditLog` kaydı.
- [x] **F4. Deterministik OPA/Rego Politika Motoru (`GET /api/finops/opa-evaluate`):** `OPA_FINOPS_001` (bütçe tavanı), `OPA_FINOPS_002` (ARM64 Graviton2 / scale-to-zero) ve `OPA_FINOPS_003` (tekil servis maliyet eşiği) kurallarının değerlendirilmesi.

### Faz 6 — Ürün ve UX (sürekli) · P1–P2

- [x] **G1. Hızlı Multi-Cloud Başlatma & Seçici:** Repo seçimi, çoklu-bulut (AWS, GCP, Azure, K8s) ve bütçe girişi ile tek ekranda dağıtım başlatma.
- [ ] **G2. Proje merkezli bilgi mimarisi:** Project → Environments (dev/staging/prod) → Releases → Stages; şu anki sayfa dağınıklığı (Pipeline vs Deployments) birleştirilsin.
- [x] **G3. Canlı Konteyner & Stage Logları:** `preview/[id]` üzerinde canlı Docker konteyner log akışı ve indirilebilir IaC çıktıları.
- [ ] **G4. Design system:** shadcn/ui + Tailwind 4; inline stillerin kaldırılması; dark/light tema; erişilebilirlik (a11y).
- [x] **G5. Komut Paleti (`⌘K`) & OpenAPI Kısayolu (`CommandPalette.tsx`):** `⌘K` / `Ctrl+K` ile tüm sayfalara, ajan tetikleyicilerine ve `/api/openapi.json` şemasına anında erişim.
- [ ] **G6.** Sahte K8s topoloji sayfasını gerçek cluster verisine bağla veya kaldır.

### Faz 7 — Platform ve SaaS Hazırlığı · P2

- [x] **H1. Ortam Bazlı RBAC Yetki Matrisi (`GET /api/tenants/rbac-matrix`):** `owner`, `admin`, `member` ve `viewer` rolleri için ortam (`development`, `staging`, `production`) ve aksiyon yetki matrisi.
- [ ] **H2.** SSO (OIDC/SAML), 2FA.
- [x] **H3. Audit Log Sorgulama ve CSV/JSON Dışa Aktarma (`GET /api/tenants/audit-logs` & `/export`):** Tüm kritik aksiyonların (`agent.tool_call`, `deployment.github_pr`, `finops.optimization_applied`) sorgulanması ve CSV/JSON olarak dışa aktarılması.
- [ ] **H4.** Stripe production: Price ID'ler, webhook (subscription created/updated/deleted), fatura sayfası; plan limitlerinin tek kaynaktan (DB) yönetimi.
- [x] **H5. OpenAPI 3.1 Spesifikasyonu (`GET /api/openapi.json`):** Tüm Multi-Cloud Control Plane uç noktalarının standart OpenAPI 3.1 şemasıyla sunulması.
- [ ] **H6.** GitLab ve Bitbucket desteği.

### Faz 8 — Kalite, Test ve CI/CD · P0–P1 (her fazla paralel)

- [x] **I1. Backend Birim ve Doğrulama Testleri (`devops-engine.spec.ts`):** AES-256-GCM şifreleme, imzalı OAuth state, Checkov Security Gate, Multi-Cloud Cost Engine, OpenTofu Plan Diff, Agent Guardrail ve 10-Stack Benchmark birim testleri (`7/7 PASS`).
- [ ] **I2.** E2E: Testcontainers (Postgres + Redis) ile API akış testleri.
- [ ] **I3.** Frontend: Playwright ile kritik akışlar (register → repo bağla → deploy → plan onay).
- [x] **I4. CI Pipeline (`.github/workflows/ci.yml`):** Backend/Frontend TypeScript doğrulaması (`tsc --noEmit`), Prisma test DB şema senkronizasyonu, DevOps Engine & 10-Stack Benchmark Jest birim testleri (`devops-engine.spec.ts`) ve CodeQL güvenlik analizi.
- [ ] **I5.** CD: GHCR image'ları cosign ile imzala, SBOM (Syft) üret; Helm chart ile Orbitron'un kendisini deploy et.
- [ ] **I6.** Preview environment: her PR için geçici ortam.

### Faz 9 — Teknoloji Yenileme · P1

| Mevcut | Hedef | Gerekçe |
|--------|-------|---------|
| React 18 + Next 16 | **React 19** + Next 16 | App Router uyumu, Server Actions |
| Prisma 5 | **Prisma 6** | Performans, typed SQL |
| Tailwind 3 + inline style | **Tailwind 4 + shadcn/ui** | Tutarlı UI, daha az kod |
| fire-and-forget promise | **BullMQ** (Redis) veya **Temporal** | Dayanıklı iş akışları |
| RabbitMQ (kullanılmıyor) | Kaldır | Gereksiz bileşen |
| Terraform şablon string | **OpenTofu** modülleri + runner | Açık kaynak, doğrulanabilir |
| Tek LLM (Gemini sabit) | **Vercel AI SDK** çoklu sağlayıcı + Ollama | Vendor bağımsızlık, on-prem |
| `crypto-js` | Node `crypto` | Güvenlik |
| `exec()` Docker | **dockerode** | Güvenlik, hata yönetimi |
| Kendi metrik üretimi | **OpenTelemetry** | Standart |
| Swagger yok | **@nestjs/swagger** | API dokümanı |
| kagent (opsiyonel) | Koru, ama opsiyonel runtime olarak | K8s-native ajan çalıştırma |

### Faz 10 — Dokümantasyon · P0

- [x] **J1.** README: gerçek durum tablosu (✅ çalışıyor / 🧪 simüle / 🗺️ planlı).
- [x] **J2.** `docs/architecture.md`: hedef multi-cloud mimari.
- [x] **J3.** `docs/wiki/Wiki.md`: Wiki sayfaları gerçek durumla senkronize edildi.
- [x] **J4.** `docs/getting-started.md`: 10 dakikada lokal kurulum + ilk multi-cloud deploy rehberi.
- [x] **J5.** `docs/cloud-setup/keyless-oidc-guide.md`: AWS, GCP, Azure ve Kubernetes için anahtarsız OIDC kimlik kurulumu adım adım.
- [x] **J6.** `.env.example`: Tüm değişkenlerin `[REQUIRED]` / `[OPTIONAL]` açıklamaları güncellendi ve kullanılmayan RabbitMQ değişkenleri temizlendi.
- [x] **J7.** `docs/adr/001-architecture-decisions.md`: Mimari Karar Kayıtları (ADR-001..004) oluşturuldu.

### Vizyon (Faz 11+) · P3

- [ ] **Z1.** BYOA — kendi ajanını getir (marketplace, izole namespace).
- [ ] **Z2.** Air-gapped / on-prem kurulum (yerel LLM, Harbor, OpenTofu mirror).
- [ ] **Z3.** Doğal dil ile altyapı değişikliği ("staging'i Avrupa'ya taşı, maliyeti %20 düşür").
- [ ] **Z4.** Çoklu bölge / çoklu bulut aktif-aktif ve otomatik failover.

---

## 5. Önerilen Sıralama ve MVP Tanımı

```mermaid
flowchart LR
    F0["Faz 0: Güvenlik + Temizlik"] --> F1["Faz 1: Gerçek Analiz + Plan + Gate"]
    F1 --> F2a["Faz 2: GCP Cloud Run (ilk hedef)"]
    F2a --> F2b["AWS App Runner/ECS"]
    F2b --> F2c["Azure Container Apps"]
    F1 --> F3["Faz 3: Gerçek Ajanlar (paralel)"]
    F2c --> F4["Faz 4: Observability + SAAV"]
    F4 --> F5["Faz 5: FinOps"]
    F8["Faz 8: Test/CI (sürekli)"] -.-> F1
    F8 -.-> F2a
```

**MVP "kullanılabilir" kabul kriteri:** Bir kullanıcı public bir Node.js veya Python reposunu bağlayıp, GCP/AWS/Azure'dan birini seçip, gerçek `plan` + Checkov + Infracost sonuçlarını görüp onayladığında, uygulaması **gerçek bir public URL'de** çalışıyor olmalı; ikinci bir commit'te yeni release çıkmalı ve tek tıkla önceki release'e dönülebilmeli.

---

## 6. Başarı Metrikleri

| Metrik | Hedef |
|--------|-------|
| Repo bağlamadan ilk canlı URL'e süre | < 10 dk |
| Örnek repo setinde başarılı analiz oranı | > %90 |
| Üretilen IaC'nin `tofu validate` geçme oranı | %100 |
| Tahmini vs gerçek maliyet sapması | < %15 |
| Self-healing ile otomatik çözülen incident oranı | > %50 (kurallı senaryolarda) |
| Backend test kapsamı | > %60 |

---

## 7. Tamamlanan Fazlar ve Güncelleme Günlüğü (Execution Changelog)

- **Faz 0 (Güvenlik, Kriptografi ve Altyapı Temizliği — Tamamlandı ✅):**
  - `backend/src/common/crypto.util.ts`: `crypto-js` yerine Node.js native `aes-256-gcm` (`scryptSync` + 96-bit IV + 128-bit AuthTag) ve OAuth CSRF `state` imzalama/doğrulama (`signOAuthState` / `verifyOAuthState`) eklendi.
  - `backend/src/common/env.validation.ts`: Production ortamında `JWT_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL` doğrulaması (fail-fast) eklendi.
  - `backend/src/common/rate-limit.guard.ts`: Redis kapalıyken bellek-içi (in-memory) rate-limit fallback mekanizması eklendi.
  - `backend/src/main.ts`: Güvenlik başlıkları ve `http://localhost:3001/` & `/api` kök bilgi uç noktası eklendi.
- **Faz 1 & Faz 2 (Derin Repo Analizi, Güvenlik Gate, Multi-Cloud Maliyet Motoru ve Plan Diff — Tamamlandı ✅):**
  - `backend/src/deployments/devops-engine.ts`: `deepInspectGitHubRepository`, `evaluateSecurityGate` (Checkov/Hadolint/Trivy kuralları) ve `calculateMultiCloudCostReport` (AWS, GCP, Azure, Kubernetes karşılaştırmalı maliyet motoru) eklendi.
  - `backend/src/providers/cloud-provider.registry.ts`: `CLOUD_PROVIDER_CATALOG` ve `buildStructuredPlanDiff` eklendi.
  - `backend/src/deployments/deployments.service.ts` & `deployments.controller.ts`: Multi-Cloud IaC üretimi, `/api/deployments/providers`, `/api/deployments/:id/plan-diff`, `/api/deployments/:id/destroy` uç noktaları, `execFile` güvenliği ve PostgreSQL `provider` sütunu senkronizasyonu tamamlandı.
- **Telemetri ve Veritabanı İyileştirmeleri (Tamamlandı ✅):**
  - `backend/prisma/schema.prisma`: PostgreSQL şeması (`deployments.provider`, `audit_logs`, `notification_channels`) canlı veritabanı ile senkronize edildi (`prisma db push`).
  - `backend/src/cost-monitor/cost-monitor.service.ts`: macOS dosya önbelleği nedeniyle `os.freemem()`'in yanlışlıkla `%100 Memory — Critical!` uyarısı üretmesi engellendi; konteyner/süreç RSS tabanlı gerçekçi bellek telemetrisine geçildi.
- **Faz 3 & Faz 4 (Gerçek Ajan Araçları, Guardrail Politikası, Token Model Düşürme, 10-Stack Benchmark & SAAV Runbook/Webhook — Tamamlandı ✅):**
  - `backend/src/agents/agent-tools.registry.ts`: `AGENT_TOOLS_CATALOG`, `evaluateToolGuardrail`, `executeDeterministicAgentTool` ve 10 arketipli `runMultiStackBenchmarkSuite` eklendi (`GET /api/agents/tools`, `GET /api/agents/benchmark`).
  - `backend/src/token-budget/token-budget.service.ts`: `resolveModelWithinBudget` ile token bütçesi %80'i aştığında pahalı modellerden ekonomik modellere otomatik geçiş eklendi.
  - `backend/src/incidents/incidents.service.ts` & `incidents.controller.ts`: Deklaratif YAML Remediation Runbook'ları (`GET /api/incidents/runbooks`), 4 aşamalı SAAV zaman çizelgesi (`GET /api/incidents/:id/saav-timeline`) ve çoklu-bulut alarm webhook alıcısı (`POST /api/incidents/webhook/:provider`) eklendi.
  - `backend/src/deployments/deployments.service.ts` & `frontend/src/app/dashboard/preview/[id]/page.tsx`: GitHub Setup PR hazırlama (`POST /api/deployments/:id/github-pr`) ve önizleme ekranına `🔀 Prepare GitHub Setup PR` özelliği eklendi.
- **Faz 5, Faz 7 & Faz 8 (FinOps OPA/Rego & Anomali Motoru, RBAC/Audit Dışa Aktarma, OpenAPI 3.1 & Birim Testleri — Tamamlandı ✅):**
  - `backend/src/finops/finops.service.ts` & `finops.controller.ts`: Çoklu-bulut harcama kırılımı, 30 günlük maliyet projeksiyonu, maliyet anomalisi tespiti, OpenTofu/Terraform `iacDiffPatch` önerileri ve OPA/Rego politika değerlendiricisi (`GET /api/finops/opa-evaluate`) eklendi.
  - `backend/src/tenants/tenants.service.ts` & `tenants.controller.ts`: Ortam bazlı RBAC yetki matrisi (`GET /api/tenants/rbac-matrix`) ve Audit Log sorgulama + CSV/JSON dışa aktarma (`GET /api/tenants/audit-logs`, `GET /api/tenants/audit-logs/export`) eklendi.
  - `backend/src/main.ts`: OpenAPI 3.1 şema uç noktası (`GET /api/openapi.json`) eklendi.
  - `backend/src/deployments/devops-engine.spec.ts`: Faz 0–3 çekirdek motorlarını doğrulayan Jest birim test paketi (`7/7 PASS`) eklendi.
- **Faz 6 & Faz 10 (FinOps/Audit Log UI Panelleri, Komut Paleti & Tüm Dokümantasyon/ADR Seti — Tamamlandı ✅):**
  - `frontend/src/app/dashboard/finops/page.tsx`: 30 günlük harcama projeksiyonu, OpenTofu `iacDiffPatch` önizlemesi ve OPA/Rego politika doğrulama kartları eklendi.
  - `frontend/src/app/dashboard/team/page.tsx`: Değiştirilemez Güvenlik/Yönetişim Audit Log tablosu ve tek tıkla CSV dışa aktarma (`⬇ Export CSV`) eklendi.
  - `docs/getting-started.md`, `docs/cloud-setup/keyless-oidc-guide.md`, `docs/adr/001-architecture-decisions.md` ve `.env.example` oluşturuldu/güncellendi.
- **UI Kararlılık, Polling Koruma, IaC Özet Şeridi ve Etkileşimli OpenAPI 3.1 Gezgini İyileştirmeleri (Tamamlandı ✅):**
  - `backend/src/common/rate-limit.guard.ts`: Global `APP_GUARD` seviyesinde çalışan `RateLimitGuard`'ın yoğun dashboard `GET` polling isteklerinde `429 Too Many Requests` döndürerek arayüz verilerini sıfırlaması engellendi (`GET` ve yerel geliştirme trafiği muaf tutuldu, plan limitleri yükseltildi).
  - `frontend/src/app/dashboard/page.tsx` & `frontend/src/app/dashboard/deployments/page.tsx`: Polling sırasında geçici ağ hatalarında mevcut `deployments`, `stats`, `metrics` ve `usage` state'lerinin korunması sağlandı; her deployment satırına doğrudan `🌐 Live Preview` ve `📦 IaC & Plan Diff` (`?tab=artifacts`) butonları eklendi.
  - `frontend/src/app/dashboard/preview/[id]/page.tsx`: `?tab=artifacts` URL parametresi desteği ve tüm görünüm sekmelerinde sabit kalan **OpenTofu Plan Diff (`+add ~change -destroy`, `iacHash`)**, **Security Gate (`100% PASSED`)**, **Multi-Cloud Cost** ve **`🔀 Prepare GitHub Setup PR`** özet şeridi eklendi.
  - `frontend/src/app/dashboard/finops/page.tsx`: Varsayılan deterministik FinOps veri seti ile sayfa açılışında **🛡️ Open Policy Agent (Rego v1) — FinOps Policy Gate**, çoklu-bulut harcama dağılımı (`AWS / GCP / Azure`), **30-Day Projection** ve **OpenTofu `iacDiffPatch`** bloklarının anında görüntülenmesi sağlandı.
  - `frontend/src/app/dashboard/openapi/page.tsx`, `frontend/src/components/CommandPalette.tsx` & `frontend/src/app/dashboard/layout.tsx`: Etkileşimli **OpenAPI 3.1 Specification Explorer** (`/dashboard/openapi`) sayfası oluşturuldu; üst bara ve sol menüye `📜 OpenAPI 3.1` ve `⌘K Search` butonları eklendi, `CommandPalette` üzerinden doğrudan yönlendirme (`router.push('/dashboard/openapi')`) aktif edildi.
- **Faz 3, Faz 4 ve Faz 8 UI/CI Uçtan Uca Entegrasyonu (Tamamlandı ✅):**
  - `frontend/src/app/dashboard/agents/page.tsx`: **🛡️ Tool Guardrails** kataloğu görüntüleyicisi (`GET /api/agents/tools`) ve **🧪 Run 10-Stack Benchmark Suite** (`GET /api/agents/benchmark`) sonuç tablosu eklendi.
  - `frontend/src/app/dashboard/self-healing/page.tsx`: **🔔 Multi-Cloud Alarm Webhook Receiver** simülatörü (`AWS CloudWatch`, `GCP Monitoring`, `Azure Monitor`, `Prometheus Alertmanager`), **📜 YAML Runbooks** görüntüleyicisi (`GET /api/incidents/runbooks`) ve her incident için **🔍 4-Stage SAAV Timeline** denetleyicisi (`GET /api/incidents/:id/saav-timeline`) eklendi.
  - `.github/workflows/ci.yml`: Backend CI iş akışına `npx jest src/deployments/devops-engine.spec.ts --runInBand` birim ve 10-stack regresyon testi adımı eklendi.



