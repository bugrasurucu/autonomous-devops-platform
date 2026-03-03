#!/bin/bash
# Infracost Analiz Betiği — FinOps Agent tarafından kullanılır
set -euo pipefail

TERRAFORM_DIR="${1:-infrastructure/terraform}"
OUTPUT_DIR="${2:-/tmp/finops}"
MONTHLY_BUDGET="${FINOPS_MONTHLY_BUDGET:-500}"
DEPLOY_MAX="${FINOPS_DEPLOY_MAX:-50}"

mkdir -p "$OUTPUT_DIR"

echo "💰 FinOps maliyet analizi başlıyor..."
echo "📂 Terraform dizini: $TERRAFORM_DIR"
echo "💵 Aylık bütçe limiti: \$$MONTHLY_BUDGET"
echo "💵 Dağıtım başına limit: \$$DEPLOY_MAX"

# Infracost kontrolü
if ! command -v infracost &> /dev/null; then
  echo "⚠️ Infracost yüklü değil. Yükleniyor..."
  curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
fi

# Maliyet analizi
echo "🔍 Terraform maliyet analizi çalıştırılıyor..."
infracost breakdown \
  --path "$TERRAFORM_DIR" \
  --format json \
  --out-file "$OUTPUT_DIR/infracost-report.json" 2>/dev/null || {
    echo "⚠️ Infracost analizi başarısız. API anahtarı kontrol edin."
    exit 1
  }

# Tablo formatında çıktı
infracost output \
  --path "$OUTPUT_DIR/infracost-report.json" \
  --format table \
  --out-file "$OUTPUT_DIR/infracost-table.txt"

echo ""
echo "📊 Maliyet Raporu:"
cat "$OUTPUT_DIR/infracost-table.txt"

# Maliyet kontrolü
MONTHLY_COST=$(cat "$OUTPUT_DIR/infracost-report.json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
cost = data.get('totalMonthlyCost', '0')
print(float(cost) if cost else 0)
" 2>/dev/null || echo "0")

echo ""
echo "📈 Tahmini aylık maliyet: \$$MONTHLY_COST"

# Karar mantığı
RESULT="APPROVED"
if (( $(echo "$MONTHLY_COST > $MONTHLY_BUDGET" | bc -l 2>/dev/null || echo 0) )); then
  RESULT="BLOCKED"
  echo "🛑 BÜTÇE AŞIMI! Maliyet (\$$MONTHLY_COST) bütçeyi (\$$MONTHLY_BUDGET) aşıyor."
  echo "🛑 Pipeline DURDURULDU. İnsan onayı gerekli."
elif (( $(echo "$MONTHLY_COST > $DEPLOY_MAX" | bc -l 2>/dev/null || echo 0) )); then
  RESULT="WARNING"
  echo "⚠️ UYARI: Dağıtım maliyeti (\$$MONTHLY_COST) eşiğin (\$$DEPLOY_MAX) üzerinde."
  echo "⚠️ İnsan onayı önerilir."
else
  echo "✅ Maliyet sınırlar içinde. Pipeline devam edebilir."
fi

# Sonuç dosyası
cat > "$OUTPUT_DIR/finops-decision.json" << EOF
{
  "decision": "$RESULT",
  "estimated_monthly_cost_usd": $MONTHLY_COST,
  "monthly_budget_usd": $MONTHLY_BUDGET,
  "per_deploy_threshold_usd": $DEPLOY_MAX,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "report_path": "$OUTPUT_DIR/infracost-report.json"
}
EOF

echo ""
echo "📋 Karar: $RESULT"
echo "📁 Rapor: $OUTPUT_DIR/finops-decision.json"

exit $([ "$RESULT" = "BLOCKED" ] && echo 1 || echo 0)
