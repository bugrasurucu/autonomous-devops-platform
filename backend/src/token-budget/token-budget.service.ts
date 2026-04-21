import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentTaskType } from '@prisma/client';

// USD per 1K tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    'claude-haiku-4-5-20251001': { input: 0.0008,  output: 0.004  },
    'claude-sonnet-4-6':         { input: 0.003,   output: 0.015  },
    'gpt-4.1-mini':              { input: 0.0004,  output: 0.0016 },
};

// Which model to use per task type (cost optimized)
const TASK_MODEL_ROUTING: Record<AgentTaskType, string> = {
    analysis:      'claude-haiku-4-5-20251001',
    iac_generation:'claude-sonnet-4-6',
    k8s_ops:       'gpt-4.1-mini',
    cost_calc:     'claude-haiku-4-5-20251001',
    incident_rca:  'claude-sonnet-4-6',
    monitoring:    'claude-haiku-4-5-20251001',
    pipeline:      'claude-haiku-4-5-20251001',
};

export interface TokenUsageRecord {
    inputTokens: number;
    outputTokens: number;
    model: string;
}

@Injectable()
export class TokenBudgetService {
    constructor(private prisma: PrismaService) {}

    selectModel(taskType: AgentTaskType): string {
        return TASK_MODEL_ROUTING[taskType] ?? 'claude-haiku-4-5-20251001';
    }

    calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['claude-haiku-4-5-20251001'];
        return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    }

    async getMonthlyUsage(orgId: string): Promise<{ tokens: number; costUsd: number }> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const result = await this.prisma.tokenUsage.aggregate({
            where: { orgId, createdAt: { gte: startOfMonth } },
            _sum: { inputTokens: true, outputTokens: true, costUsd: true },
        });

        return {
            tokens: (result._sum.inputTokens ?? 0) + (result._sum.outputTokens ?? 0),
            costUsd: result._sum.costUsd ?? 0,
        };
    }

    async checkBudget(orgId: string, estimatedTokens: number): Promise<void> {
        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) throw new ForbiddenException('Organization not found');

        const { tokens } = await this.getMonthlyUsage(orgId);
        if (tokens + estimatedTokens > org.monthlyTokenBudget) {
            throw new ForbiddenException(
                `Monthly token quota exceeded (${tokens}/${org.monthlyTokenBudget}). Upgrade your plan.`,
            );
        }
    }

    async recordUsage(
        orgId: string,
        agentId: string,
        taskType: AgentTaskType,
        usage: TokenUsageRecord,
        executionId?: string,
    ) {
        const costUsd = this.calculateCost(usage.model, usage.inputTokens, usage.outputTokens);
        return this.prisma.tokenUsage.create({
            data: {
                orgId,
                agentId,
                taskType,
                model: usage.model,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                costUsd,
                executionId,
            },
        });
    }

    async getUsageBreakdown(orgId: string) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const byModel = await this.prisma.tokenUsage.groupBy({
            by: ['model'],
            where: { orgId, createdAt: { gte: startOfMonth } },
            _sum: { inputTokens: true, outputTokens: true, costUsd: true },
        });

        const byAgent = await this.prisma.tokenUsage.groupBy({
            by: ['agentId'],
            where: { orgId, createdAt: { gte: startOfMonth } },
            _sum: { inputTokens: true, outputTokens: true, costUsd: true },
        });

        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        const { tokens, costUsd } = await this.getMonthlyUsage(orgId);

        return {
            monthlyBudgetTokens: org?.monthlyTokenBudget ?? 50000,
            usedTokens: tokens,
            costUsd,
            byModel,
            byAgent,
        };
    }
}
