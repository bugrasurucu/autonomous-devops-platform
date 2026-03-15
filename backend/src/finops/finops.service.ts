import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinopsService {
    constructor(private prisma: PrismaService) { }

    async getFinOps(userId: string) {
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
                title: 'Use Spot Instances for non-critical workloads',
                savings: '$45/month',
                impact: 'medium',
                status: 'available',
            },
            {
                id: 'right-size',
                title: 'Right-size RDS instance (db.t3.medium → db.t3.small)',
                savings: '$22/month',
                impact: 'low',
                status: 'available',
            },
            {
                id: 'reserved',
                title: 'Switch to Reserved Instances (1-year)',
                savings: '$120/month',
                impact: 'high',
                status: 'requires_review',
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
