# SRE Runbook Şablonu

## Olay Bilgileri

| Alan | Değer |
|------|-------|
| **Olay ID** | INC-YYYY-NNN |
| **Tarih/Saat** | YYYY-MM-DD HH:MM UTC |
| **Şiddet** | P1 / P2 / P3 / P4 |
| **Etkilenen Servisler** | |
| **Tespit Yöntemi** | CloudWatch Alarm / Kullanıcı Şikayeti / Proaktif Tarama |

## Belirtiler

- [ ] 5xx hata oranı artışı
- [ ] Yüksek yanıt süresi (p99 > X ms)
- [ ] Servis erişilemez
- [ ] CPU/Bellek doygunluğu
- [ ] Veritabanı bağlantı sorunları
- [ ] Diğer: ___

## Kök Neden Analizi (RCA)

### Zaman Çizelgesi
| Zaman | Olay |
|-------|------|
| HH:MM | İlk alarm tetiklendi |
| HH:MM | SRE ajanı analiz başlattı |
| HH:MM | Kök neden tespit edildi |
| HH:MM | İyileştirme uygulandı |
| HH:MM | Sistem stabil hale geldi |

### Kök Neden
> [Detaylı açıklama]

### Etki Analizi
- **Süre:** X dakika
- **Etkilenen kullanıcı sayısı:** ~N
- **Veri kaybı:** Var / Yok

## Uygulanan İyileştirmeler

1. [ ] Konteyner yeniden başlatma
2. [ ] Auto Scaling kapasitesi artırma
3. [ ] Önceki sürüme rollback
4. [ ] Bağlantı havuzu temizleme
5. [ ] Diğer: ___

## Doğrulama

- [ ] Health check başarılı
- [ ] Hata oranı normal aralıkta
- [ ] Metrikler stabil
- [ ] Kullanıcı onayı alındı

## Önleme Önerileri

1. [ ] [Yapısal öneri 1]
2. [ ] [Yapısal öneri 2]
3. [ ] [İzleme iyileştirmesi]

## Otomatik Aksiyonlar Logu

```json
{
  "actions_taken": [],
  "agent_confidence": 0.0,
  "escalated_to_human": false
}
```
