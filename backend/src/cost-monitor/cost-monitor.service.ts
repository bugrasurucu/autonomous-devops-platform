import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// ─── Pricing Tiers ──────────────────────────────────────────────
export const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        description: 'Personal use and evaluation',
        color: '#34d399',
        limits: {
            deploysPerMonth: 3,
            agentRunsPerMonth: 10,
            storageGB: 1,
            teamMembers: 1,
            awsBudgetUSD: 0,
            retentionDays: 7,
        },
        features: [
            '3 deploys/mo',
            '10 agent runs',
            '1 GB storage',
            'GitHub integration',
            'Community support',
        ],
        notIncluded: [
            'Custom domain',
            'SLA guarantee',
            'Priority support',
            'Multi-environment',
        ],
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 10,
        currency: 'USD',
        description: 'Ideal for small teams',
        color: '#818cf8',
        popular: false,
        limits: {
            deploysPerMonth: 20,
            agentRunsPerMonth: 100,
            storageGB: 10,
            teamMembers: 3,
            awsBudgetUSD: 50,
            retentionDays: 30,
        },
        features: [
            '20 deploys/mo',
            '100 agent runs',
            '10 GB storage',
            '3 team members',
            '$50 AWS budget',
            'Email support',
        ],
        notIncluded: [
            'Custom domain',
            'SLA guarantee',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 49,
        currency: 'USD',
        description: 'For growing companies',
        color: '#fbbf24',
        popular: true,
        limits: {
            deploysPerMonth: 100,
            agentRunsPerMonth: 500,
            storageGB: 50,
            teamMembers: 10,
            awsBudgetUSD: 500,
            retentionDays: 90,
        },
        features: [
            'Unlimited deploys',
            '500 agent runs',
            '50 GB storage',
            '10 team members',
            '$500 AWS budget',
            'Self-healing automation',
            'Priority support',
            'Custom domain',
        ],
        notIncluded: ['SLA guarantee'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        currency: 'USD',
        description: 'Enterprise and custom solutions',
        color: '#f87171',
        limits: {
            deploysPerMonth: -1,
            agentRunsPerMonth: -1,
            storageGB: -1,
            teamMembers: -1,
            awsBudgetUSD: -1,
            retentionDays: 365,
        },
        features: [
            'Unlimited everything',
            'Custom SLA',
            'Dedicated support',
            'On-premise option',
            'Azure & GCP support',
            'Custom integrations',
        ],
        notIncluded: [],
    },
];

// ─── AWS Free Tier Info ──────────────────────────────────────────
export const AWS_FREE_TIER = [
    { service: 'EC2 t2.micro', limit: '750 hrs/mo', note: 'First 12 months' },
    { service: 'RDS db.t3.micro', limit: '750 hrs/mo', note: 'First 12 months' },
    { service: 'S3', limit: '5 GB storage', note: 'Always free' },
    { service: 'Lambda', limit: '1M requests/mo', note: 'Always free' },
    { service: 'CloudWatch', limit: '10 metrics', note: 'Always free' },
    { service: 'ECR', limit: '500 MB/mo', note: 'Always free' },
    { service: 'CloudFront', limit: '1 TB transfer', note: 'First 12 months' },
    { service: 'SQS', limit: '1M requests/mo', note: 'Always free' },
];

// ─── Cost Estimate Templates ─────────────────────────────────────
const MONTHLY_COST_ESTIMATES = {
    tiny: { label: 'Small Project', ecs: 8, rds: 14, alb: 18, misc: 5, total: 45 },
    small: { label: 'Startup', ecs: 25, rds: 28, alb: 18, misc: 10, total: 81 },
    medium: { label: 'Growing Company', ecs: 90, rds: 85, alb: 25, misc: 30, total: 230 },
    large: { label: 'Enterprise', ecs: 400, rds: 300, alb: 60, misc: 100, total: 860 },
};

@Injectable()
export class CostMonitorService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    getTiers() {
        return PRICING_TIERS;
    }

    getAwsFreeTier() {
        return AWS_FREE_TIER;
    }

    getCostEstimates() {
        return MONTHLY_COST_ESTIMATES;
    }

    async getMonthlyUsage(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [user, deploys, agentRuns] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
            this.prisma.deployment.count({
                where: { userId, createdAt: { gte: startOfMonth } },
            }),
            this.prisma.agentExecution.count({
                where: { userId, createdAt: { gte: startOfMonth } },
            }),
        ]);

        const plan = user?.plan || 'free';
        const tier = PRICING_TIERS.find(t => t.id === plan) || PRICING_TIERS[0];
        const limits = tier.limits;

        const deployPct = limits.deploysPerMonth === -1 ? 0 : Math.round((deploys / limits.deploysPerMonth) * 100);
        const agentPct = limits.agentRunsPerMonth === -1 ? 0 : Math.round((agentRuns / limits.agentRunsPerMonth) * 100);

        // Simulate storage usage
        const storageUsed = Math.round(deploys * 0.15 * 10) / 10;
        const storagePct = limits.storageGB === -1 ? 0 : Math.round((storageUsed / limits.storageGB) * 100);

        // Estimated AWS monthly cost based on deployment count
        let estimatedCost = 0;
        if (deploys > 0) {
            estimatedCost = Math.round(deploys * 2.5 * 100) / 100;
        }

        return {
            plan,
            tier: { name: tier.name, price: tier.price, color: tier.color },
            usage: {
                deploys: { used: deploys, limit: limits.deploysPerMonth, pct: Math.min(deployPct, 100) },
                agentRuns: { used: agentRuns, limit: limits.agentRunsPerMonth, pct: Math.min(agentPct, 100) },
                storage: { used: storageUsed, limit: limits.storageGB, pct: Math.min(storagePct, 100), unit: 'GB' },
            },
            estimatedCost,
            awsBudget: limits.awsBudgetUSD,
        };
    }

    async getMetrics(userId: string) {
        // Return last 10 system metrics or simulated recent values
        const recent = await this.prisma.systemMetrics.findMany({
            where: { userId },
            orderBy: { recordedAt: 'desc' },
            take: 1,
        });

        if (recent.length > 0) {
            return recent[0];
        }

        // Seeded realistic metrics based on deploy count
        const deploys = await this.prisma.deployment.count({ where: { userId } });
        const base = Math.min(deploys * 8, 75);
        return {
            cpuPercent: base + Math.random() * 15,
            memPercent: base * 0.9 + Math.random() * 10,
            reqPerSec: deploys * 12 + Math.random() * 20,
            errorRate: Math.random() * 2,
            activeConns: deploys * 5 + Math.floor(Math.random() * 10),
        };
    }

    async recordMetrics(userId: string, metrics: { cpuPercent: number; memPercent: number; reqPerSec: number; errorRate: number; activeConns: number }) {
        return this.prisma.systemMetrics.create({
            data: { userId, ...metrics },
        });
    }

    async getSmartSuggestions(userId: string) {
        const [usage, metrics] = await Promise.all([
            this.getMonthlyUsage(userId),
            this.getMetrics(userId),
        ]);

        const suggestions: any[] = [];

        // Deploy limit warnings
        if (usage.usage.deploys.pct >= 90) {
            suggestions.push({
                id: 'deploy-limit',
                type: 'warning',
                priority: 'critical',
                icon: '🚨',
                title: 'Deploy limit almost reached!',
                description: `You've used ${usage.usage.deploys.pct}% of your monthly limit (${usage.usage.deploys.used}/${usage.usage.deploys.limit} deploys).`,
                action: 'Upgrade Plan',
                actionType: 'upgrade',
            });
        } else if (usage.usage.deploys.pct >= 70) {
            suggestions.push({
                id: 'deploy-warn',
                type: 'info',
                priority: 'medium',
                icon: '⚠️',
                title: 'Reached 70% of deploy limit',
                description: `${usage.usage.deploys.limit - usage.usage.deploys.used} deploys remaining.`,
                action: 'View Plan',
                actionType: 'view-plan',
            });
        }

        // CPU scaling
        if (metrics.cpuPercent >= 85) {
            suggestions.push({
                id: 'scale-cpu',
                type: 'action',
                priority: 'critical',
                icon: '🔥',
                title: `CPU ${Math.round(metrics.cpuPercent)}% — Scaling required`,
                description: 'Scale ECS tasks from 2 to 4 to distribute the load. Estimated extra cost: $3/day.',
                action: '⚡ Scale Up',
                actionType: 'scale-up-ecs',
                metric: { current: Math.round(metrics.cpuPercent), threshold: 85, unit: '%' },
            });
        } else if (metrics.cpuPercent >= 70) {
            suggestions.push({
                id: 'cpu-warn',
                type: 'warning',
                priority: 'medium',
                icon: '📈',
                title: `CPU ${Math.round(metrics.cpuPercent)}% — Worth monitoring`,
                description: 'CPU usage is increasing. Normal if load testing, otherwise worth investigating.',
                action: 'Investigate',
                actionType: 'view-metrics',
                metric: { current: Math.round(metrics.cpuPercent), threshold: 70, unit: '%' },
            });
        }

        // Memory scaling
        if (metrics.memPercent >= 90) {
            suggestions.push({
                id: 'scale-mem',
                type: 'action',
                priority: 'critical',
                icon: '💾',
                title: `Memory ${Math.round(metrics.memPercent)}% — Critical!`,
                description: 'Memory is nearly full. Recommended to add 512MB to ECS task.',
                action: '⚡ Increase Memory',
                actionType: 'scale-mem-ecs',
                metric: { current: Math.round(metrics.memPercent), threshold: 90, unit: '%' },
            });
        }

        // Cost optimization
        if (usage.estimatedCost > 100) {
            suggestions.push({
                id: 'cost-opt',
                type: 'saving',
                priority: 'low',
                icon: '💰',
                title: 'Switch to Graviton, save ~30%',
                description: `Migrate from x86 to Graviton2 instances to save an estimated $${Math.round(usage.estimatedCost * 0.3)}/mo.`,
                action: 'View Analysis',
                actionType: 'cost-analysis',
            });
        }

        // Free tier AWS suggestions
        if (usage.plan === 'free') {
            suggestions.push({
                id: 'free-aws',
                type: 'info',
                priority: 'low',
                icon: '🆓',
                title: 'Use AWS Free Tier',
                description: 'EC2 t2.micro, RDS db.t3.micro (750 hrs/mo) and Lambda (1M requests/mo) are free!',
                action: 'View Guide',
                actionType: 'view-free-tier',
            });
        }

        // Error rate
        if (metrics.errorRate >= 5) {
            suggestions.push({
                id: 'error-rate',
                type: 'warning',
                priority: 'high',
                icon: '🐛',
                title: `Error rate ${Math.round(metrics.errorRate)}% — High!`,
                description: 'Error rate exceeded normal levels in the last 15 minutes. Run the SRE agent.',
                action: '🤖 Trigger SRE Agent',
                actionType: 'trigger-sre',
            });
        }

        // Sort by priority
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return suggestions.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
    }

    async applyScaling(userId: string, action: string) {
        const actionMap: Record<string, { before: number; after: number; cost: number; label: string }> = {
            'scale-up-ecs': { before: 2, after: 4, cost: 3.2, label: 'ECS tasks 2 → 4' },
            'scale-down-ecs': { before: 4, after: 2, cost: -3.2, label: 'ECS tasks 4 → 2' },
            'scale-mem-ecs': { before: 1024, after: 2048, cost: 1.5, label: 'ECS memory 1024MB → 2048MB' },
            'increase-rds': { before: 1, after: 2, cost: 14, label: 'RDS db.t3.micro → db.t3.small' },
        };

        const spec = actionMap[action];
        if (!spec) throw new Error(`Unknown scaling action: ${action}`);

        const event = await this.prisma.scalingEvent.create({
            data: {
                userId,
                action,
                reason: 'User triggered from dashboard suggestion',
                beforeValue: spec.before,
                afterValue: spec.after,
                appliedBy: 'user',
                cost: spec.cost,
            },
        });

        this.eventEmitter.emit('activity.new', {
            userId,
            text: `Scaling applied: ${spec.label}`,
            color: '#34d399',
            type: 'scaling',
        });

        return { success: true, event, label: spec.label };
    }

    async getScalingHistory(userId: string) {
        return this.prisma.scalingEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
}
