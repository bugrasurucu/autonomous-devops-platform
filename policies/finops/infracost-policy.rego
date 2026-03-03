# OPA/Rego Maliyet Politika Kuralları
# Infracost çıktısını doğrulamak için kullanılır

package finops.policy

import future.keywords.in

# Aylık bütçe limiti (USD)
default monthly_budget := 500

# Dağıtım başına maliyet limiti (USD)
default per_deploy_limit := 50

# Maliyet artış yüzdesi limiti
default max_increase_percentage := 20

# Ana politika kuralı — ihlal var mı?
deny[msg] {
    input.totalMonthlyCost > monthly_budget
    msg := sprintf("BÜTÇE AŞIMI: Tahmini aylık maliyet ($%.2f) bütçeyi ($%d) aşıyor", [input.totalMonthlyCost, monthly_budget])
}

deny[msg] {
    input.diffTotalMonthlyCost > per_deploy_limit
    msg := sprintf("DAĞITIM MALİYETİ AŞIMI: Bu dağıtımın ek maliyeti ($%.2f) limiti ($%d) aşıyor", [input.diffTotalMonthlyCost, per_deploy_limit])
}

# Uyarı kuralları
warn[msg] {
    input.totalMonthlyCost > monthly_budget * 0.8
    input.totalMonthlyCost <= monthly_budget
    msg := sprintf("UYARI: Maliyet ($%.2f) bütçenin %%80'ini aştı", [input.totalMonthlyCost])
}

# Graviton önerisi
warn[msg] {
    some resource in input.projects[_].breakdown.resources
    resource.name
    contains(resource.metadata.instance_type, "m5")
    msg := sprintf("OPTİMİZASYON: %s kaynağı Graviton (m7g) ile %%30 tasarruf sağlayabilir", [resource.name])
}

# Şifrelenmemiş depolama kontrolü
deny[msg] {
    some resource in input.projects[_].breakdown.resources
    resource.resourceType == "aws_s3_bucket"
    not resource.metadata.server_side_encryption_configuration
    msg := sprintf("GÜVENLİK: S3 bucket '%s' şifrelenmemiş", [resource.name])
}
