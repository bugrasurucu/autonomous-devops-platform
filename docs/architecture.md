# 🪐 Orbitron Mimari Tasarım Raporu — Otonom DevOps Altyapısı

## 1. Genel Vizyon ve Tasarım Prensipleri

Orbitron, "Sürükle-Bırak" (Drop & Deploy) prensibi ile çalışan, projeleri analiz ederek otonom AWS altyapısı kuran, CI/CD süreçlerini yöneten, FinOps maliyet filtreleri uygulayan ve üretim ortamındaki hataları otonom olarak düzelten (Self-Healing) bir platformdur. Platform, görsel simülasyonların yanı sıra doğrudan **Local Host Docker** altyapısıyla entegre olarak gerçek Docker konteynerlerini ayağa kaldırabilmektedir.

---

## 2. Çekirdek Sistem Mimarisi

Orbitron, mikroservis odaklı bir mimari üzerinde inşa edilmiştir. Bileşenlerin dağılımı ve etkileşim şeması şu şekildedir:

### 2.1 Web UI (Next.js 14)
*   **Teknoloji:** Next.js (App Router, TypeScript, custom HSL-CSS Design System).
*   **İşlev:** Gerçek zamanlı geliştirici konsolu, K8s cluster topoloji vizüalizasyonu, interaktif pod ölçeklendirme paneli, FinOps maliyet tabloları, log yayın akışı ve token bütçe grafikleri.

### 2.2 API Server (NestJS)
*   **Teknoloji:** NestJS, Prisma ORM, PostgreSQL, Redis, RabbitMQ.
*   **İşlev:** Kimlik doğrulama (JWT), takım yetkilendirmesi, kota yönetimi, GitHub OAuth entegrasyonu, ajan orkestrasyonu ve gerçek Docker daemon kontrolü.
*   **Docker Soket Bağlantısı:** API servis konteynerine host makinenin `/var/run/docker.sock` dosyası bağlanmıştır. Bu sayede API server, host üzerinde bağımsız `nginx:alpine` konteynerleri oluşturup silebilir.

### 2.3 Uzman Ajan Filosu
Platform, belirli rollere sahip 4 uzman otonom ajanın sıralı veya eşzamanlı orkestrasyonuyla çalışır:

1.  **Auto-Bootstrap Agent:** Depoyu semantik olarak tarayıp teknoloji yığınını ve mimariyi belirler.
2.  **Infra Agent:** Terraform HCL ve CloudFormation kodlarını otonom yazar, Checkov ile güvenlik taraması gerçekleştirir.
3.  **FinOps Agent:** AWS Pricing MCP sunucusu ve Infracost kullanarak maliyet tahmini çıkartır, bütçe sınırını denetler.
4.  **Pipeline Agent:** GitHub Actions YAML dosyalarını oluşturur ve Browser Subagent ile görsel testleri (Visual QA) icra eder.
5.  **SRE Agent:** CloudWatch dashboard ve alarmları kurarak anomali durumlarında otonom düzeltme (SAAV) döngüsünü tetikler.

---

## 3. Host Mode Docker Entegrasyonu

Simüle edilmiş sandboks ortamlarının ötesinde, kullanıcı "🚀 Launch Real Container" butonuna bastığında şu süreç işletilir:

```
┌─────────────────┐             ┌─────────────────────┐             ┌───────────────────────┐
│  Next.js UI     │ ──(POST)──➔ │  NestJS Container   │ ──(Socket)─➔│   Host Docker Daemon  │
│  Preview Page   │             │  (uses docker-cli)  │             │   (/var/run/docker.sock)
└─────────────────┘             └─────────────────────┘             └───────────────────────┘
         ▲                                 │                                    │
         │                                 ▼ (Writes temp HTML)                 ▼ (Launches)
         │                       ┌────────────────────┐             ┌───────────────────────┐
         └──────(URL)─────────── │ temp/index-id.html │ ──(docker cp)──➔ orbitron-live-id:80│
                                 └────────────────────┘             └───────────────────────┘
```

1.  API Server, benzersiz bir yerel port (4500-4900 aralığında) tahsis eder.
2.  NestJS, geçici bir dizinde (`temp/`) projenin adına ve kimliğine özel, interaktif bir chatbot arayüzü barındıran `index.html` dosyası oluşturur.
3.  İçerideki `docker-cli`, ana makinenin Docker daemon'ına talep göndererek `nginx:alpine` imajından `orbitron-live-[id]` adında bir konteyner başlatır.
4.  Oluşturulan `index.html` dosyası `docker cp` komutuyla konteynerin webroot dizinine (`/usr/share/nginx/html/index.html`) kopyalanır.
5.  Kullanıcıya `http://localhost:[PORT]` adresi dönülerek gerçek, canlı ve etkileşimli bir web sayfasının ana makinede çalışması sağlanır.

---

## 4. A2A (Agent-to-Agent) Protokolü ve Kayıt Defteri

Orkestratör içindeki `AgentRegistry` sınıfı, uzman ajanların merkezi olarak keşfedilmesini ve iletişim kurmasını sağlar:
*   Ajanlar, yeteneklerini `.well-known/agent.json` formatında tanımlayan birer **AgentCard** sahibidir.
*   Her kart; ajanın adını, yetenek şemalarını (capabilities), ihtiyaç duyduğu MCP sunucularını (mcp_servers) ve IAM rollerini (iam_role) tanımlar.
*   Orkestratör, gelen komutun ihtiyacına göre ilgili ajanı `discover()` metodu ile dinamik olarak bulup orkestre eder.

---

## 5. Güvenlik ve İzolasyon Modeli

1.  **Least-Privileged IAM:** Altyapı ajanı sadece Terraform/CDK yetkilerine sahipken, FinOps ajanı salt-okunur fiyatlandırma yetkilerine sahiptir.
2.  **Circuit Breaker (Devre Kesici):** Maliyet tahmini bütçe limitlerini aştığında orkestrasyon zinciri bir sonraki aşamaya geçmeden otomatik olarak durdurulur.
3.  **Human-in-the-Loop:** Yıkıcı olabilecek altyapı değişiklikleri (`terraform destroy` vb.) için kullanıcı arayüzünden onay talep edilir.
4.  **Sandbox İzolasyonu:** Her ajan kendi izole konteynerinde veya podunda çalıştırılarak müşteri verilerinin birbirine karışması engellenir.
