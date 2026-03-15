import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Default agent definitions — mirrors the old state.js
const DEFAULT_AGENTS = [
    {
        id: 'infra-agent',
        name: 'Infrastructure Agent',
        role: 'Platform & Infrastructure',
        description: 'Generates Terraform/CDK/CloudFormation templates, runs Checkov security scans, provisions VPC/ECS/RDS resources.',
        status: 'idle',
        color: '#818cf8',
        letter: 'I',
        mcpServers: ['aws-cloud-control', 'aws-iac'],
        capabilities: ['terraform', 'cdk', 'cloudformation', 'checkov', 'vpc', 'ecs', 'rds'],
        lastActivity: null,
    },
    {
        id: 'pipeline-agent',
        name: 'Pipeline Agent',
        role: 'CI/CD Pipeline',
        description: 'Creates CI/CD pipelines, writes tests, performs visual QA using Browser Subagent.',
        status: 'idle',
        color: '#34d399',
        letter: 'P',
        mcpServers: ['mcpdoc-github', 'mcpdoc-aws'],
        capabilities: ['github-actions', 'gitlab-ci', 'codepipeline', 'testing', 'visual-qa'],
        lastActivity: null,
    },
    {
        id: 'finops-agent',
        name: 'FinOps Agent',
        role: 'Financial Operations',
        description: 'Performs cost estimation with AWS Pricing MCP, static analysis with Infracost, enforces budget policies.',
        status: 'idle',
        color: '#fbbf24',
        letter: 'F',
        mcpServers: ['aws-pricing'],
        capabilities: ['cost-estimation', 'infracost', 'budget-validation', 'opa-rego'],
        lastActivity: null,
    },
    {
        id: 'sre-agent',
        name: 'SRE Agent',
        role: 'Site Reliability Engineering',
        description: 'Manages self-healing cycles (Sense-Analyze-Act-Verify), anomaly detection with CloudWatch, root cause analysis.',
        status: 'idle',
        color: '#f87171',
        letter: 'S',
        mcpServers: ['aws-cloudwatch'],
        capabilities: ['anomaly-detection', 'rca', 'auto-remediation', 'eventbridge', 'lambda'],
        lastActivity: null,
    },
];

@Injectable()
export class AgentsService {
    // In-memory agent state per user (keyed by userId)
    private agentStates = new Map<string, Map<string, any>>();

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    getAgents(userId: string) {
        return this.getUserAgents(userId);
    }

    getAgent(userId: string, agentId: string) {
        const agents = this.getUserAgents(userId);
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) throw new NotFoundException('Agent not found');
        return agent;
    }

    triggerAgent(userId: string, agentId: string, task?: string) {
        const agent = this.getAgent(userId, agentId);
        agent.status = 'working';
        agent.lastActivity = new Date().toISOString();

        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.name}: ${task || 'Task started'}`,
            color: agent.color,
            type: 'task_start',
        });

        return { message: `${agent.name} triggered`, task };
    }

    completeAgent(userId: string, agentId: string, output?: string, success = true) {
        const agent = this.getAgent(userId, agentId);
        agent.status = success ? 'idle' : 'error';
        agent.lastActivity = new Date().toISOString();

        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.name}: ${success ? 'Completed' : 'Failed'} — ${output || 'Done'}`,
            color: success ? '#34d399' : '#f87171',
            type: success ? 'task_complete' : 'task_error',
        });

        return { message: `${agent.name} ${success ? 'completed' : 'failed'}` };
    }

    setAgentStatus(userId: string, agentId: string, status: string) {
        const agents = this.getUserAgents(userId);
        const agent = agents.find((a) => a.id === agentId);
        if (agent) {
            agent.status = status;
            agent.lastActivity = new Date().toISOString();
            this.eventEmitter.emit('agent.updated', { userId, agent });
        }
    }

    private getUserAgents(userId: string): any[] {
        if (!this.agentStates.has(userId)) {
            const stateMap = new Map<string, any>();
            for (const def of DEFAULT_AGENTS) {
                stateMap.set(def.id, { ...def });
            }
            this.agentStates.set(userId, stateMap);
        }
        return Array.from(this.agentStates.get(userId)!.values());
    }
}
