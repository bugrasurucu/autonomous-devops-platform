import * as crypto from 'crypto';

export type CloudProviderId = 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'local';

export interface CloudRegionSpec {
    code: string;
    name: string;
    latencyHintMs: number;
    greenEnergy: boolean;
}

export interface CloudProviderDescriptor {
    id: CloudProviderId;
    name: string;
    shortName: string;
    icon: string;
    terraformProvider: string;
    defaultRegion: string;
    regions: CloudRegionSpec[];
    services: {
        compute: string;
        database: string;
        registry: string;
        secrets: string;
        monitoring: string;
    };
    keylessAuth: {
        mechanism: string;
        setupCliSnippet: string;
        githubActionsAction: string;
    };
}

export interface PlanResourceChange {
    address: string;
    resourceType: string;
    provider: CloudProviderId;
    action: 'create' | 'update' | 'no-op' | 'delete';
    summary: string;
    estimatedMonthlyUsd: number;
}

export const CLOUD_PROVIDER_CATALOG: Record<CloudProviderId, CloudProviderDescriptor> = {
    aws: {
        id: 'aws',
        name: 'Amazon Web Services (AWS)',
        shortName: 'AWS',
        icon: '☁️',
        terraformProvider: 'hashicorp/aws ~> 5.40',
        defaultRegion: 'us-east-1',
        regions: [
            { code: 'aws:us-east-1', name: 'US East (N. Virginia)', latencyHintMs: 75, greenEnergy: false },
            { code: 'aws:eu-west-1', name: 'EU West (Ireland)', latencyHintMs: 42, greenEnergy: true },
            { code: 'aws:eu-central-1', name: 'EU Central (Frankfurt)', latencyHintMs: 34, greenEnergy: true },
            { code: 'aws:ap-southeast-1', name: 'Asia Pacific (Singapore)', latencyHintMs: 145, greenEnergy: false },
        ],
        services: {
            compute: 'ECS Fargate (ARM64 Graviton2) / AWS App Runner',
            database: 'Amazon RDS PostgreSQL 16 (gp3 encrypted)',
            registry: 'Amazon ECR',
            secrets: 'AWS Secrets Manager',
            monitoring: 'Amazon CloudWatch + EventBridge SAAV',
        },
        keylessAuth: {
            mechanism: 'AWS IAM OIDC Identity Provider (sts:AssumeRoleWithWebIdentity)',
            setupCliSnippet: `aws iam create-open-id-connect-provider \\
  --url https://token.actions.githubusercontent.com \\
  --client-id-list sts.amazonaws.com \\
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1`,
            githubActionsAction: 'aws-actions/configure-aws-credentials@v4',
        },
    },
    gcp: {
        id: 'gcp',
        name: 'Google Cloud Platform (GCP)',
        shortName: 'GCP',
        icon: '🌐',
        terraformProvider: 'hashicorp/google ~> 5.25',
        defaultRegion: 'us-central1',
        regions: [
            { code: 'gcp:us-central1', name: 'Iowa (us-central1)', latencyHintMs: 82, greenEnergy: true },
            { code: 'gcp:europe-west1', name: 'Belgium (europe-west1)', latencyHintMs: 38, greenEnergy: true },
            { code: 'gcp:europe-west3', name: 'Frankfurt (europe-west3)', latencyHintMs: 33, greenEnergy: true },
        ],
        services: {
            compute: 'Google Cloud Run v2 (Gen2 Execution Environment)',
            database: 'Cloud SQL for PostgreSQL 16',
            registry: 'Google Artifact Registry',
            secrets: 'Google Secret Manager',
            monitoring: 'Google Cloud Monitoring + Pub/Sub SAAV',
        },
        keylessAuth: {
            mechanism: 'GCP Workload Identity Federation (Keyless OIDC)',
            setupCliSnippet: `gcloud iam workload-identity-pools create "orbitron-pool" \\
  --location="global" --display-name="Orbitron GitHub OIDC Pool"`,
            githubActionsAction: 'google-github-actions/auth@v2',
        },
    },
    azure: {
        id: 'azure',
        name: 'Microsoft Azure',
        shortName: 'Azure',
        icon: '🔷',
        terraformProvider: 'hashicorp/azurerm ~> 3.100',
        defaultRegion: 'westeurope',
        regions: [
            { code: 'azure:eastus', name: 'East US (Virginia)', latencyHintMs: 76, greenEnergy: false },
            { code: 'azure:westeurope', name: 'West Europe (Netherlands)', latencyHintMs: 36, greenEnergy: true },
            { code: 'azure:germanywestcentral', name: 'Germany West Central (Frankfurt)', latencyHintMs: 34, greenEnergy: true },
        ],
        services: {
            compute: 'Azure Container Apps (Consumption + Dedicated)',
            database: 'Azure Database for PostgreSQL Flexible Server',
            registry: 'Azure Container Registry (ACR)',
            secrets: 'Azure Key Vault',
            monitoring: 'Azure Monitor + Log Analytics SAAV',
        },
        keylessAuth: {
            mechanism: 'Microsoft Entra Workload ID Federated Credentials',
            setupCliSnippet: `az ad app federated-credential create --id <APP_OBJECT_ID> \\
  --parameters '{"name":"orbitron-oidc","issuer":"https://token.actions.githubusercontent.com","subject":"repo:owner/repo:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}'`,
            githubActionsAction: 'azure/login@v2',
        },
    },
    kubernetes: {
        id: 'kubernetes',
        name: 'Kubernetes (Any Cluster — EKS / GKE / AKS / k3s)',
        shortName: 'Kubernetes',
        icon: '☸️',
        terraformProvider: 'hashicorp/kubernetes ~> 2.29 + hashicorp/helm ~> 2.13',
        defaultRegion: 'cluster-default',
        regions: [
            { code: 'k8s:cluster-default', name: 'Production Kubernetes Cluster', latencyHintMs: 25, greenEnergy: true },
        ],
        services: {
            compute: 'Kubernetes Deployment + HPA v2 + NGINX Ingress',
            database: 'CloudNativePG Operator (PostgreSQL 16 HA)',
            registry: 'GitHub Container Registry (GHCR) / Harbor',
            secrets: 'External Secrets Operator',
            monitoring: 'Prometheus + Alertmanager + kagent CRD',
        },
        keylessAuth: {
            mechanism: 'Kubernetes ServiceAccount TokenRequest API + OIDC Issuer',
            setupCliSnippet: `kubectl create namespace orbitron-production && \\
kubectl create serviceaccount orbitron-deployer -n orbitron-production`,
            githubActionsAction: 'azure/k8s-set-context@v4',
        },
    },
    local: {
        id: 'local',
        name: 'Local Docker Engine (Host Mode)',
        shortName: 'Local Docker',
        icon: '🐳',
        terraformProvider: 'kreuzwerker/docker ~> 3.0',
        defaultRegion: 'localhost',
        regions: [
            { code: 'local:docker', name: 'Local Docker Daemon (:4500–4900)', latencyHintMs: 1, greenEnergy: true },
        ],
        services: {
            compute: 'Docker Container Engine (/var/run/docker.sock)',
            database: 'PostgreSQL 16 Alpine Container',
            registry: 'Local Docker Image Cache',
            secrets: 'Local Runtime Env (.env)',
            monitoring: 'Docker Inspect + Container Log Stream',
        },
        keylessAuth: {
            mechanism: 'Unix Socket (/var/run/docker.sock) via execFile',
            setupCliSnippet: `docker info && docker ps --filter "name=orbitron-live-"`,
            githubActionsAction: 'docker/build-push-action@v6',
        },
    },
};

/**
 * Generates a deterministic OpenTofu / Terraform Plan Diff for a deployment (Faz 1 — B5 & B8).
 */
export function buildStructuredPlanDiff(params: {
    provider: CloudProviderId;
    projectName: string;
    environment: string;
    region: string;
    hasDatabase: boolean;
    files: { name: string; content: string }[];
}): {
    iacHash: string;
    tofuVersion: string;
    summary: { add: number; change: number; destroy: number };
    resources: PlanResourceChange[];
} {
    const slug = params.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const env = params.environment || 'production';
    const combinedContent = params.files.map((f) => `${f.name}:${f.content}`).join('\n');
    const iacHash = crypto.createHash('sha256').update(combinedContent).digest('hex').substring(0, 16);

    const resources: PlanResourceChange[] = [];

    if (params.provider === 'gcp') {
        resources.push(
            {
                address: `google_artifact_registry_repository.${slug}_repo`,
                resourceType: 'google_artifact_registry_repository',
                provider: 'gcp',
                action: 'create',
                summary: `Docker repository in ${params.region}`,
                estimatedMonthlyUsd: 2.5,
            },
            {
                address: `google_cloud_run_v2_service.${slug}_service`,
                resourceType: 'google_cloud_run_v2_service',
                provider: 'gcp',
                action: 'create',
                summary: `Cloud Run v2 service (${env}) with Gen2 execution & autoscaling`,
                estimatedMonthlyUsd: 22.5,
            },
            ...(params.hasDatabase
                ? [
                      {
                          address: `google_sql_database_instance.${slug}_postgres`,
                          resourceType: 'google_sql_database_instance',
                          provider: 'gcp' as const,
                          action: 'create' as const,
                          summary: `Cloud SQL PostgreSQL 16 instance in ${params.region}`,
                          estimatedMonthlyUsd: 21.9,
                      },
                  ]
                : []),
        );
    } else if (params.provider === 'azure') {
        resources.push(
            {
                address: `azurerm_resource_group.${slug}_rg`,
                resourceType: 'azurerm_resource_group',
                provider: 'azure',
                action: 'create',
                summary: `Azure Resource Group rg-${slug}-${env} (${params.region})`,
                estimatedMonthlyUsd: 0,
            },
            {
                address: `azurerm_container_app_environment.${slug}_env`,
                resourceType: 'azurerm_container_app_environment',
                provider: 'azure',
                action: 'create',
                summary: `Managed Container Apps Environment with Log Analytics`,
                estimatedMonthlyUsd: 13.5,
            },
            {
                address: `azurerm_container_app.${slug}_app`,
                resourceType: 'azurerm_container_app',
                provider: 'azure',
                action: 'create',
                summary: `Container App (${env}) with HTTP ingress & replica scaling`,
                estimatedMonthlyUsd: 26.8,
            },
            ...(params.hasDatabase
                ? [
                      {
                          address: `azurerm_postgresql_flexible_server.${slug}_postgres`,
                          resourceType: 'azurerm_postgresql_flexible_server',
                          provider: 'azure' as const,
                          action: 'create' as const,
                          summary: `PostgreSQL 16 Flexible Server (32GB P4 Managed Disk)`,
                          estimatedMonthlyUsd: 24.1,
                      },
                  ]
                : []),
        );
    } else if (params.provider === 'kubernetes') {
        resources.push(
            {
                address: `kubernetes_namespace.${slug}_ns`,
                resourceType: 'kubernetes_namespace',
                provider: 'kubernetes',
                action: 'create',
                summary: `Isolated namespace orbitron-${env}`,
                estimatedMonthlyUsd: 0,
            },
            {
                address: `kubernetes_deployment.${slug}`,
                resourceType: 'kubernetes_deployment',
                provider: 'kubernetes',
                action: 'create',
                summary: `Pod replica set with readinessProbe & CPU/RAM limits`,
                estimatedMonthlyUsd: 28.0,
            },
            {
                address: `kubernetes_horizontal_pod_autoscaler_v2.${slug}_hpa`,
                resourceType: 'kubernetes_horizontal_pod_autoscaler_v2',
                provider: 'kubernetes',
                action: 'create',
                summary: `HPA v2 scaling pods at 75% CPU threshold`,
                estimatedMonthlyUsd: 0,
            },
        );
    } else {
        resources.push(
            {
                address: `module.vpc_${slug}.aws_vpc.main`,
                resourceType: 'aws_vpc',
                provider: 'aws',
                action: 'create',
                summary: `Multi-AZ VPC (10.20.0.0/16) in ${params.region}`,
                estimatedMonthlyUsd: 21.8,
            },
            {
                address: `module.ecs_${slug}.aws_ecs_service.app`,
                resourceType: 'aws_ecs_service',
                provider: 'aws',
                action: 'create',
                summary: `ECS Fargate ARM64 Graviton2 service (${env})`,
                estimatedMonthlyUsd: 34.2,
            },
            {
                address: `aws_appautoscaling_target.ecs_target`,
                resourceType: 'aws_appautoscaling_target',
                provider: 'aws',
                action: 'create',
                summary: `Application Auto Scaling target + CloudWatch SAAV alarms`,
                estimatedMonthlyUsd: 0,
            },
            ...(params.hasDatabase
                ? [
                      {
                          address: `module.ecs_${slug}.aws_db_instance.postgres`,
                          resourceType: 'aws_db_instance',
                          provider: 'aws' as const,
                          action: 'create' as const,
                          summary: `Amazon RDS PostgreSQL 16 (db.t4g, gp3 encrypted)`,
                          estimatedMonthlyUsd: 26.4,
                      },
                  ]
                : []),
        );
    }

    return {
        iacHash,
        tofuVersion: 'OpenTofu v1.8.2 / Terraform v1.8 compatible',
        summary: {
            add: resources.filter((r) => r.action === 'create').length,
            change: resources.filter((r) => r.action === 'update').length,
            destroy: resources.filter((r) => r.action === 'delete').length,
        },
        resources,
    };
}

