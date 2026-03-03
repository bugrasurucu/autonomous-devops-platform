# Terraform En İyi Uygulamaları — Infra Agent Referansı

## Güvenlik Kuralları

### S3
- Tüm bucket'lar SSE-AES256 veya SSE-KMS ile şifrelenmelidir
- Public access block aktif olmalıdır
- Versioning etkinleştirilmelidir
- Access logging açık olmalıdır

### IAM
- Inline policy yerine managed policy tercih edilmelidir
- `*` kaynak yetkisi kullanılmamalıdır
- MFA zorunlu tutulmalıdır (root ve admin hesapları)
- IAM Access Analyzer etkinleştirilmelidir

### VPC
- Veritabanları yalnızca private subnet'lerde olmalıdır
- NAT Gateway her AZ'de olmalıdır (HA)
- Flow logs etkinleştirilmelidir
- Security group kuralları minimum ayrıcalıkla tanımlanmalıdır
- NACL ile ek katman güvenliği sağlanmalıdır

### ECS
- Task definition'lar `readonlyRootFilesystem: true` olmalıdır
- Awslogs log driver zorunludur
- Secrets Manager ile hassas verileri inject edin (env var yerine)
- `awsvpc` network mode kullanılmalıdır

### RDS
- Multi-AZ dağıtım üretim ortamları için zorunludur
- Encryption at rest aktif olmalıdır
- Automated backups en az 7 gün tutulmalıdır
- Public accessibility kapalı olmalıdır
- Performance Insights etkinleştirilmelidir

## Yapısal Kurallar

- Her modül `main.tf`, `variables.tf`, `outputs.tf` içermelidir
- Remote state (S3 + DynamoDB lock) kullanılmalıdır
- `terraform fmt` ve `terraform validate` CI pipeline'da zorunludur
- Tag stratejisi: `Environment`, `Project`, `ManagedBy`, `Agent` etiketleri zorunludur
- `prevent_destroy` lifecycle kuralı üretim veritabanlarında aktif olmalıdır
