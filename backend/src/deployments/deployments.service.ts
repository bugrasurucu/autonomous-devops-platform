import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../agents/agents.service';
import { KagentBridgeService } from '../kagent-bridge/kagent-bridge.service';
import { TokenBudgetService } from '../token-budget/token-budget.service';
import { TenantsService } from '../tenants/tenants.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Counter, Gauge, Histogram } from 'prom-client';

const deployCounter = new Counter({
    name: 'orbitron_deployments_total',
    help: 'Total number of deployments executed',
    labelNames: ['status', 'environment'],
});

const deployCostGauge = new Gauge({
    name: 'orbitron_deployment_cost_usd',
    help: 'Cost of the last deployment in USD',
    labelNames: ['environment'],
});

const deployDurationHist = new Histogram({
    name: 'orbitron_deployment_duration_seconds',
    help: 'Duration of deployments in seconds',
    labelNames: ['environment'],
    buckets: [10, 30, 60, 120, 300, 600],
});

// Deployment stages — sequential order
const DEPLOY_STAGES = [
    { id: 'bootstrap-agent', label: 'Repo Analysis',        taskType: 'analysis'       as const },
    { id: 'infra-agent',     label: 'Infrastructure',       taskType: 'iac_generation' as const },
    { id: 'finops-agent',    label: 'FinOps Validation',    taskType: 'cost_calc'      as const },
    { id: 'pipeline-agent',  label: 'CI/CD Pipeline',       taskType: 'pipeline'       as const },
    { id: 'sre-agent',       label: 'SRE Monitoring Setup', taskType: 'monitoring'     as const },
];

@Injectable()
export class DeploymentsService {
    private readonly logger = new Logger(DeploymentsService.name);

    constructor(
        private prisma: PrismaService,
        private agentsService: AgentsService,
        private kagentBridge: KagentBridgeService,
        private tokenBudget: TokenBudgetService,
        private tenants: TenantsService,
        private eventEmitter: EventEmitter2,
    ) {}

    async create(
        userId: string,
        data: {
            projectName: string;
            region?: string;
            environment?: string;
            budget?: number;
            sourceType?: string;
            sourceValue?: string;
        },
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        
        // Grant unlimited limits for Buğrahan Sürücü, otherwise check limit
        const isBugrahan = user.email.includes('bugrahan') || user.name.toLowerCase().includes('buğrahan');
        if (!isBugrahan && user.deployCount >= user.deployLimit) {
            throw new Error(`Deploy limit reached (${user.deployLimit}). Please upgrade your plan.`);
        }

        const deployId = `DEP-${Date.now()}`;
        const flowNodes = DEPLOY_STAGES.map(s => ({ id: s.id, label: s.label, status: 'pending' }));

        const deployment = await this.prisma.deployment.create({
            data: {
                userId,
                deployId,
                projectName: data.projectName,
                region: data.region ?? 'us-east-1',
                environment: data.environment ?? 'production',
                budget: data.budget ?? 0,
                status: 'running',
                stages: JSON.stringify(flowNodes),
                githubRepo: data.sourceValue,
                githubBranch: data.sourceType,
            },
        });

        // Increment user's deploy count
        await this.prisma.user.update({
            where: { id: userId },
            data: { deployCount: { increment: 1 } },
        });

        this.eventEmitter.emit('activity.new', {
            userId,
            text: `Deploy started: ${data.projectName}${data.sourceValue ? ` (${data.sourceValue})` : ''} [${deployId}]`,
            color: '#818cf8',
            type: 'deploy_start',
            deployId,
        });

        this.eventEmitter.emit('orchestration.updated', {
            userId, currentFlow: deployId, pattern: 'sequential', nodes: flowNodes,
        });

        // Run orchestration async — don't block HTTP response
        this.runOrchestration(userId, deployId, flowNodes, data).catch(err => {
            this.logger.error(`Orchestration failed for ${deployId}: ${err.message}`);
        });

        return { deployId, message: 'Deploy started' };
    }

    async findAll(userId: string, limit = 20) {
        return this.prisma.deployment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async stop(userId: string, id: string) {
        const deployment = await this.prisma.deployment.findFirst({ where: { id, userId } });
        if (!deployment) throw new Error('Deployment not found');
        return this.prisma.deployment.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    async delete(userId: string, id: string) {
        const deployment = await this.prisma.deployment.findFirst({ where: { id, userId } });
        if (!deployment) throw new Error('Deployment not found');
        return this.prisma.deployment.delete({
            where: { id },
        });
    }

    async findOne(userId: string, deployId: string) {
        return this.prisma.deployment.findFirst({ where: { userId, deployId } });
    }

    private async runOrchestration(userId: string, deployId: string, nodes: any[], config: any) {
        const startTime = Date.now();
        const org = await this.tenants.getOrCreateOrgForUser(userId);
        let totalCost = 0;
        let failed = false;

        for (let i = 0; i < DEPLOY_STAGES.length; i++) {
            const stage = DEPLOY_STAGES[i];
            const node = nodes[i];

            node.status = 'running';
            this.agentsService.setAgentStatus(userId, stage.id, 'working');
            this.eventEmitter.emit('orchestration.updated', {
                userId, currentFlow: deployId, pattern: 'sequential', nodes: [...nodes],
            });
            this.eventEmitter.emit('activity.new', {
                userId,
                text: `[${deployId}] ${stage.label}: Processing...`,
                color: '#818cf8', type: 'stage_start', deployId, agentId: stage.id,
            });

            try {
                const model = this.tokenBudget.selectModel(stage.taskType);

                const task = this.buildStageTask(stage.id, config, nodes
                    .slice(0, i)
                    .filter(n => n.status === 'completed')
                    .map(n => n.result ?? '')
                    .join('\n'));

                const result = await this.kagentBridge.invokeAgent(
                    stage.id,
                    {
                        task,
                        namespace: `tenant-${org.id.substring(0, 8)}`,
                        model,
                        maxTokens: stage.taskType === 'iac_generation' ? 8192 : 4096,
                    },
                    (step, idx) => {
                        this.eventEmitter.emit('agent.step', {
                            userId, agentId: stage.id, deployId, step, stepIndex: idx,
                        });
                    },
                );

                // Record token usage
                await this.tokenBudget.recordUsage(org.id, stage.id, stage.taskType, result.usage);
                totalCost += this.tokenBudget.calculateCost(
                    result.usage.model, result.usage.inputTokens, result.usage.outputTokens
                );

                node.status = 'completed';
                node.result = result.result;
                this.agentsService.setAgentStatus(userId, stage.id, 'idle');

                this.eventEmitter.emit('activity.new', {
                    userId,
                    text: `[${deployId}] ${stage.label}: Completed`,
                    color: '#34d399', type: 'stage_complete', deployId, agentId: stage.id,
                });

                // FinOps blocked → stop orchestration
                if (stage.id === 'finops-agent' && result.result?.includes('BLOCKED')) {
                    this.logger.warn(`[${deployId}] FinOps blocked deployment`);
                    nodes.slice(i + 1).forEach(n => (n.status = 'blocked'));
                    failed = true;
                    break;
                }

            } catch (err: any) {
                node.status = 'failed';
                failed = true;
                this.agentsService.setAgentStatus(userId, stage.id, 'error');
                this.logger.error(`[${deployId}] ${stage.label} failed: ${err.message}`);
                this.eventEmitter.emit('activity.new', {
                    userId,
                    text: `[${deployId}] ${stage.label}: Failed — ${err.message?.substring(0, 80)}`,
                    color: '#f87171', type: 'stage_error', deployId, agentId: stage.id,
                });
                // Mark remaining as blocked
                nodes.slice(i + 1).forEach(n => (n.status = 'blocked'));
                break;
            }

            this.eventEmitter.emit('orchestration.updated', {
                userId, currentFlow: deployId, pattern: 'sequential', nodes: [...nodes],
            });
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        const finalStatus = failed ? 'failed' : 'success';

        await this.prisma.deployment.update({
            where: { deployId },
            data: {
                status: finalStatus,
                cost: +totalCost.toFixed(4),
                duration,
                completedAt: new Date(),
                stages: JSON.stringify(nodes),
            },
        });

        this.eventEmitter.emit('activity.new', {
            userId,
            text: `Deploy ${deployId} ${finalStatus} in ${duration}s — AI cost: $${totalCost.toFixed(4)}`,
            color: failed ? '#f87171' : '#34d399',
            type: failed ? 'deploy_failed' : 'deploy_complete',
            deployId,
        });

        this.eventEmitter.emit(failed ? 'deploy.failed' : 'deploy.success', {
            userId,
            deployId,
            projectName: config.projectName,
            region: config.region,
            status: finalStatus,
            cost: totalCost,
            duration
        });

        // Prometheus Metrics
        deployCounter.inc({ status: finalStatus, environment: config.environment ?? 'production' });
        deployCostGauge.set({ environment: config.environment ?? 'production' }, totalCost);
        deployDurationHist.observe({ environment: config.environment ?? 'production' }, duration);

        this.logger.log(`Deploy ${deployId} ${finalStatus}: ${duration}s, $${totalCost.toFixed(4)}`);
    }

    private buildStageTask(agentId: string, config: any, previousContext: string): string {
        const ctx = previousContext ? `\n\nPrevious stages context:\n${previousContext}` : '';

        const tasks: Record<string, string> = {
            'bootstrap-agent': `Analyze the repository and determine optimal AWS architecture.
Project: ${config.projectName}
GitHub Repo: ${config.githubRepo ?? 'not provided'}
Branch: ${config.githubBranch ?? 'main'}
Target environment: ${config.environment ?? 'production'}
AWS Region: ${config.region ?? 'us-east-1'}${ctx}`,

            'infra-agent': `Generate Terraform infrastructure code for the project.
Project: ${config.projectName}
Region: ${config.region ?? 'us-east-1'}
Environment: ${config.environment ?? 'production'}
Run Checkov scan and fix any HIGH/CRITICAL findings.${ctx}`,

            'finops-agent': `Estimate monthly infrastructure cost and validate against budget.
Budget limit: $${config.budget ?? 50}/month
Project: ${config.projectName}
Return JSON with decision APPROVED or BLOCKED.${ctx}`,

            'pipeline-agent': `Generate GitHub Actions CI/CD pipeline for the project.
Project: ${config.projectName}
GitHub Repo: ${config.githubRepo ?? 'TBD'}
Branch: ${config.githubBranch ?? 'main'}
Include: lint, test, docker build (multi-arch), ECR push, ECS deploy.${ctx}`,

            'sre-agent': `Set up CloudWatch monitoring and self-healing for the deployment.
Project: ${config.projectName}
Environment: ${config.environment ?? 'production'}
Region: ${config.region ?? 'us-east-1'}
Create alarms for: CPU >80%, error rate >5%, latency p99 >2s.${ctx}`,
        };

        return tasks[agentId] ?? `Execute ${agentId} task for ${config.projectName}`;
    }
}
