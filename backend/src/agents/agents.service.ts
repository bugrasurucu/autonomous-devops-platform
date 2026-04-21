import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KagentBridgeService } from '../kagent-bridge/kagent-bridge.service';
import { TokenBudgetService } from '../token-budget/token-budget.service';
import { TenantsService } from '../tenants/tenants.service';

// Mirror of Prisma enum — available before `prisma generate` runs
type AgentTaskType = 'analysis' | 'iac_generation' | 'k8s_ops' | 'cost_calc' | 'incident_rca' | 'monitoring' | 'pipeline';

// ─── Agent Definitions ───────────────────────────────────────────

interface AgentDef {
    id: string;
    name: string;
    role: string;
    description: string;
    color: string;
    letter: string;
    emoji: string;
    taskType: AgentTaskType;
    capabilities: string[];
    mcpServers: string[];
}

const AGENT_DEFINITIONS: AgentDef[] = [
    {
        id: 'infra-agent',
        name: 'Infrastructure Agent',
        role: 'Platform & Infrastructure',
        description: 'Generates Terraform/CDK/CloudFormation templates, runs Checkov security scans, provisions VPC/ECS/RDS resources.',
        color: '#818cf8',
        letter: 'I',
        emoji: '🏗',
        taskType: 'iac_generation' as AgentTaskType,
        capabilities: ['terraform', 'cdk', 'cloudformation', 'checkov', 'vpc', 'ecs', 'rds', 'ecr', 'alb'],
        mcpServers: ['aws-cloud-control', 'aws-iac', 'aws-terraform', 'mcpdoc-aws'],
    },
    {
        id: 'pipeline-agent',
        name: 'Pipeline Agent',
        role: 'CI/CD & QA',
        description: 'Creates GitHub Actions pipelines, writes unit/integration/E2E tests, performs visual regression testing.',
        color: '#34d399',
        letter: 'P',
        emoji: '🔄',
        taskType: 'pipeline' as AgentTaskType,
        capabilities: ['github-actions', 'jest', 'pytest', 'docker', 'ecr-push', 'visual-qa', 'e2e'],
        mcpServers: ['mcpdoc-github-actions', 'mcpdoc-aws'],
    },
    {
        id: 'finops-agent',
        name: 'FinOps Agent',
        role: 'Financial Operations',
        description: 'Cost estimation with AWS Pricing API, budget enforcement via OPA/Rego, Graviton migration recommendations.',
        color: '#fbbf24',
        letter: 'F',
        emoji: '💰',
        taskType: 'cost_calc' as AgentTaskType,
        capabilities: ['cost-estimation', 'infracost', 'budget-validation', 'opa-rego', 'graviton', 'reserved-instances'],
        mcpServers: ['aws-pricing', 'mcpdoc-aws'],
    },
    {
        id: 'sre-agent',
        name: 'SRE Agent',
        role: 'Site Reliability',
        description: 'Self-healing via Sense→Analyze→Act→Verify cycles. CloudWatch anomaly detection, RAG-based Root Cause Analysis.',
        color: '#f87171',
        letter: 'S',
        emoji: '🛡',
        taskType: 'incident_rca' as AgentTaskType,
        capabilities: ['anomaly-detection', 'rca', 'auto-remediation', 'eventbridge', 'lambda', 'rag-rca'],
        mcpServers: ['aws-cloudwatch', 'mcpdoc-aws'],
    },
];

// ─── Runtime State ───────────────────────────────────────────────

export interface AgentState extends AgentDef {
    status: 'idle' | 'working' | 'error';
    lastActivity: string | null;
    stats: { totalRuns: number; successRate: number; avgDurationSec: number; lastError: string | null };
}

@Injectable()
export class AgentsService {
    private agentStates = new Map<string, Map<string, AgentState>>();

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
        private kagentBridge: KagentBridgeService,
        private tokenBudget: TokenBudgetService,
        private tenants: TenantsService,
    ) {}

    getAgents(userId: string) {
        return this.getUserAgents(userId);
    }

    getAgent(userId: string, agentId: string) {
        const agent = this.getUserAgents(userId).find((a) => a.id === agentId);
        if (!agent) throw new NotFoundException('Agent not found');
        return agent;
    }

    async triggerAgent(userId: string, agentId: string, task?: string) {
        const agent = this.getAgent(userId, agentId);
        const taskStr = task ?? `${agent.name}: Standard health check and optimization scan`;

        // Get or create tenant org
        const org = await this.tenants.getOrCreateOrgForUser(userId);

        // Estimated tokens for budget pre-check (conservative estimate)
        const estimatedTokens = 3000;
        await this.tokenBudget.checkBudget(org.id, estimatedTokens);

        // Select model based on task type
        const model = this.tokenBudget.selectModel(agent.taskType);

        // Update in-memory status
        agent.status = 'working';
        agent.lastActivity = new Date().toISOString();
        agent.stats.totalRuns++;
        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.emoji} ${agent.name}: Starting → "${taskStr.substring(0, 60)}..."`,
            color: agent.color,
            type: 'task_start',
        });

        // Run async — don't block the HTTP response
        this.runAgentAsync(userId, org.id, agent, taskStr, model);

        return { message: `${agent.name} triggered`, task: taskStr, model };
    }

    private async runAgentAsync(
        userId: string,
        orgId: string,
        agent: AgentState,
        task: string,
        model: string,
    ) {
        const startTime = Date.now();

        // Create execution record
        let execution: any;
        try {
            execution = await this.prisma.agentExecution.create({
                data: { userId, agentId: agent.id, task, status: 'running', steps: '[]', toolCalls: '[]' },
            });
        } catch { /* schema migration may be pending */ }

        const steps: any[] = [];
        const toolCalls: any[] = [];

        try {
            const result = await this.kagentBridge.invokeAgent(
                agent.id,
                {
                    task,
                    namespace: `tenant-${orgId.substring(0, 8)}`,
                    model,
                    maxTokens: 4096,
                },
                (step, index) => {
                    steps.push(step);
                    if (step.type === 'act') {
                        toolCalls.push({ tool: step.tool, input: step.input, output: step.output, durationMs: step.durationMs, timestamp: step.timestamp });
                    }
                    this.eventEmitter.emit('agent.step', {
                        userId,
                        agentId: agent.id,
                        executionId: execution?.id,
                        step,
                        stepIndex: index,
                    });
                },
            );

            // Record token usage
            await this.tokenBudget.recordUsage(orgId, agent.id, agent.taskType, result.usage, execution?.id);

            // Persist execution result
            if (execution) {
                await this.prisma.agentExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: 'completed',
                        steps: JSON.stringify(steps),
                        toolCalls: JSON.stringify(toolCalls),
                        result: result.result ?? 'Task completed.',
                        durationMs: Date.now() - startTime,
                        completedAt: new Date(),
                    },
                }).catch(() => {});
            }

            agent.status = 'idle';
            agent.stats.avgDurationSec = Math.round((Date.now() - startTime) / 1000);
            this.eventEmitter.emit('agent.updated', { userId, agent });
            this.eventEmitter.emit('activity.new', {
                userId,
                text: `${agent.emoji} ${agent.name}: ✅ Completed — ${toolCalls.length} tools in ${agent.stats.avgDurationSec}s`,
                color: '#34d399',
                type: 'task_complete',
            });

        } catch (err: any) {
            agent.status = 'error';
            agent.stats.lastError = err.message;
            this.eventEmitter.emit('agent.updated', { userId, agent });
            this.eventEmitter.emit('activity.new', {
                userId,
                text: `${agent.emoji} ${agent.name}: ❌ Failed — ${err.message?.substring(0, 80)}`,
                color: '#f87171',
                type: 'task_error',
            });

            if (execution) {
                await this.prisma.agentExecution.update({
                    where: { id: execution.id },
                    data: { status: 'failed', result: err.message, durationMs: Date.now() - startTime, completedAt: new Date() },
                }).catch(() => {});
            }
        }
    }

    async getExecutions(userId: string, agentId: string, limit = 10) {
        try {
            return await this.prisma.agentExecution.findMany({
                where: { userId, agentId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true, agentId: true, task: true, status: true,
                    durationMs: true, createdAt: true, completedAt: true, result: true,
                },
            });
        } catch { return []; }
    }

    async getExecutionSteps(userId: string, executionId: string) {
        try {
            const exec = await this.prisma.agentExecution.findFirst({ where: { id: executionId, userId } });
            if (!exec) return null;
            return {
                ...exec,
                steps: JSON.parse(exec.steps),
                toolCalls: JSON.parse(exec.toolCalls),
            };
        } catch { return null; }
    }

    async completeAgent(userId: string, agentId: string, output?: string, success = true) {
        const agent = this.getUserAgents(userId).find((a) => a.id === agentId);
        if (!agent) throw new NotFoundException('Agent not found');

        agent.status = success ? 'idle' : 'error';
        agent.lastActivity = new Date().toISOString();
        if (!success) agent.stats.lastError = output ?? 'Manual completion with failure';
        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.emoji} ${agent.name}: ${success ? '✅ Completed' : '❌ Failed'} (manual)${output ? ' — ' + output.substring(0, 60) : ''}`,
            color: success ? '#34d399' : '#f87171',
            type: success ? 'task_complete' : 'task_error',
        });

        // best-effort: mark the latest running execution as completed/failed
        try {
            const running = await this.prisma.agentExecution.findFirst({
                where: { userId, agentId, status: 'running' },
                orderBy: { createdAt: 'desc' },
            });
            if (running) {
                await this.prisma.agentExecution.update({
                    where: { id: running.id },
                    data: {
                        status: success ? 'completed' : 'failed',
                        result: output ?? (success ? 'Manually completed' : 'Manually failed'),
                        completedAt: new Date(),
                    },
                });
            }
        } catch { /* migration may be pending */ }

        return { agentId, status: agent.status, output };
    }

    setAgentStatus(userId: string, agentId: string, status: 'idle' | 'working' | 'error') {
        const agent = this.getUserAgents(userId).find((a) => a.id === agentId);
        if (agent) {
            agent.status = status;
            agent.lastActivity = new Date().toISOString();
            this.eventEmitter.emit('agent.updated', { userId, agent });
        }
    }

    private getUserAgents(userId: string): AgentState[] {
        if (!this.agentStates.has(userId)) {
            const stateMap = new Map<string, AgentState>();
            for (const def of AGENT_DEFINITIONS) {
                stateMap.set(def.id, {
                    ...JSON.parse(JSON.stringify(def)),
                    status: 'idle',
                    lastActivity: null,
                    stats: { totalRuns: 0, successRate: 100, avgDurationSec: 0, lastError: null },
                });
            }
            this.agentStates.set(userId, stateMap);
        }
        return Array.from(this.agentStates.get(userId)!.values());
    }
}
