# 🏛️ Architecture Decision Records (ADR)

Bu belge, **Orbitron Multi-Cloud Autonomous DevOps Platform** mimarisinde alınan temel mühendislik kararlarını (Faz 0 – Faz 10) kayıt altına alır.

---

## ADR-001: Deterministik DevOps Boru Hattı + Karar Noktası Ajanları

- **Durum:** Kabul Edildi (2026-11)
- **Bağlam:** Salt LLM çıktısıyla üretilen Dockerfile ve Terraform dosyaları halüsinasyon veya sözdizimi hatası riski taşır.
- **Karar:** Repo analizi (`deepInspectGitHubRepository`), OpenTofu plan diff (`buildStructuredPlanDiff`), güvenlik taraması (`evaluateSecurityGate`) ve çoklu-bulut maliyet hesabı (`calculateMultiCloudCostReport`) **%100 deterministik motorlar** tarafından yürütülür. Ajanlar (`infra-agent`, `pipeline-agent`, `finops-agent`, `sre-agent`) bu deterministik araçları (`agent-tools.registry.ts`) guardrail denetimi altında çağırır.

---

## ADR-002: Çoklu-Bulut Soyutlama Katmanı (AWS, GCP, Azure, Kubernetes, Local Docker)

- **Durum:** Kabul Edildi (2026-11)
- **Bağlam:** Tek bir bulut sağlayıcısına (yalnızca AWS) bağımlı kalmak hem maliyeti artırır hem de taşınabilirliği engeller.
- **Karar:** `backend/src/providers/cloud-provider.registry.ts` içinde 5 hedefli sağlayıcı kataloğu (`aws`, `gcp`, `azure`, `kubernetes`, `local`) oluşturuldu. Her dağıtım için SHA-256 `iacHash` içeren OpenTofu kaynak planı ve 4 bulut arası yan yana maliyet/soğuk-başlangıç karşılaştırması üretilir.

---

## ADR-003: AES-256-GCM Sır Şifreleme ve Anahtarsız OIDC Kimlik Doğrulama

- **Durum:** Kabul Edildi (2026-11)
- **Bağlam:** Eski `crypto-js` kütüphanesi ve imzasız OAuth `state` parametreleri güvenlik riski oluşturuyordu.
- **Karar:** Node.js yerleşik `crypto` modülüyle `aes-256-gcm` (`scryptSync` + 96-bit IV + 128-bit AuthTag) ve HMAC-SHA256 imzalı OAuth `state` doğrulaması (`backend/src/common/crypto.util.ts`) devreye alındı. Bulut dağıtımlarında statik anahtar yerine OIDC Workload Identity Federation şablonları standartlaştırıldı.

---

## ADR-004: Deklaratif YAML SAAV Runbook'ları ve OPA/Rego FinOps Kapısı

- **Durum:** Kabul Edildi (2026-11)
- **Bağlam:** Otonom iyileştirme (Self-Healing) ve bütçe denetiminin denetlenebilir (auditable) olması gerekir.
- **Karar:** SRE SAAV döngüsü (`Sense → Analyze → Act → Verify`) deklaratif YAML runbook politikalarıyla (`cpu-saturation-autoscale`, `memory-pressure-recycle`, `http-5xx-canary-rollback`, `db-pool-exhaustion-proxy`) eşleştirildi ve tüm ajan/kullanıcı aksiyonları CSV/JSON olarak dışa aktarılabilen `AuditLog` tablosuna bağlandı.
