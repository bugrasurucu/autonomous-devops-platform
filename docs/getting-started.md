# 🚀 Orbitron — 10 Dakikada Lokal Kurulum ve İlk Multi-Cloud Deploy (Getting Started)

Bu rehber, **Orbitron Multi-Cloud Autonomous DevOps Platform**'u sıfırdan yerel ortamınızda ayağa kaldırmanız ve ilk **AWS / GCP / Azure / Kubernetes** dağıtımınızı gerçekleştirmeniz için gereken adımları içerir.

---

## 1. Ön Gereksinimler

- **Node.js 20+** ve **npm**
- **Docker Desktop** (PostgreSQL 16 ve Canlı Konteyner Önizleme modu için)
- **Git**

---

## 2. Hızlı Kurulum (Adım Adım)

### Adım 1 — Depoyu Klonlayın ve Ortam Değişkenlerini Hazırlayın

```bash
git clone https://github.com/bugrasurucu/autonomous-devops-platform.git
cd autonomous-devops-platform
cp .env.example .env
cp .env.example backend/.env
```

### Adım 2 — PostgreSQL 16 ve Redis Konteynerlerini Başlatın

```bash
docker compose up -d postgres redis
```

### Adım 3 — Backend Kurulumu, Prisma Şema Senkronizasyonu ve Başlatma (`:3001`)

```bash
npm --prefix backend install
./backend/node_modules/.bin/prisma db push --schema=backend/prisma/schema.prisma
npm --prefix backend run build
node backend/dist/main.js
```

> **Doğrulama:** Tarayıcınızda `http://localhost:3001/api/health` veya `http://localhost:3001/api/openapi.json` adresini açarak Control Plane API'nin çevrimiçi olduğunu görebilirsiniz.

### Adım 4 — Frontend Web Konsolunu Başlatma (`:3000`)

Yeni bir terminal sekmesinde:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Tarayıcınızda **`http://localhost:3000`** adresine gidin ve yeni bir hesap oluşturarak **Mission Control Dashboard** ekranına giriş yapın.

---

## 3. İlk Multi-Cloud Dağıtımınızı Başlatma

1. Sol menüden **Dashboard** veya **Pipeline** sayfasına gidin (veya `⌘K` komut paletini açın).
2. **GitHub Repository** alanına public bir repo girin (ör. `vercel/next.js` veya `bugrasurucu/autonomous-devops-platform`).
3. **Target Cloud & Region** menüsünden hedef bulutu seçin:
   - **AWS:** `us-east-1` / `eu-central-1` (ECS Fargate ARM64 Graviton2 + RDS PostgreSQL 16)
   - **GCP:** `gcp-europe-west1` (Cloud Run v2 + Cloud SQL PostgreSQL 16)
   - **Azure:** `azure-westeurope` (Azure Container Apps + Flexible Server)
   - **Kubernetes:** `k8s-default` (Deployment + Service + HPA v2)
4. **Budget ($/mo)** değerini girip **🚀 Deploy** butonuna tıklayın.
5. Dağıtım tamamlandığında **Preview & DevOps IaC Bundle** ekranından:
   - Üretilen `Dockerfile`, `terraform/main.tf`, `k8s/manifest.yaml`, `.github/workflows/orbitron-ci-cd.yml` dosyalarını inceleyebilir,
   - **OpenTofu Plan Diff (`iacHash`)**, **Checkov Security Gate** ve **Multi-Cloud Maliyet Karşılaştırmasını** görebilir,
   - **🔀 Prepare GitHub Setup PR** butonuyla tüm dosyaları kendi reponuza PR olarak aktarabilirsiniz.

