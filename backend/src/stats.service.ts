import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AgentsService } from './agents/agents.service';

@Injectable()
export class StatsService {
    constructor(
        private prisma: PrismaService,
        private agentsService: AgentsService,
    ) { }

    async getStats(userId: string) {
        const [
            deploymentCount,
            activeDeployments,
            incidentStats,
            recentActivities,
        ] = await Promise.all([
            this.prisma.deployment.count({ where: { userId } }),
            this.prisma.deployment.count({ where: { userId, status: 'running' } }),
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

        return {
            totalDeploys: deploymentCount,
            activeDeploys: activeDeployments,
            totalAgents: agents.length,
            activeAgents,
            activeIncidents,
            agents,
            activities: recentActivities,
        };
    }
}
