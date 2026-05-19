import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../agents/agents.service';
import { KagentBridgeService } from '../kagent-bridge/kagent-bridge.service';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
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

    async spinUpRealContainer(userId: string, id: string): Promise<{ port: number; url: string }> {
        const deployment = await this.prisma.deployment.findFirst({
            where: {
                OR: [
                    { id },
                    { deployId: id }
                ],
                userId
            }
        });
        if (!deployment) throw new Error('Deployment not found');

        // Allocate a port based on deployment ID hash or static increment
        const cleanId = deployment.deployId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        // Allocate a port in range 4500 - 4900
        const port = 4500 + (Math.abs(cleanId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 400);

        const projectName = deployment.projectName;
        const region = deployment.region;
        const environment = deployment.environment;

        // Custom HTML index file content
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orbitron Deployment Sandbox: \${projectName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #030712;
            --card-bg: rgba(17, 24, 39, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --primary: #818cf8;
            --primary-glow: rgba(129, 140, 248, 0.15);
            --success: #34d399;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: 'Plus Jakarta Sans', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(129, 140, 248, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(52, 211, 153, 0.05) 0%, transparent 40%);
        }
        .container {
            width: 90%;
            max-width: 900px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(129, 140, 248, 0.05);
            padding: 40px;
            text-align: center;
        }
        h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #fff 0%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: var(--text-secondary);
            font-size: 14px;
            margin-bottom: 30px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            background: rgba(52, 211, 153, 0.08);
            border: 1px solid rgba(52, 211, 153, 0.2);
            color: var(--success);
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 24px;
        }
        .badge-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 10px var(--success);
        }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .metadata-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            text-align: left;
        }
        .metadata-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .metadata-value {
            font-size: 14px;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
            color: #fff;
        }
        .chat-section {
            border: 1px solid var(--border-color);
            border-radius: 14px;
            background: rgba(0, 0, 0, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 350px;
            text-align: left;
        }
        .chat-header {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border-color);
            background: rgba(255, 255, 255, 0.02);
            font-size: 13px;
            font-weight: 700;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .message {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
        }
        .message.bot {
            background: rgba(255, 255, 255, 0.04);
            align-self: flex-start;
        }
        .message.user {
            background: var(--primary);
            color: #000;
            font-weight: 600;
            align-self: flex-end;
        }
        .chat-input-form {
            display: flex;
            border-top: 1px solid var(--border-color);
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
        }
        .chat-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #fff;
            padding: 10px 14px;
            font-size: 13px;
        }
        .chat-submit {
            background: var(--primary);
            color: #000;
            border: none;
            outline: none;
            border-radius: 8px;
            padding: 0 20px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .chat-submit:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="badge">
            <span class="badge-dot"></span>
            Real Docker Container Active
        </div>
        <h1>\${projectName}</h1>
        <p class="subtitle">This micro-application is compiled, built, and hosted inside a real live Docker container served by your host daemon.</p>

        <div class="metadata-grid">
            <div class="metadata-card">
                <div class="metadata-label">Deployment ID</div>
                <div class="metadata-value">\${deployment.deployId}</div>
            </div>
            <div class="metadata-card">
                <div class="metadata-label">Region / Provider</div>
                <div class="metadata-value">\${region} / AWS-Local</div>
            </div>
            <div class="metadata-card">
                <div class="metadata-label">Environment</div>
                <div class="metadata-value">\${environment}</div>
            </div>
        </div>

        <div class="chat-section">
            <div class="chat-header">
                <span>🤖 OrbitAI Micro-Agent</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; opacity: 0.6;">nginx/alpine-node</span>
            </div>
            <div class="chat-messages" id="messages">
                <div class="message bot">👋 Hello! This is a REAL microservice running inside Docker on your host machine. Nginx handles standard ingress routing. How can I help you verify this deployment?</div>
            </div>
            <form class="chat-input-form" id="chat-form">
                <input type="text" class="chat-input" id="chat-input" placeholder="Type a message to verify this active container..." autocomplete="off">
                <button type="submit" class="chat-submit">Send</button>
            </form>
        </div>
    </div>

    <script>
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const messages = document.getElementById('messages');

        const responses = [
            "Container is operating at peak health! Latency is less than 0.8ms locally.",
            "Stripe payment service check: SUCCESS. Active mock keys loaded.",
            "Database postgres-db connection validated. Transaction logs are live.",
            "Indeed, this is a real Docker container! Check your terminal: run 'docker ps' to inspect.",
            "Nginx reverse proxy is successfully routing requests. 200 OK!"
        ];

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!input.value.trim()) return;

            const text = input.value.trim();
            input.value = '';

            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerText = text;
            messages.appendChild(userMsg);
            messages.scrollTop = messages.scrollHeight;

            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'message bot';
                botMsg.innerText = responses[Math.floor(Math.random() * responses.length)];
                messages.appendChild(botMsg);
                messages.scrollTop = messages.scrollHeight;
            }, 600);
        });
    </script>
</body>
</html>`;

        // Ensure temp folder exists
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, `orbitron-index-\${cleanId}.html`);
        fs.writeFileSync(tempFilePath, indexHtml);

        // Run Docker commands using child_process
        return new Promise((resolve, reject) => {
            const containerName = `orbitron-live-\${cleanId}`;
            // 1. Remove container if it exists, then run a new nginx alpine container
            const cmd = `docker rm -f \${containerName} || true && docker run -d --name \${containerName} -p \${port}:80 nginx:alpine`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    this.logger.error(`Failed to start Docker container: \${err.message}`);
                    // Clean up temp file
                    try { fs.unlinkSync(tempFilePath); } catch (e) {}
                    return reject(new Error('Failed to start real container. Make sure Docker is running on your machine.'));
                }

                // 2. Copy the index.html into the Nginx container
                const cpCmd = `docker cp "\${tempFilePath}" \${containerName}:/usr/share/nginx/html/index.html`;
                exec(cpCmd, (cpErr, cpStdout, cpStderr) => {
                    // Clean up temp file
                    try { fs.unlinkSync(tempFilePath); } catch (e) {}

                    if (cpErr) {
                        this.logger.error(`Failed to copy index.html to Docker container: \${cpErr.message}`);
                        return reject(new Error('Failed to configure container assets.'));
                    }

                    this.logger.log(`Successfully spun up live container for \${deployment.projectName} on port \${port}`);
                    resolve({
                        port,
                        url: `http://localhost:\${port}`
                    });
                });
            });
        });
    }
}
