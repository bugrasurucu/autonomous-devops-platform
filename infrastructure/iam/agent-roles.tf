# ================================================
# IAM Rol Tanımları — Her Ajan İçin Minimum Ayrıcalık
# ================================================

# --- Infra Agent IAM Role ---
resource "aws_iam_role" "infra_agent" {
  name = "devops-infra-agent-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { AWS = var.agent_principal_arn }
    }]
  })
  tags = { Agent = "infra-agent" }
}

resource "aws_iam_policy" "infra_agent" {
  name = "devops-infra-agent-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "VPCManagement"
        Effect = "Allow"
        Action = [
          "ec2:CreateVpc", "ec2:DeleteVpc", "ec2:DescribeVpcs",
          "ec2:CreateSubnet", "ec2:DeleteSubnet", "ec2:DescribeSubnets",
          "ec2:CreateSecurityGroup", "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress", "ec2:AuthorizeSecurityGroupEgress",
          "ec2:CreateInternetGateway", "ec2:AttachInternetGateway",
          "ec2:CreateNatGateway", "ec2:AllocateAddress",
          "ec2:CreateRouteTable", "ec2:CreateRoute",
          "ec2:AssociateRouteTable", "ec2:CreateFlowLogs",
          "ec2:Describe*"
        ]
        Resource = "*"
        Condition = { StringEquals = { "aws:RequestedRegion" = var.allowed_regions } }
      },
      {
        Sid    = "ECSManagement"
        Effect = "Allow"
        Action = ["ecs:*"]
        Resource = "*"
      },
      {
        Sid    = "RDSManagement"
        Effect = "Allow"
        Action = ["rds:*"]
        Resource = "*"
      },
      {
        Sid    = "S3Management"
        Effect = "Allow"
        Action = ["s3:CreateBucket", "s3:PutBucketPolicy", "s3:PutEncryptionConfiguration", "s3:PutBucketVersioning"]
        Resource = "arn:aws:s3:::${var.project_name}-*"
      },
      {
        Sid    = "CloudFormation"
        Effect = "Allow"
        Action = ["cloudformation:*"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "infra_agent" {
  role       = aws_iam_role.infra_agent.name
  policy_arn = aws_iam_policy.infra_agent.arn
}

# --- Pipeline Agent IAM Role ---
resource "aws_iam_role" "pipeline_agent" {
  name = "devops-pipeline-agent-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { AWS = var.agent_principal_arn }
    }]
  })
  tags = { Agent = "pipeline-agent" }
}

resource "aws_iam_policy" "pipeline_agent" {
  name = "devops-pipeline-agent-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CodePipeline"
        Effect = "Allow"
        Action = ["codepipeline:*", "codebuild:*"]
        Resource = "*"
      },
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = ["ecr:GetAuthorizationToken", "ecr:BatchCheckLayerAvailability", "ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"]
        Resource = "*"
      },
      {
        Sid    = "S3Artifacts"
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject"]
        Resource = "arn:aws:s3:::${var.project_name}-*/*"
      },
      {
        Sid    = "ECSDeployOnly"
        Effect = "Allow"
        Action = ["ecs:UpdateService", "ecs:DescribeServices", "ecs:RegisterTaskDefinition"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "pipeline_agent" {
  role       = aws_iam_role.pipeline_agent.name
  policy_arn = aws_iam_policy.pipeline_agent.arn
}

# --- FinOps Agent IAM Role (Read-Only) ---
resource "aws_iam_role" "finops_agent" {
  name = "devops-finops-agent-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { AWS = var.agent_principal_arn }
    }]
  })
  tags = { Agent = "finops-agent" }
}

resource "aws_iam_policy" "finops_agent" {
  name = "devops-finops-agent-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "CostReadOnly"
      Effect = "Allow"
      Action = [
        "ce:GetCostAndUsage", "ce:GetCostForecast", "ce:GetReservationUtilization",
        "pricing:GetProducts", "pricing:DescribeServices",
        "budgets:ViewBudget", "budgets:DescribeBudget"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "finops_agent" {
  role       = aws_iam_role.finops_agent.name
  policy_arn = aws_iam_policy.finops_agent.arn
}

# --- SRE Agent IAM Role (Limited Write) ---
resource "aws_iam_role" "sre_agent" {
  name = "devops-sre-agent-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { AWS = var.agent_principal_arn }
    }]
  })
  tags = { Agent = "sre-agent" }
}

resource "aws_iam_policy" "sre_agent" {
  name = "devops-sre-agent-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "MonitoringReadOnly"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData", "cloudwatch:DescribeAlarms", "cloudwatch:ListMetrics",
          "logs:FilterLogEvents", "logs:GetLogEvents", "logs:DescribeLogGroups",
          "xray:GetTraceSummaries", "xray:GetServiceGraph"
        ]
        Resource = "*"
      },
      {
        Sid    = "LimitedRemediation"
        Effect = "Allow"
        Action = [
          "ec2:RebootInstances",
          "ecs:UpdateService",
          "ssm:SendCommand"
        ]
        Resource = "*"
        Condition = { StringEquals = { "aws:ResourceTag/Agent" = "sre-agent" } }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sre_agent" {
  role       = aws_iam_role.sre_agent.name
  policy_arn = aws_iam_policy.sre_agent.arn
}

# --- Variables ---
variable "project_name" {
  type    = string
  default = "devops-platform"
}

variable "agent_principal_arn" {
  description = "Ajanları çalıştıran IAM kullanıcı/rol ARN"
  type        = string
  default     = "arn:aws:iam::123456789012:root"
}

variable "allowed_regions" {
  description = "İzin verilen AWS bölgeleri"
  type        = list(string)
  default     = ["eu-west-1"]
}
