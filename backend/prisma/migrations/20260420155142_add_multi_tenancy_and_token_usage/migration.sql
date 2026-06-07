-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AgentTaskType" AS ENUM ('analysis', 'iac_generation', 'k8s_ops', 'cost_calc', 'incident_rca', 'monitoring', 'pipeline');

-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'starter';

-- AlterTable
ALTER TABLE "deployments" ADD COLUMN     "github_branch" TEXT,
ADD COLUMN     "github_repo" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "github_token" TEXT,
ADD COLUMN     "github_username" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "k8s_namespace" TEXT NOT NULL,
    "monthly_token_budget" INTEGER NOT NULL DEFAULT 50000,
    "stripe_customer_id" TEXT,
    "stripe_sub_id" TEXT,
    "aws_region" TEXT NOT NULL DEFAULT 'us-east-1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usages" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "task_type" "AgentTaskType" NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "execution_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_executions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "steps" TEXT NOT NULL DEFAULT '[]',
    "toolCalls" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cpu_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mem_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "req_per_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active_conns" INTEGER NOT NULL DEFAULT 0,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scaling_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "before_value" INTEGER NOT NULL DEFAULT 1,
    "after_value" INTEGER NOT NULL DEFAULT 2,
    "applied_by" TEXT NOT NULL DEFAULT 'agent',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scaling_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_k8s_namespace_key" ON "organizations"("k8s_namespace");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_org_id_user_id_key" ON "organization_members"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "token_usages_org_id_created_at_idx" ON "token_usages"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_executions_user_id_agent_id_idx" ON "agent_executions"("user_id", "agent_id");

-- CreateIndex
CREATE INDEX "system_metrics_user_id_recorded_at_idx" ON "system_metrics"("user_id", "recorded_at");

-- CreateIndex
CREATE INDEX "scaling_events_user_id_idx" ON "scaling_events"("user_id");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usages" ADD CONSTRAINT "token_usages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
