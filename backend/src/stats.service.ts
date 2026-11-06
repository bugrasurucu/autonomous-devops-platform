import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from './prisma/prisma.service';
import { AgentsService } from './agents/agents.service';

@Injectable()
export class StatsService {
    constructor(
        private prisma: PrismaService,
        private agentsService: AgentsService,
    ) { }

    @OnEvent('activity.new')
    async handleNewActivity(payload: {
        userId: string;
        text: string;
        color?: string;
        type?: string;
        deployId?: string;
        agentId?: string;
    }) {
        if (!payload?.userId || !payload?.text) return;
        try {
            await this.prisma.activity.create({
                data: {
                    userId: payload.userId,
                    text: payload.text,
                    color: payload.color || '#818cf8',
                    type: payload.type || 'info',
                    deployId: payload.deployId || null,
                    agentId: payload.agentId || null,
                },
            });
        } catch {
            // Non-blocking activity log write
        }
    }

    async getActivities(userId: string, limit = 30) {
        return this.prisma.activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getStats(userId: string) {
        const [
            deploymentCount,
            activeDeployments,
            successDeployments,
            incidentStats,
            recentActivities,
        ] = await Promise.all([
            this.prisma.deployment.count({ where: { userId } }),
            this.prisma.deployment.count({ where: { userId, status: 'running' } }),
            this.prisma.deployment.count({ where: { userId, status: 'success' } }),
            this.prisma.incident.groupBy({
                by: ['status'],
                where: { userId },
                _count: true,
            }),
            this.prisma.activity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
        ]);

        const agents = this.agentsService.getAgents(userId);
        const activeAgents = agents.filter((a) => a.status === 'working').length;
        const activeIncidents =
            incidentStats.find((s: any) => s.status === 'active')?._count || 0;

        const successRate = deploymentCount > 0
            ? Math.round((successDeployments / deploymentCount) * 100)
            : 100;

        return {
            totalDeployments: deploymentCount,
            totalDeploys: deploymentCount, // backward compat
            activeDeploys: activeDeployments,
            successRate,
            totalAgents: agents.length,
            activeAgents,
            activeIncidents,
            agents,
            activities: recentActivities,
        };
    }
}
