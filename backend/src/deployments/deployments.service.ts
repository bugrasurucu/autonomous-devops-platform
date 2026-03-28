import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../agents/agents.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const FLOW_NODES = [
    { id: 'infra-agent', label: 'Infrastructure', status: 'pending' },
    { id: 'finops-agent', label: 'FinOps Validation', status: 'pending' },
    { id: 'pipeline-agent', label: 'CI/CD Pipeline', status: 'pending' },
    { id: 'sre-agent', label: 'SRE Monitoring', status: 'pending' },
];

@Injectable()
export class DeploymentsService {
    private readonly logger = new Logger(DeploymentsService.name);

    constructor(
        private prisma: PrismaService,
        private agentsService: AgentsService,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(
        userId: string,
        data: {
            projectName: string;
            region?: string;
            environment?: string;
            budget?: number;
            githubRepo?: string;
            githubBranch?: string;
        },
    ) {
        const deployId = `DEP-${Date.now()}`;
        const flowNodes = FLOW_NODES.map((n) => ({ ...n }));

        const deployment = await this.prisma.deployment.create({
            data: {
                userId,
                deployId,
                projectName: data.projectName,
                region: data.region || 'us-east-1',
                environment: data.environment || 'production',
                budget: data.budget || 0,
                status: 'running',
                stages: JSON.stringify(flowNodes),
                githubRepo: data.githubRepo,
                githubBranch: data.githubBranch,
            },
        });

        this.eventEmitter.emit('activity.new', {
            userId,
            text: `Deploy started: ${data.projectName}${data.githubRepo ? ` (${data.githubRepo})` : ''} [${deployId}]`,
            color: '#818cf8',
            type: 'deploy_start',
            deployId,
        });

        this.eventEmitter.emit('orchestration.updated', {
            userId,
            currentFlow: deployId,
            pattern: 'sequential',
            nodes: flowNodes,
        });

        // Run orchestration asynchronously
        this.runOrchestration(userId, deployId, flowNodes, data);

        return { deployId, message: 'Deploy started' };
    }

    async findAll(userId: string, limit = 20) {
        return this.prisma.deployment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findOne(userId: string, deployId: string) {
        return this.prisma.deployment.findFirst({
            where: { userId, deployId },
        });
    }

    private async runOrchestration(
        userId: string,
        deployId: string,
        nodes: any[],
        config: any,
    ) {
        const startTime = Date.now();

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.status = 'running';

            this.eventEmitter.emit('orchestration.updated', {
                userId,
                currentFlow: deployId,
                pattern: 'sequential',
                nodes: [...nodes],
            });

            this.agentsService.setAgentStatus(userId, node.id, 'working');

            this.eventEmitter.emit('activity.new', {
                userId,
                text: `[${deployId}] ${node.label}: Processing...`,
                color: '#818cf8',
                type: 'stage_start',
                deployId,
                agentId: node.id,
            });

            // Simulate agent work (3-5 seconds per stage)
            await this.sleep(3000 + Math.random() * 2000);

            node.status = 'completed';
            this.agentsService.setAgentStatus(userId, node.id, 'idle');

            this.eventEmitter.emit('activity.new', {
                userId,
                text: `[${deployId}] ${node.label}: Completed`,
                color: '#34d399',
                type: 'stage_complete',
                deployId,
                agentId: node.id,
            });

            this.eventEmitter.emit('orchestration.updated', {
                userId,
                currentFlow: deployId,
                pattern: 'sequential',
                nodes: [...nodes],
            });
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        const cost = +(Math.random() * 15 + 5).toFixed(2);

        await this.prisma.deployment.update({
            where: { deployId },
            data: {
                status: 'success',
                cost,
                duration,
                completedAt: new Date(),
                stages: JSON.stringify(nodes),
            },
        });

        this.eventEmitter.emit('activity.new', {
            userId,
            text: `Deploy ${deployId} completed in ${duration}s — Cost: $${cost}`,
            color: '#34d399',
            type: 'deploy_complete',
            deployId,
        });

        this.eventEmitter.emit('deploy.completed', {
            userId,
            deployId,
            status: 'success',
            cost,
            duration,
        });

        this.logger.log(`Deploy ${deployId} completed: ${duration}s, $${cost}`);
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
