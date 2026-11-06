import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinopsService {
    private appliedOptimizations = new Map<string, Set<string>>();

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async applyOptimization(userId: string, optId: string) {
        const userSet = this.appliedOptimizations.get(userId) || new Set<string>();
        const alreadyApplied = userSet.has(optId);
        userSet.add(optId);
        this.appliedOptimizations.set(userId, userSet);

        const discountFactor =
            optId === 'spot-instances' ? 0.82 : optId === 'right-size' ? 0.88 : 0.78;

        if (!alreadyApplied) {
            const deploys = await this.prisma.deployment.findMany({
                where: { userId, cost: { gt: 0 } },
                take: 30,
            });
            await Promise.all(
                deploys.map((d) =>
                    this.prisma.deployment.update({
                        where: { id: d.id },
                        data: { cost: +(d.cost * discountFactor).toFixed(2) },
                    }),
                ),
            );

            this.eventEmitter.emit('activity.new', {
                userId,
                text: `💰 FinOps Optimization Applied: ${optId} (-${Math.round((1 - discountFactor) * 100)}% monthly infrastructure cost)`,
                color: '#34d399',
                type: 'finops_optimize',
                agentId: 'finops-agent',
            });
        }

        return this.getFinOps(userId);
    }

    async getFinOps(userId: string) {
        const appliedSet = this.appliedOptimizations.get(userId) || new Set<string>();
        const deployments = await this.prisma.deployment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });

        const totalCost = deployments.reduce((sum, d) => sum + d.cost, 0);
        const thisMonth = deployments.filter(
            (d) => d.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        );
        const monthlyCost = thisMonth.reduce((sum, d) => sum + d.cost, 0);

        // Cost breakdown by service (simulated)
        const breakdown = [
            { service: 'ECS Fargate', cost: +(monthlyCost * 0.35).toFixed(2), percentage: 35 },
            { service: 'RDS PostgreSQL', cost: +(monthlyCost * 0.25).toFixed(2), percentage: 25 },
            { service: 'ALB / Networking', cost: +(monthlyCost * 0.15).toFixed(2), percentage: 15 },
            { service: 'S3 / Storage', cost: +(monthlyCost * 0.10).toFixed(2), percentage: 10 },
            { service: 'CloudWatch', cost: +(monthlyCost * 0.08).toFixed(2), percentage: 8 },
            { service: 'Other', cost: +(monthlyCost * 0.07).toFixed(2), percentage: 7 },
        ];

        // Optimization recommendations
        const optimizations = [
            {
                id: 'spot-instances',
                title: 'Use Spot Instances & ARM64 Graviton2 for ECS Fargate tasks',
                savings: '$45/month (-18%)',
                impact: 'medium',
                status: appliedSet.has('spot-instances') ? 'applied' : 'available',
            },
            {
                id: 'right-size',
                title: 'Right-size RDS PostgreSQL instance (db.t3.medium → db.t4g.small)',
                savings: '$22/month (-12%)',
                impact: 'low',
                status: appliedSet.has('right-size') ? 'applied' : 'available',
            },
            {
                id: 'reserved',
                title: 'Switch production compute to 1-year Compute Savings Plan',
                savings: '$120/month (-22%)',
                impact: 'high',
                status: appliedSet.has('reserved') ? 'applied' : 'available',
            },
        ];

        return {
            totalCost: +totalCost.toFixed(2),
            monthlyCost: +monthlyCost.toFixed(2),
            monthlyBudget: 500,
            budgetUsage: Math.min(100, +((monthlyCost / 500) * 100).toFixed(1)),
            deployCount: thisMonth.length,
            avgCostPerDeploy: thisMonth.length > 0 ? +(monthlyCost / thisMonth.length).toFixed(2) : 0,
            breakdown,
            optimizations,
            trend: this.calculateTrend(deployments),
        };
    }

    private calculateTrend(deployments: any[]) {
        const last7Days: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStr = date.toISOString().split('T')[0];
            const dayCost = deployments
                .filter((d) => d.createdAt.toISOString().startsWith(dayStr))
                .reduce((sum, d) => sum + d.cost, 0);
            last7Days.push(+dayCost.toFixed(2));
        }
        return last7Days;
    }
}
