# ================================================
# Monitoring Modülü — CloudWatch, EventBridge, Self-Healing Lambda
# SRE Agent için otonom izleme ve iyileştirme altyapısı
# ================================================

variable "project_name" {
  type = string
}

variable "environment" {
  type    = string
  default = "production"
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix (metrik namespace için)"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Alarm bildirim e-posta adresi"
  type        = string
  default     = ""
}

# --- SNS Topic (Alarm bildirimleri) ---
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# --- CloudWatch Alarms ---

# CPU Kullanımı > %85
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU kullanımı %85 üzerinde"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Agent       = "sre-agent"
    SelfHealing = "true"
  }
}

# Bellek Kullanımı > %90
resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${var.project_name}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "ECS bellek kullanımı %90 üzerinde"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Agent       = "sre-agent"
    SelfHealing = "true"
  }
}

# 5xx Hata Oranı
resource "aws_cloudwatch_metric_alarm" "http_5xx" {
  alarm_name          = "${var.project_name}-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "5xx hata sayısı eşiği aştı"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Agent       = "sre-agent"
    SelfHealing = "true"
  }
}

# ECS Running Task < Desired
resource "aws_cloudwatch_metric_alarm" "task_count_low" {
  alarm_name          = "${var.project_name}-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Çalışan ECS task sayısı beklenenin altında"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Agent       = "sre-agent"
    SelfHealing = "true"
  }
}

# --- EventBridge Rule (Self-Healing tetikleyici) ---
resource "aws_cloudwatch_event_rule" "self_healing" {
  name        = "${var.project_name}-self-healing-trigger"
  description = "CloudWatch alarm → Self-Healing Lambda tetikleyici"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      state = { value = ["ALARM"] }
      alarmName = [
        { prefix = var.project_name }
      ]
    }
  })

  tags = {
    Agent = "sre-agent"
  }
}

resource "aws_cloudwatch_event_target" "self_healing_lambda" {
  rule = aws_cloudwatch_event_rule.self_healing.name
  arn  = aws_lambda_function.self_healing_webhook.arn
}

# --- Self-Healing Lambda Function ---
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../lambda/self-healing-webhook"
  output_path = "${path.root}/../../lambda/self-healing-webhook.zip"
}

resource "aws_lambda_function" "self_healing_webhook" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-self-healing-webhook"
  role             = aws_iam_role.lambda_self_healing.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  timeout          = 300
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      PROJECT_NAME     = var.project_name
      ECS_CLUSTER      = var.ecs_cluster_name
      ECS_SERVICE      = var.ecs_service_name
      SNS_TOPIC_ARN    = aws_sns_topic.alerts.arn
      ENVIRONMENT      = var.environment
    }
  }

  tags = {
    Agent = "sre-agent"
  }
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.self_healing_webhook.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.self_healing.arn
}

# --- Lambda IAM Role ---
resource "aws_iam_role" "lambda_self_healing" {
  name = "${var.project_name}-self-healing-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_self_healing" {
  name = "${var.project_name}-self-healing-lambda-policy"
  role = aws_iam_role.lambda_self_healing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:ListTasks",
          "ecs:DescribeTasks"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetMetricData",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# --- CloudWatch Dashboard ---
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS CPU Kullanımı"
          metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name]]
          period  = 300
          stat    = "Average"
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS Bellek Kullanımı"
          metrics = [["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name]]
          period  = 300
          stat    = "Average"
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Çalışan Task Sayısı"
          metrics = [["ECS/ContainerInsights", "RunningTaskCount", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name]]
          period  = 60
          stat    = "Average"
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Son Hatalar"
          query  = "SOURCE '/ecs/${var.project_name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region = data.aws_region.current.name
        }
      }
    ]
  })
}

data "aws_region" "current" {}

# --- Outputs ---
output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}

output "self_healing_lambda_arn" {
  value = aws_lambda_function.self_healing_webhook.arn
}
