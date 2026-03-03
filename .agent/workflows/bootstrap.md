---
description: Proje analizi ve başlatma iş akışı — yalnızca araştırma ve planlama
---

# /bootstrap — Proje Analizi ve Planlama İş Akışı

Bu iş akışı, projeyi analiz eder ve dağıtım planını hazırlar ama deploy etmez.

// turbo-all

## Adımlar

### 1. Dizin Ağacı
```bash
find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './venv/*' | head -100
```

### 2. Meta Veri Analizi
```bash
bash .agent/skills/auto-bootstrap/scripts/repo-research.sh . /tmp/repo-research.json
```
Çıktıyı oku ve analiz et.

### 3. Mimari Plan Oluştur
Repo araştırma sonuçlarına göre:
- Gerekli AWS kaynaklarını belirle
- Terraform modül yapısını tasarla
- Maliyet tahmini yap
- CI/CD pipeline yapısını öner

### 4. Implementation Plan Artifact Üret
Tüm bulguları ve önerileri bir Implementation Plan artifact'ine yaz.
Kullanıcı onayı bekle.
