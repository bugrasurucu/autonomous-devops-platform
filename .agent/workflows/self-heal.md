---
description: Self-healing olay müdahale iş akışı — CloudWatch alarm sonrası otonom iyileştirme
---

# /self-heal — Olay Müdahale İş Akışı

CloudWatch alarm tetiklendiğinde veya manuel olarak çağrıldığında çalışır.

// turbo-all

## Adımlar

### 1. Alarm Bilgilerini Topla
SRE Agent skill'ini (`sre-agent`) yükle. CloudWatch MCP sunucusunu kullanarak:
```bash
aws cloudwatch describe-alarms --state-value ALARM --output json
```

### 2. Log Analizi
Son 30 dakikanın loglarını çek:
```bash
aws logs filter-log-events \
  --log-group-name /ecs/app \
  --start-time $(date -d '30 minutes ago' +%s000) \
  --filter-pattern "ERROR" \
  --limit 50
```

### 3. Metrik Korelasyonu
CPU, bellek, ağ ve hata oranı metriklerini çapraz analiz et:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --period 300 \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)
```

### 4. Kök Neden Analizi (RCA)
Toplanan verileri analiz ederek kök nedeni belirle.
Eski RCA raporlarını ve runbook'ları referans al.

### 5. Otonom İyileştirme
Tespit edilen soruna göre aksiyon al:

**ECS task çökmesi:**
```bash
aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
```

**Yüksek CPU — ölçek artırma:**
```bash
aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count $((CURRENT+2))
```

**Deployment kaynaklı — rollback:**
```bash
aws ecs update-service --cluster $CLUSTER --service $SERVICE --task-definition $PREVIOUS_TASK_DEF
```

### 6. Doğrulama
60 saniye boyunca her 10 saniyede health check:
```bash
for i in $(seq 1 6); do curl -sf $HEALTH_URL && echo "✅ OK" || echo "❌ FAIL"; sleep 10; done
```

### 7. Raporlama
Olay raporu Artifact'i oluştur:
- Olay özeti, RCA bulguları, uygulanan aksiyonlar, önleme önerileri
