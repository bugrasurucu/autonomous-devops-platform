---
name: auto-bootstrap
description: >
  Proje dosyası sisteme yüklendiğinde otonom başlatma süreci. Repo araştırması yapar,
  mimari gereksinimleri belirler ve diğer uzman ajanları (Infra, Pipeline, FinOps, SRE)
  sıralı/eşzamanlı olarak tetikler. "Drop and Deploy" vizyonunun ana orkestratörü.
---

# Auto-Bootstrap Skill — Otonom Proje Başlatma

## Ne Zaman Tetiklenir

Bu yetenek aşağıdaki durumlarda otomatik olarak etkinleşir:
- Kullanıcı `/deploy-aws` veya `/bootstrap` komutunu çalıştırdığında
- Yeni bir proje klasörü workspace'e eklendiğinde ve kullanıcı dağıtım istediğinde
- Orkestratör ajanın "yeni proje tespit et" komutu aldığında

## Otonom Başlatma Adımları

### Aşama 1: Repo Araştırma ve Şartlandırma (Repo Research)

1. **Dizin ağacını çıkar:**
   ```bash
   find . -type f -not -path './node_modules/*' -not -path './.git/*' | head -200
   ```

2. **Meta veri dosyalarını tara ve analiz et:**
   - `package.json` → Node.js/TypeScript projesi, bağımlılıklar
   - `requirements.txt` / `pyproject.toml` → Python projesi
   - `pom.xml` / `build.gradle` → Java projesi
   - `go.mod` → Go projesi
   - `Dockerfile` / `docker-compose.yml` → Konteyner yapılandırması
   - `.env.example` → Ortam değişkenleri gereksinimleri

3. **Mimari gereksinimleri belirle ve Master Clipboard'a kaydet:**
   ```json
   {
     "project_type": "nodejs",
     "runtime_version": "20.x",
     "framework": "express",
     "database": "mongodb",
     "has_dockerfile": true,
     "port": 3000,
     "env_vars": ["MONGO_URI", "JWT_SECRET", "PORT"],
     "test_framework": "jest",
     "estimated_resources": {
       "compute": "ECS Fargate",
       "database": "DocumentDB/MongoDB Atlas",
       "networking": "VPC + ALB",
       "storage": "S3"
     }
   }
   ```

### Aşama 2: Ajan Devri ve Orkestrasyon

Mimari gereksinimler belirlendikten sonra aşağıdaki sıralı orkestrasyon başlar:

```
┌─────────────────┐
│  Auto-Bootstrap  │
│   (Orkestratör)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Infra  │ ← Aşama 2a: VPC, ECS, RDS/DocDB Terraform kodları üret
    │  Agent  │   MCP: aws-cloud-control, aws-iac, aws-terraform
    └────┬────┘
         │
    ┌────▼────┐
    │ FinOps  │ ← Aşama 2b: Maliyet analizi ve bütçe doğrulama
    │  Agent  │   MCP: aws-pricing
    └────┬────┘
         │ (bütçe onaylandıysa devam)
         │
    ┌────▼────┐
    │Pipeline │ ← Aşama 2c: CI/CD yapılandırması ve ilk dağıtım
    │  Agent  │   GitHub Actions / CodePipeline YAML üret
    └────┬────┘
         │
    ┌────▼────┐
    │   SRE   │ ← Aşama 2d: Monitoring ve self-healing kurulumu
    │  Agent  │   MCP: aws-cloudwatch
    └─────────┘
```

### Aşama 3: Doğrulama ve Raporlama

1. **Health check:** Dağıtılan uygulamanın `/health` endpoint'ini kontrol et
2. **Artifact üret:** Dağıtım raporu, maliyet özeti, mimari diyagram
3. **Kullanıcıyı bilgilendir:** Tüm endpoint URL'lerini ve erişim bilgilerini raporla

## Hata Yönetimi

- Herhangi bir aşama 3 deneme sonrasında başarısız olursa → İnsan müdahalesi iste
- FinOps geçidi bütçe aşımı tespit ederse → Pipeline'ı durdur, kullanıcıya bildir
- Terraform apply başarısız olursa → `terraform destroy` ile temizlik yap (onay gerekli)

## Kullanılan MCP Sunucuları
- `aws-cloud-control` — Kaynak provizyonlama
- `aws-iac` — CDK/CloudFormation şablon üretimi
- `aws-terraform` — Terraform kodu üretimi
- `aws-pricing` — Maliyet tahmini
- `aws-cloudwatch` — Monitoring kurulumu
- `mcpdoc-aws` — AWS belge doğrulaması
