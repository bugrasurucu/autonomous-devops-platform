# ================================================
# Değişkenler — Proje Geneli Konfigürasyon
# ================================================

variable "project_name" {
  description = "Proje adı (tüm kaynak isimlendirmelerinde kullanılır)"
  type        = string
}

variable "environment" {
  description = "Ortam: dev, staging, production"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment dev, staging veya production olmalıdır."
  }
}

variable "aws_region" {
  description = "AWS bölgesi"
  type        = string
  default     = "eu-west-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR bloğu"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Kullanılacak AZ'ler"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b"]
}

# --- ECS Değişkenleri ---
variable "container_image" {
  description = "Docker image URI"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Konteyner portu"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Fargate CPU (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate bellek (MB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "İstenen task sayısı"
  type        = number
  default     = 2
}

variable "environment_variables" {
  description = "Konteyner ortam değişkenleri"
  type        = map(string)
  default     = {}
}

# --- RDS Değişkenleri ---
variable "db_engine" {
  description = "Veritabanı motoru (postgres, mysql)"
  type        = string
  default     = "postgres"
}

variable "db_instance_class" {
  description = "RDS instance tipi"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Veritabanı adı"
  type        = string
  default     = "appdb"
}

# --- Monitoring ---
variable "notification_email" {
  description = "Alarm bildirim e-posta adresi"
  type        = string
  default     = ""
}
