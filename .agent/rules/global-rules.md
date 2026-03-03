---
description: Global rules for autonomous DevOps agents — terminal safety, execution boundaries
---

# Otonom DevOps Platformu — Küresel Kurallar

## Terminal Yürütme Politikası

### Allow List (Tam Otonom — Turbo Mode)
Aşağıdaki komutlar insan onayı gerektirmeden çalıştırılabilir:

```
# Okuma ve analiz komutları
cat, less, head, tail, wc, du, df
ls, find, tree, file, stat
grep, rg, ag, sed (read-only), awk

# Git okuma komutları
git status, git log, git diff, git branch, git show, git remote -v

# Paket yönetimi (okuma)
npm list, pip list, pip show, terraform version

# AWS okuma komutları
aws s3 ls, aws ec2 describe-*, aws ecs list-*, aws cloudwatch get-*
aws sts get-caller-identity

# Build ve test
npm install, npm run build, npm test, npm run lint
pip install -r requirements.txt
go build, go test
terraform init, terraform plan, terraform fmt, terraform validate

# Docker (okuma ve build)
docker ps, docker images, docker logs, docker build

# Infracost
infracost breakdown, infracost diff, infracost output
```

### Deny List (İnsan Onayı Gerekli — Request Review)
Aşağıdaki komutlar **mutlaka** insan onayı gerektirir:

```
# Yıkıcı dosya işlemleri
rm -rf, rmdir, shred
chmod -R 777, chown -R

# Git yazma komutları (force)
git push --force, git reset --hard, git clean -fd

# Altyapı yıkıcı komutlar
terraform destroy, terraform apply -auto-approve (ilk dağıtımda)
cdk destroy

# AWS yıkıcı komutlar
aws s3 rb, aws s3 rm --recursive
aws ec2 terminate-instances
aws iam delete-*, aws iam put-*, aws iam attach-*
aws rds delete-db-instance

# Sistem seviyesi
sudo, su
curl | sh, wget | bash
```

### Conditional List (Bağlama Göre)
```
# İlk kez → onay gerekli, sonraki → otonom
terraform apply    → İlk dağıtımda onay, güncelleme planı onaylandıysa otonom
docker push        → Registry doğrulanmışsa otonom
git push           → PR branch'ine otonom, main/master'a onay gerekli
```

## Genel Davranış Kuralları

1. **Kök dizine erişme.** Agent Non-Workspace File Access kapalı tutulmalıdır.
2. **Asla `.env`, SSH anahtarları veya secrets dosyalarını loglama.**
3. **Her terraform apply öncesinde terraform plan çıktısını Artifact olarak kaydet.**
4. **Hata durumunda escalation:** 3 başarısız denemeden sonra insan müdahalesi iste.
5. **macOS'ta `cmd /c` kullanma** — bu kural yalnızca Windows ajanları içindir.
6. **Her terminal komutunun çalışma dizinini açıkça belirt** (`Cwd` parametresi).
