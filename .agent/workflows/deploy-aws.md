---
description: AWS'ye uçtan uca otonom dağıtım — Drop and Deploy iş akışı
---

# /deploy-aws — Otonom AWS Dağıtım İş Akışı

Bu iş akışı, proje dosyasını analiz ederek AWS altyapısını otonom olarak kurar ve uygulamayı dağıtır.

// turbo-all

## Adımlar

### 1. Repo Araştırması
Auto-Bootstrap yeteneğini kullanarak proje yapısını analiz et:
```bash
bash .agent/skills/auto-bootstrap/scripts/repo-research.sh . /tmp/repo-research.json
```
Çıktıyı oku ve mimari gereksinimleri belirle.

### 2. Altyapı Kod Üretimi
Infra Agent skill'ini (`infra-agent`) yükle ve çalıştır:
- Proje gereksinimlerine göre Terraform modüllerini oluştur
- `infrastructure/terraform/` dizininde VPC, ECS, RDS modüllerini yapılandır
- `terraform.tfvars` dosyasını proje değişkenleriyle doldur

### 3. Güvenlik Taraması
```bash
cd infrastructure/terraform && terraform init && terraform validate
```
Checkov taraması (varsa):
```bash
checkov -d infrastructure/terraform/ --compact
```

### 4. Terraform Plan
```bash
cd infrastructure/terraform && terraform plan -out=tfplan
```
Plan çıktısını Artifact olarak kaydet ve kullanıcıya sun.

### 5. FinOps Maliyet Analizi
FinOps Agent skill'ini (`finops-agent`) yükle:
```bash
bash .agent/skills/finops-agent/scripts/infracost-analyze.sh infrastructure/terraform
```
- Maliyet eşikleri aşılıyorsa **DURDUR** ve kullanıcıya bildir.
- Maliyet uygunsa devam et.

### 6. Terraform Apply (İnsan Onayı)
⚠️ Bu adım ilk dağıtımda **insan onayı gerektirir**:
```bash
cd infrastructure/terraform && terraform apply tfplan
```

### 7. CI/CD Pipeline Kurulumu
Pipeline Agent skill'ini (`pipeline-agent`) yükle:
- `.github/workflows/ci-cd.yml` oluştur
- `.github/workflows/finops-gate.yml` oluştur
- Projeye uygun testleri yaz

### 8. Docker Build ve ECR Push
```bash
docker build -t app:latest .
```
ECR'ye push et (terraform çıktısından ECR URI al).

### 9. ECS Dağıtımı
```bash
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment
```

### 10. Monitoring ve Self-Healing Kurulumu
SRE Agent skill'ini (`sre-agent`) yükle:
- CloudWatch Dashboard oluştur
- Alarm kurallarını ayarla
- EventBridge + Lambda self-healing entegrasyonunu kur

### 11. Doğrulama
- Health check endpoint'ini kontrol et
- Tüm metriklerin normal olduğunu doğrula
- Dağıtım raporu (Artifact) oluştur

### 12. Raporlama
Kullanıcıya şunları raporla:
- ALB DNS adresi (uygulama URL'si)
- CloudWatch Dashboard linki
- Maliyet özeti
- Pipeline durumu
