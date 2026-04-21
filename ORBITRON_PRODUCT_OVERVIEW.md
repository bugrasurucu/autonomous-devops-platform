# 🪐 Orbitron: Autonomous DevOps Platform

**Orbitron**, yazılım ekiplerinin altyapı yönetimi, CI/CD süreçleri, maliyet optimizasyonu ve SRE (Site Reliability Engineering) operasyonlarını insan müdahalesi olmadan gerçekleştirmesini sağlayan, yapay zeka ajanları tabanlı tam otonom bir DevOps platformudur.

*"Ship Infrastructure, Not YAML."* vizyonuyla yola çıkan platform, geleneksel "kodla altyapı yönetme" mantığını "ajana niyetini bildir, o yönetsin" mantığına evirmeyi hedefler.

---

## 🛠 Kullanılan Teknolojiler ve "Neden?" (Architecture & Tech Rationale)

Orbitron, sıradan bir web uygulamasının ötesinde, arka planda karmaşık yapay zeka ve orkestrasyon süreçlerini barındıran bir "Platform as a Service" (PaaS) girişimidir. Bu nedenle seçilen tüm teknolojiler ölçeklenebilirlik, güvenlik ve hız odaklıdır.

### 1. Orkestrasyon ve Ajan Kavramı: Kubernetes & kagent (CRD)
* **Teknoloji:** Kubernetes, Custom Resource Definitions (CRD)
* **Neden Seçildi?:** Yapay zeka ajanlarını (Infra, Pipeline, FinOps, SRE) düz bir Python/Node.js scripti olarak çalıştırmak yerel bir makinede çalışır ancak bir SaaS ürününde felakete yol açar. Ajanların birbirinin verisine erişememesi (Multi-Tenant Isolation), çöktüğünde baştan başlaması (Stateful Crash Recovery) ve iş yükü arttığında çoğalması (HPA) gerekiyordu.
* **Nasıl Kullanılıyor?:** `kagent` adında özel bir K8s objesi yarattık. Orbitron platformu Kubernetes control plane'i ile konuşur ve ajanları birer K8s Pod'u olarak ayağa kaldırır. Bu sayede hiçbir ek orkestrasyon yazılımına ihtiyaç kalmadan K8s'in gücünü arkamıza aldık.

### 2. Ajan Entegrasyonu: MCP (Model Context Protocol) Sidecarları
* **Teknoloji:** Anthropic MCP, K8s Mutating Webhooks
* **Neden Seçildi?:** Ajanlara (LLM'lere) AWS, Terraform veya GitHub yetkileri vermek güvenlik riski taşır. Ayrıca her yeni araç için ajan kodunu değiştirmek monolitik bir sistem yaratır.
* **Nasıl Kullanılıyor?:** Araçlar (AWS Pricing, GitHub API, Kubernetes Control) ajanların yanına **Sidecar Container** olarak MCP katmanı üzerinden eklenir. Ajan pod'u ayağa kalktığında yanında ona hizmet eden bağımsız araçlar olur. Bu "tak-çıkar" yetenek yönetimi sağlar.

### 3. Frontend & UI/UX: Next.js + Electric DevOps Aesthetic
* **Teknoloji:** Next.js (TypeScript), Özel CSS Sistemi
* **Neden Seçildi?:** Bir B2B / SaaS ürününün landing page'i kusursuz SEO skorlarına ve ilk yükleme hızına (SSR) ihtiyaç duyar. Pano (Dashboard) kısmı ise kompleks state yönetimleri (ajan logları, token sayacı) gerektirir. Next.js App Router ikisini birleştirir.
* **Neden Electric Cyan / Neon Green Renk Teması?:** Başlangıçtaki mor tema jenerik bir SaaS görüntüsü veriyordu. Geliştirici ve DevOps ekipleri koyu temalara (Dark Mode), terminal ekranlarına, Kubernetes'in deniz mavisi ve Başarılı (Passed) CI/CD adımlarının yeşiline aşinadır. Bu yüzden güven ve teknoloji hissi veren kodlanmış `Electric Cyan (#00d4ff)` ve `Neon Green (#00ff88)` paleti sıfırdan oluşturuldu.

### 4. Backend & Veri Yapısı: NestJS + Prisma/PostgreSQL
* **Teknoloji:** NestJS, Prisma ORM, PostgreSQL
* **Neden Seçildi?:** Müşteri faturalandırması, Token harcamaları, Takım (Team) yetkilendirmeleri (RBAC) gibi katı iş kuralları barındıran kısımlar için esnek JavaScript/Express yerine, sıkı tiplenmiş, Dependency Injection tabanlı Enterprise bir çatı olan NestJS seçilmiştir. Verilerin tutarlılığı (Transactional safety) için PostgreSQL kullanılmıştır.

---

## 🚀 Mevcut Durumda Yapılanlar (Geçmiş Süreç Özeti)

1. **Rebranding (Mission Control -> Orbitron):** Proje tamamen yeniden markalandı. İsim, logo ve tüm görsel dil profesyonel bir şirket SaaS'ı seviyesine çıkarıldı.
2. **Landing Page Kompleksitesi:** 6 farklı derin katmandan oluşan bir pazarlama sitesi kodlandı:
   * **Terminal Hero:** Canlı deploy komutlarını simüle eden giriş alanı.
   * **Pipeline Steps:** Otonom sürecin 6 adımda nasıl çalıştığı görselleştirildi.
   * **AI Agent Fleet:** 4 ajanın tanıtımı yapıldı.
   * **K8s Architecture:** Ürünün mühendislik derinliğini gösteren (yaml destekli) Kubernetes altyapı anlatımı yapıldı.
   * **Tech Stack Grid:** 18 adet desteklenen DevOps teknolojisi dahil edildi.
   * **Pricing:** Dinamik 3 katmanlı fiyatlandırma yapıldı.
3. **Pano (Dashboard) Entegrasyonları:**
   * **Token Usage & Billing:** Kullanıcıların kredi ve planlarını takip edebilecekleri, hata vermeyen (Bug-free) sayfalar İngilizce localize edilerek tamamlandı.
   * **Hata Giderimleri (Stabilizasyon):** Ajan sayfaları arası geçişlerdeki React State kilitlenmeleri (undefined hataları) giderildi. Sayfa component yapıları (terminal map closure) optimize edildi.
4. **Gerçekçi Simülasyon:** Backend servisleri (Agent Simulation), frontend ile %100 uyumlu hale getirilerek projenin demosu (pitch) yapılamaya hazır hale getirildi.

---

## 🔮 Gelecek Vizyonu ve Ürün Yol Haritası (Evolution Roadmap)

Orbitron'un pazara çıkışından (GTM) sonra evrileceği temel duraklar:

### Aşama 1: Multi-Cloud Akılcılığı (3. Ay)
Şu an AWS odaklı olan Infra Agent, GCP (Google Cloud) ve Microsoft Azure destekleyecek şekilde genişletilecektir. Kullanıcı **"Bana Avrupa'da en ucuz neresiyse orada e-ticaret altyapısı kur"** dediğinde, FinOps ajanı tüm bulutların fiyatlarını karşılaştırıp AWS Terraform'u ya da Azure Bicep kalıbını otomatik tercih edecektir.

### Aşama 2: BYOA (Bring Your Own Agent) Pazar Yeri (6. Ay)
Kullanıcıların kendi iç sistemleri için geliştirdikleri AI DevOps ajanlarını Orbitron platformuna yükleyebileceği bir Marketplace. **"Kendi güvenlik standartlarımı kontrol eden ajanımı eklemek istiyorum"** diyen Enterprise müşteriler, CRD altyapımız sayesinde kendi ajanlarını izole namespace'lerde çalıştırabileceklerdir.

### Aşama 3: Fully Autonomous Self-Healing (1. Yıl)
Sistemin sadece kuran değil, "iyileştiren" hale gelmesi. SRE Agent, CloudWatch veya Datadog alarmlarını insanlardan önce okuyacak. Veritabanı CPU'su mu %99 oldu? SRE ajanı gece 03:00'te uyanıp otomatik olarak okuma replikası (Read Replica) ekleyecek, trafiği dağıtacak ve sabah Slack üzerinden "Gece şu sorunu çözdüm, şu kadar maliyet artışı oldu" diye sadece rapor verecek.

### Aşama 4: Air-Gapped On-Premise Kurulum (Enterprise)
Bankalar ve savunma sanayi için Orbitron'un SaaS versiyonu yerine, direkt kendi veri merkezlerindeki (bare-metal) Kubernetes cluster'larına kurulabilen kapalı devre (Air-Gapped) versiyonunun çıkarılması. Bu versiyonda yerel LLM'ler (Llama-3, Mistral) çalıştırılacaktır.

---
*Orbitron - The Future of Automated Infrastructure Engineering*
