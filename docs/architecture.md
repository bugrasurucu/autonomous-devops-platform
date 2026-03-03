# Mimari Tasarım Raporu — Otonom DevOps ve Self-Healing Platformu

## 1. Vizyon

Proje dosyasını "sürükle-bırak" ile sisteme yükleyerek uçtan uca otonom AWS dağıtımı gerçekleştiren, dört uzman ajan ile donatılmış, self-healing yeteneklerine sahip bir DevOps platformu.

## 2. Çekirdek Mimari

### 2.1 Model Yönlendirme (Model Routing)

| Rol | Model | Sorumluluk |
|-----|-------|-----------|
| Çekirdek Akıl Yürütme | Gemini 3.1 Pro / Claude Sonnet 4.6 | Planlama, kodlama, mimari tasarım |
| Bağlam ve Arama | Gemini 2.5 Flash | Semantik arama, bağlam özetleme |
| Tarayıcı Etkileşimi | Gemini 2.5 Pro UI Checkpoint | Görsel test, form doldurma |
| Görsel Tasarım | Nano Banana Pro 2 | Mimari diyagram üretimi |

### 2.2 Artifact Tabanlı Şeffaflık

Ajan → Planlama Modu → Implementation Plan → İnsan İncelemesi → Yürütme → Walkthrough

## 3. MCP Entegrasyon Katmanı

```
┌─────────────────────────────────┐
│      Antigravity Platform       │
│    ┌─────────────────────┐      │
│    │   mcp_config.json   │      │
│    └──────────┬──────────┘      │
│               │                 │
│    ┌──────────▼──────────┐      │
│    │   MCP Sunucuları    │      │
│    ├─────────────────────┤      │
│    │ aws-cloud-control   │──────┤──→ CRUDL (1200+ kaynak)
│    │ aws-iac             │──────┤──→ CDK/CloudFormation
│    │ aws-terraform       │──────┤──→ Terraform HCL
│    │ aws-pricing         │──────┤──→ Maliyet tahmini
│    │ aws-cloudwatch      │──────┤──→ Metrik/Log/Alarm
│    │ mcpdoc-aws          │──────┤──→ llms.txt belge erişimi
│    │ mcpdoc-github       │──────┤──→ GitHub Actions belgeleri
│    └─────────────────────┘      │
└─────────────────────────────────┘
```

## 4. Çoklu Ajan Orkestrasyon Desenleri

### 4.1 Sıralı (Sequential)
```
Infra → FinOps → Pipeline → SRE
```
Her aşamanın başarısı sonrakini tetikler. Başarısızlık = zincir durur.

### 4.2 Eşzamanlı (Concurrent)
```
Olay Müdahalesi:  SRE (RCA) ║ Pipeline (Rollback Hazırlığı)
```
Hız kritik durumlarda paralel çalışma.

### 4.3 Devir Teslim (Handoff)
```
Orkestratör → [Görev analizi] → Uygun ajan
```
Anahtar kelime tabanlı dinamik yönlendirme.

### 4.4 Ortak Durum (Shared State)
```
Master Clipboard (append-only):
  project_research → {...}
  infra-agent      → {vpc_id, ecs_cluster_arn, ...}
  finops-agent     → {estimated_cost, decision, ...}
  pipeline-agent   → {pipeline_url, test_results, ...}
  sre-agent        → {dashboard_url, alarms, ...}
```

## 5. Self-Healing Döngüsü

```
Sense → Analyze → Act → Verify
  │        │        │       │
  ▼        ▼        ▼       ▼
CloudWatch  RCA   ECS/SSM  Health
Alarm     + RAG   Action   Check
  │        │        │       │
  ▼        ▼        ▼       ▼
EventBridge Bedrock  API    Slack
  → Lambda  KB      Call   Report
```

## 6. Güvenlik Katmanları

1. **IAM Minimum Ayrıcalık:** Her ajan kendi IAM rolüne sahip
2. **Terminal Allow/Deny:** Yıkıcı komutlar insan onayı gerektirir
3. **Devre Kesici:** Bütçe aşımı veya hata döngüsünde otomatik durma
4. **Bağlam İzolasyonu:** Her ajan kendi prompt'uyla çalışır
5. **Sandbox:** Workspace dışı dosya erişimi engelli
6. **Audit Trail:** Tüm eylemler CloudTrail + append-only log

## 7. Drop & Deploy İş Akışı

1. Proje klasörü açılır → `/deploy-aws` tetiklenir
2. **Auto-Bootstrap:** Repo araştırma, mimari gereksinim çıkarma
3. **Infra Agent:** Terraform modülleri üret → `terraform plan`
4. **FinOps Agent:** Maliyet analizi → Bütçe kontrolü
5. **Pipeline Agent:** CI/CD yapılandırma → İlk dağıtım
6. **SRE Agent:** Monitoring + Self-Healing kurulumu
7. Kullanıcıya rapor: URL'ler, maliyet özeti, dashboard linki
