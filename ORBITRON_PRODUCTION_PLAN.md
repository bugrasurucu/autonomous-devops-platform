# Orbitron: Production Readiness & Deployment Plan

Bu doküman, projeyi üretim (production) ortamına taşımadan önce test edilmesi gereken eksikleri, "kullanılmayan kod yığınlarını" ve deployment aşamasındaki yol haritasını analiz eder.

---

## 1. Mimari Eksikler ve Canlıya Çıkış Öncesi Teknik Borçlar (Tech Debt)

Şu an projenin "demo" ve "ürün" arasındaki arafta kalmasına neden olan temel kısımlar:

### A. Auth (Kimlik Doğrulama) Simülasyonu
- **Mevcut Durum:** `auth-context.tsx` tamamen simüle edilmiş (hardcoded) bir token/session mantığı üzerine kurulu. Sayfa yenilendiğinde "test auth" gidiyor.
- **Çözüm:** Production için acilen NextAuth (Auth.js) veya Supabase/Auth0 entegrasyonu yapılmalı. JWT tabanlı veya HTTP-Only cookie tabanlı güvenli bir session yapısına geçilmeli.

### B. Ajan Servis Bağlantıları (Agent Bridge)
- **Mevcut Durum:** Pano'daki `AgentsService` sınıfında yer alan `triggerAgent` fonksiyonları `setTimeout` ile simüle ediliyor.
- **Çözüm:** Bu simülasyonların, backend'deki gerçek `KagentBridgeController` endpoint'lerine (ve oradan da Kubernetes Cluster'a) WebSocket veya REST üzerinden bağlanması şart. Ajan işlemleri uzun süreli olduğu için (Long-polling veya WebSocket) şart.

### C. Ölü/Kullanılmayan Frontend Kodları
- Eski "Mission Control" temasından kalma mor gradient barındıran bazı legacy CSS dosyaları ve kullanılmayan layout component'leri build boyutunu şişiriyor. Canlıya çıkmadan önce tam bir tree-shaking ve unused-exports analizi yapılmalı.

---

## 2. Deployment ve Web Hosting (Path / Sub-Directory) Stratejisi

Eğer proje Vercel veya AWS Amplify gibi bir yerde ana root haricinde (örn: `sirket.com/orbitron`) özel bir path altına deploy edilecekse dikkat edilmesi gerekenler:

### Next.js (Frontend) Ayarları
- Vercel veya Nginx arkasında bir alt path'te çalışmak için `next.config.js` dosyasına `basePath` ayarı eklenmelidir.
```javascript
module.exports = {
  basePath: process.env.BASE_PATH || '', // Örn: '/orbitron'
  assetPrefix: process.env.BASE_PATH || '',
  // ...
}
```
- Ayrıca tüm sayfa içi linkler (`<Link href="/">`) `basePath` ile otomatik haritalanır; ancak manuel yazılan API fetch url'leri (`/api/v1/deploy`) dinamik hale getirilmelidir.

### NestJS (Backend) Ayarları
- API route çakışmalarını önlemek adına NestJS tarafında bir Global Prefix kullanılmalıdır.
- CORS ayarları kesinlikle `origin: '*'` yerine, sadece production URL'ine izin verecek şekilde (örn: `origin: 'https://app.orbitron.dev'`) sıkılaştırılmalıdır.

---

## 3. UI/UX: Metrikler ve Hata Logları (Observability)

Sistemin gerçekten çalıştığını DevOps ekiplerine hissettirebilmek ve sadece statik veri yerine gerçek akışı gösterebilmek adına eksikler:

### A. Aktif Metrik Panosu
UI sadece total sayıları gösteriyor (örn: Total Deploy: 45). Ancak DevOps araçlarında zaman serisi analizi şarttır.
- **Çözüm:** Pano ekranına Token kullanımını anlık çizen bir çizgi grafik (Line Chart) ve Ajanların işlem hacmini bölen Bar Chart (Örn: Recharts kütüphanesi ile) eklenmesi.

### B. Sistem & Ajan Hata Konsolu
En büyük eksik, ajanlar çalışırken veya çöktüğünde (`CrashLoopBackOff`, Rate Limits) kullanıcının bunu görememesidir. Sadece "Success/Fail" yazması DevOps kültürü için yeterli değildir.
- **Çözüm:** Sistemin alt kısmına, hataları kırmızı (`#ff5f57`), sistem loglarını cyan rengiyle basan, canlı kayan bir "Terminal Logger" bileşeninin eklenmesi.

---

**Özet Plan**:
1. NextJS ve NestJS configlerinde Path (Routing) prefix ayarlarını implemente etmek.
2. Pano (Dashboard) üzerine Recharts ve Terminal eklentilerini kurup UI'ı canlandırmak.
3. Auth yapısını NextAuth'a geçirip simülasyonları kaldırmak.
