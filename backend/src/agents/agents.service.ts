import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// ─── Tool Registry ───────────────────────────────────────────────
export const TOOL_REGISTRY: Record<string, any[]> = {
    'infra-agent': [
        { name: 'terraform-preview', description: 'Generate and preview Terraform plan', inputSchema: { resources: 'string[]' } },
        { name: 'checkov-scan', description: 'Run Checkov IaC security scan', inputSchema: { path: 'string' } },
        { name: 'ecs-describe', description: 'Describe ECS cluster and services', inputSchema: { cluster: 'string' } },
        { name: 'vpc-list', description: 'List VPCs and subnets', inputSchema: {} },
        { name: 'rds-status', description: 'Check RDS instance status', inputSchema: { dbId: 'string' } },
    ],
    'pipeline-agent': [
        { name: 'github-actions-lint', description: 'Lint GitHub Actions YAML', inputSchema: { yaml: 'string' } },
        { name: 'test-run', description: 'Execute test suite', inputSchema: { framework: 'string', path: 'string' } },
        { name: 'docker-build', description: 'Build and tag Docker image', inputSchema: { tag: 'string' } },
        { name: 'ecr-push', description: 'Push image to ECR', inputSchema: { tag: 'string', repo: 'string' } },
        { name: 'visual-qa', description: 'Browser subagent visual verification', inputSchema: { url: 'string' } },
    ],
    'finops-agent': [
        { name: 'infracost-estimate', description: 'Estimate infrastructure costs', inputSchema: { tfPath: 'string' } },
        { name: 'aws-pricing-query', description: 'Query AWS pricing API', inputSchema: { service: 'string', region: 'string' } },
        { name: 'cost-anomaly-detect', description: 'Detect cost anomalies', inputSchema: { threshold: 'number' } },
        { name: 'budget-validate', description: 'Validate against budget policy', inputSchema: { estimate: 'number' } },
        { name: 'graviton-recommend', description: 'Recommend Graviton migration', inputSchema: { instanceTypes: 'string[]' } },
    ],
    'sre-agent': [
        { name: 'cloudwatch-query', description: 'Query CloudWatch metrics and logs', inputSchema: { metric: 'string', period: 'number' } },
        { name: 'ecs-restart', description: 'Force restart ECS tasks', inputSchema: { cluster: 'string', service: 'string' } },
        { name: 'log-insight', description: 'Run CloudWatch Logs Insights query', inputSchema: { query: 'string', logGroup: 'string' } },
        { name: 'rca-analyze', description: 'Root cause analysis with RAG', inputSchema: { incidentId: 'string' } },
        { name: 'auto-scale-trigger', description: 'Trigger ECS auto-scaling', inputSchema: { desiredCount: 'number' } },
    ],
};

// ─── ReAct Step Templates ────────────────────────────────────────
function generateReActSteps(agentId: string, task: string): any[] {
    const tools = TOOL_REGISTRY[agentId] || [];
    const now = Date.now();

    const stepTemplates: Record<string, any[]> = {
        'infra-agent': [
            { type: 'reason', content: `Analyzing task: "${task}". I need to first understand the current infrastructure state before making changes.` },
            { type: 'act', tool: 'vpc-list', input: {}, output: '{"vpcs": [{"id": "vpc-0abc123", "cidr": "10.0.0.0/16", "subnets": 6}]}' },
            { type: 'observe', content: 'Found existing VPC. Will reuse networking layer. Next: check ECS cluster state.' },
            { type: 'reason', content: 'VPC exists. I should run a security scan on the existing IaC to identify gaps before generating new resources.' },
            { type: 'act', tool: 'checkov-scan', input: { path: 'infrastructure/terraform/' }, output: '{"passed": 24, "failed": 2, "skipped": 1, "findings": ["CKV_AWS_117: Lambda not in VPC", "CKV_AWS_50: X-Ray not enabled"]}' },
            { type: 'observe', content: '2 security findings. Both are medium severity and auto-fixable. Proceeding to generate corrected Terraform.' },
            { type: 'act', tool: 'terraform-preview', input: { resources: ['aws_ecs_service', 'aws_rds_instance'] }, output: '{"plan": "Plan: 3 to add, 1 to change, 0 to destroy. Estimated cost: $23.40/month"}' },
            { type: 'reason', content: 'Plan looks good. Cost is within budget. Security issues will be addressed. Ready to apply.' },
        ],
        'pipeline-agent': [
            { type: 'reason', content: `Task: "${task}". I'll generate a CI/CD pipeline optimized for this project type. Starting with linting the existing workflow if present.` },
            { type: 'act', tool: 'github-actions-lint', input: { yaml: '.github/workflows/ci.yml' }, output: '{"valid": true, "warnings": ["actions/checkout is pinned to an older version"]}' },
            { type: 'observe', content: 'Existing workflow is valid with minor version warnings. I\'ll generate an updated pipeline with latest action versions and FinOps gate.' },
            { type: 'act', tool: 'test-run', input: { framework: 'jest', path: 'src/' }, output: '{"passed": 47, "failed": 0, "coverage": "82%", "duration": "12.3s"}' },
            { type: 'observe', content: 'Tests pass at 82% coverage. Good baseline. Adding E2E tests to pipeline.' },
            { type: 'act', tool: 'docker-build', input: { tag: 'platform:latest' }, output: '{"imageId": "sha256:abc123", "size": "487MB", "layers": 12}' },
            { type: 'act', tool: 'visual-qa', input: { url: 'http://staging.app.com' }, output: '{"screenshots": 5, "diffs": 0, "status": "pass"}' },
            { type: 'reason', content: 'All pipeline stages validated. Visual QA passed. Pipeline YAML ready for deployment.' },
        ],
        'finops-agent': [
            { type: 'reason', content: `Task: "${task}". Starting cost analysis. I'll query current pricing for the deployed resources and compare against budget.` },
            { type: 'act', tool: 'infracost-estimate', input: { tfPath: 'infrastructure/terraform/' }, output: '{"monthlyCost": "$47.20", "resources": [{"name": "aws_ecs_service", "cost": "$23.40"}, {"name": "aws_rds_instance", "cost": "$18.50"}]}' },
            { type: 'observe', content: 'Monthly cost estimate: $47.20. Within $500 budget. However, checking for optimization opportunities.' },
            { type: 'act', tool: 'graviton-recommend', input: { instanceTypes: ['t3.small', 'c5.large'] }, output: '{"savings": "$14.20/month", "migrations": [{"from": "t3.small", "to": "t4g.small", "savings": "20%"}]}' },
            { type: 'act', tool: 'budget-validate', input: { estimate: 47.2 }, output: '{"approved": true, "remaining": "$452.80", "alert_threshold": "80%"}' },
            { type: 'reason', content: 'Budget approved. Found $14.20/month savings opportunity via Graviton migration. Will add recommendation to report.' },
        ],
        'sre-agent': [
            { type: 'reason', content: `Task: "${task}". Initiating Sense-Analyze-Act-Verify cycle. First collecting current metrics.` },
            { type: 'act', tool: 'cloudwatch-query', input: { metric: 'CPUUtilization', period: 300 }, output: '{"avg": 78.4, "max": 94.2, "p99": 91.5, "datapoints": 12}' },
            { type: 'observe', content: 'CPU at 78.4% average, p99 at 91.5%. Elevated but not critical. Checking error rates.' },
            { type: 'act', tool: 'log-insight', input: { query: 'filter @message like /ERROR/', logGroup: '/ecs/platform' }, output: '{"count": 23, "topErrors": ["connection timeout", "rate limit exceeded"]}' },
            { type: 'observe', content: '23 errors in last 5 minutes. "rate limit exceeded" suggests downstream API throttling. Checking if ECS task count is adequate.' },
            { type: 'act', tool: 'rca-analyze', input: { incidentId: 'INC-AUTO-001' }, output: '{"rootCause": "Downstream API rate limit", "confidence": 0.89, "recommendation": "Implement exponential backoff or increase API tier"}' },
            { type: 'act', tool: 'ecs-restart', input: { cluster: 'platform', service: 'api-service' }, output: '{"status": "success", "newTaskArn": "arn:aws:ecs:..."}' },
            { type: 'reason', content: 'Root cause identified. Applied short-term fix (task restart). Long-term: implement backoff pattern in code. Verifying recovery.' },
        ],
    };

    const steps = (stepTemplates[agentId] || stepTemplates['infra-agent']).map((step, i) => ({
        ...step,
        id: `step-${i}`,
        timestamp: new Date(now + i * 2000).toISOString(),
        durationMs: step.type === 'act' ? Math.floor(Math.random() * 2000) + 500 : 200,
    }));

    return steps;
}

// ─── Agent Definitions ───────────────────────────────────────────
const DEFAULT_AGENTS = [
    {
        id: 'infra-agent',
        name: 'Infrastructure Agent',
        role: 'Platform & Infrastructure',
        description: 'Generates Terraform/CDK/CloudFormation templates, runs Checkov security scans, provisions VPC/ECS/RDS resources. Implements AWS Well-Architected Framework best practices.',
        status: 'idle',
        color: '#818cf8',
        letter: 'I',
        emoji: '🏗',
        mcpServers: ['aws-cloud-control', 'aws-iac', 'aws-terraform', 'mcpdoc-aws'],
        capabilities: ['terraform', 'cdk', 'cloudformation', 'checkov', 'vpc', 'ecs', 'rds', 'ecr', 'alb'],
        tools: TOOL_REGISTRY['infra-agent'],
        memory: { shortTerm: [], longTerm: { lastDeployedResources: [], knownIssues: [] } },
        lastActivity: null,
        stats: { totalRuns: 0, successRate: 100, avgDurationSec: 45, lastError: null },
    },
    {
        id: 'pipeline-agent',
        name: 'Pipeline Agent',
        role: 'CI/CD & QA',
        description: 'Creates GitHub Actions pipelines, writes unit/integration/E2E tests, performs visual regression testing with Browser Subagent. Enforces FinOps gate in every PR.',
        status: 'idle',
        color: '#34d399',
        letter: 'P',
        emoji: '🔄',
        mcpServers: ['mcpdoc-github-actions', 'mcpdoc-aws'],
        capabilities: ['github-actions', 'jest', 'pytest', 'docker', 'ecr-push', 'visual-qa', 'e2e'],
        tools: TOOL_REGISTRY['pipeline-agent'],
        memory: { shortTerm: [], longTerm: { pipelineTemplates: [], testPatterns: [] } },
        lastActivity: null,
        stats: { totalRuns: 0, successRate: 100, avgDurationSec: 30, lastError: null },
    },
    {
        id: 'finops-agent',
        name: 'FinOps Agent',
        role: 'Financial Operations',
        description: 'Performs cost estimation with AWS Pricing API, static analysis with Infracost, enforces budget policies via OPA/Rego. Recommends Graviton migration and Reserved Instances.',
        status: 'idle',
        color: '#fbbf24',
        letter: 'F',
        emoji: '💰',
        mcpServers: ['aws-pricing', 'mcpdoc-aws'],
        capabilities: ['cost-estimation', 'infracost', 'budget-validation', 'opa-rego', 'graviton', 'reserved-instances'],
        tools: TOOL_REGISTRY['finops-agent'],
        memory: { shortTerm: [], longTerm: { budgetHistory: [], optimizations: [] } },
        lastActivity: null,
        stats: { totalRuns: 0, successRate: 100, avgDurationSec: 20, lastError: null },
    },
    {
        id: 'sre-agent',
        name: 'SRE Agent',
        role: 'Site Reliability',
        description: 'Runs Sense→Analyze→Act→Verify self-healing cycles. Detects anomalies via CloudWatch, performs RAG-based Root Cause Analysis, applies auto-remediation within safe guardrails.',
        status: 'idle',
        color: '#f87171',
        letter: 'S',
        emoji: '🛡',
        mcpServers: ['aws-cloudwatch', 'mcpdoc-aws'],
        capabilities: ['anomaly-detection', 'rca', 'auto-remediation', 'eventbridge', 'lambda', 'rag-rca'],
        tools: TOOL_REGISTRY['sre-agent'],
        memory: { shortTerm: [], longTerm: { incidentHistory: [], runbooks: [], rcaReports: [] } },
        lastActivity: null,
        stats: { totalRuns: 0, successRate: 97, avgDurationSec: 15, lastError: null },
    },
];

@Injectable()
export class AgentsService {
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

    async triggerAgent(userId: string, agentId: string, task?: string) {
        const agent = this.getAgent(userId, agentId);
        const startTime = Date.now();
        const taskStr = task || `${agent.name}: Standard health check and optimization scan`;

        agent.status = 'working';
        agent.lastActivity = new Date().toISOString();
        agent.stats.totalRuns = (agent.stats.totalRuns || 0) + 1;

        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.emoji} ${agent.name}: Starting → "${taskStr.substring(0, 60)}..."`,
            color: agent.color,
            type: 'task_start',
        });

        // Generate ReAct steps
        const steps = generateReActSteps(agentId, taskStr);
        const toolCalls = steps.filter(s => s.type === 'act').map(s => ({
            tool: s.tool,
            input: s.input,
            output: s.output,
            durationMs: s.durationMs,
            timestamp: s.timestamp,
        }));

        // Store execution in DB asynchronously
        this.runAndStore(userId, agentId, taskStr, steps, toolCalls, startTime, agent);

        return { message: `${agent.name} triggered`, task: taskStr };
    }

    private async runAndStore(
        userId: string, agentId: string, task: string,
        steps: any[], toolCalls: any[], startTime: number, agent: any,
    ) {
        // Simulate the execution duration (step delays)
        const totalDuration = steps.length * 2000 + Math.random() * 3000;

        let execution: any;
        try {
            execution = await this.prisma.agentExecution.create({
                data: {
                    userId,
                    agentId,
                    task,
                    status: 'running',
                    steps: JSON.stringify(steps),
                    toolCalls: JSON.stringify(toolCalls),
                },
            });
        } catch {
            // DB schema might not be updated yet — proceed without persistence
        }

        // Emit step-by-step events for real-time UI
        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 1800));
            this.eventEmitter.emit('agent.step', {
                userId,
                agentId,
                executionId: execution?.id,
                step: steps[i],
                stepIndex: i,
                totalSteps: steps.length,
            });
        }

        const durationMs = Date.now() - startTime;
        const success = Math.random() > 0.05; // 95% success rate

        // Update execution in DB
        if (execution) {
            try {
                await this.prisma.agentExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: success ? 'completed' : 'failed',
                        result: success
                            ? `Task completed successfully in ${(durationMs / 1000).toFixed(1)}s. ${toolCalls.length} tools used.`
                            : 'Task failed after maximum retries.',
                        durationMs,
                        completedAt: new Date(),
                    },
                });
            } catch { }
        }

        // Update in-memory state
        agent.status = success ? 'idle' : 'error';
        agent.lastActivity = new Date().toISOString();
        agent.stats.avgDurationSec = Math.round(durationMs / 1000);

        this.eventEmitter.emit('agent.updated', { userId, agent });
        this.eventEmitter.emit('activity.new', {
            userId,
            text: `${agent.emoji} ${agent.name}: ${success ? '✅ Completed' : '❌ Failed'} — ${toolCalls.length} tools used in ${(durationMs / 1000).toFixed(1)}s`,
            color: success ? '#34d399' : '#f87171',
            type: success ? 'task_complete' : 'task_error',
        });
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
        } catch {
            return [];
        }
    }

    async getExecutionSteps(userId: string, executionId: string) {
        try {
            const exec = await this.prisma.agentExecution.findFirst({
                where: { id: executionId, userId },
            });
            if (!exec) return null;
            return {
                ...exec,
                steps: JSON.parse(exec.steps),
                toolCalls: JSON.parse(exec.toolCalls),
            };
        } catch {
            return null;
        }
    }

    completeAgent(userId: string, agentId: string, output?: string, success = true) {
        const agent = this.getAgent(userId, agentId);
        agent.status = success ? 'idle' : 'error';
        agent.lastActivity = new Date().toISOString();
        this.eventEmitter.emit('agent.updated', { userId, agent });
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
                stateMap.set(def.id, JSON.parse(JSON.stringify(def)));
            }
            this.agentStates.set(userId, stateMap);
        }
        return Array.from(this.agentStates.get(userId)!.values());
    }
}
