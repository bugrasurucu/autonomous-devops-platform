# ================================================
# Çıktılar — Altyapı Endpoint ve ARN Bilgileri
# ================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS adresi"
  value       = module.ecs.alb_dns_name
}

output "ecr_repo_uri" {
  description = "ECR repository URI"
  value       = module.ecs.ecr_repo_uri
}

output "ecs_cluster_name" {
  description = "ECS cluster adı"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service adı"
  value       = module.ecs.service_name
}

output "rds_endpoint" {
  description = "RDS veritabanı endpoint"
  value       = module.rds.endpoint
}

output "rds_secret_arn" {
  description = "Veritabanı şifre Secrets Manager ARN"
  value       = module.rds.secret_arn
  sensitive   = true
}

output "cloudwatch_dashboard" {
  description = "CloudWatch Dashboard adı"
  value       = module.monitoring.dashboard_name
}

output "sns_alerts_topic" {
  description = "SNS alarm topic ARN"
  value       = module.monitoring.sns_topic_arn
}

output "self_healing_lambda_arn" {
  description = "Self-Healing Lambda fonksiyon ARN"
  value       = module.monitoring.self_healing_lambda_arn
}

output "app_url" {
  description = "Uygulama URL'si"
  value       = "http://${module.ecs.alb_dns_name}"
}
