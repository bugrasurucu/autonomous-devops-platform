import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface KagentInvokeRequest {
    task: string;
    namespace: string;
    model?: string;
    maxTokens?: number;
    context?: Record<string, unknown>;
}

export interface KagentStep {
    type: 'reason' | 'act' | 'observe';
    content?: string;
    tool?: string;
    input?: Record<string, unknown>;
    output?: string;
    timestamp: string;
    durationMs?: number;
}

export interface KagentInvokeResult {
    sessionId: string;
    agentId: string;
    status: 'completed' | 'failed' | 'blocked';
    steps: KagentStep[];
    result?: string;
    error?: string;
    usage: {
        model: string;
        inputTokens: number;
        outputTokens: number;
    };
}

@Injectable()
export class KagentBridgeService implements OnModuleInit {
    private readonly logger = new Logger(KagentBridgeService.name);
    private kagentBaseUrl: string;
    private isAvailable = false;

    constructor(
        private config: ConfigService,
        private eventEmitter: EventEmitter2,
    ) {}

    async onModuleInit() {
        this.kagentBaseUrl = this.config.get<string>('KAGENT_API_URL', 'http://kagent-controller.kagent.svc.cluster.local:8083');
        await this.healthCheck();
    }

    private async healthCheck() {
        try {
            const res = await fetch(`${this.kagentBaseUrl}/healthz`, { signal: AbortSignal.timeout(3000) });
            this.isAvailable = res.ok;
            if (this.isAvailable) {
                this.logger.log(`kagent API available at ${this.kagentBaseUrl}`);
            }
        } catch {
            this.isAvailable = false;
            this.logger.warn('kagent API not available — streaming will be simulated');
        }
    }

    async invokeAgent(
        agentId: string,
        request: KagentInvokeRequest,
        onStep?: (step: KagentStep, index: number) => void,
    ): Promise<KagentInvokeResult> {
        if (this.isAvailable) {
            return this.invokeReal(agentId, request, onStep);
        }
        this.logger.warn(`kagent unavailable — falling back for agent: ${agentId}`);
        throw new Error('kagent API not available. Ensure the Kubernetes cluster is running with kagent installed.');
    }

    private async invokeReal(
        agentId: string,
        request: KagentInvokeRequest,
        onStep?: (step: KagentStep, index: number) => void,
    ): Promise<KagentInvokeResult> {
        const sessionId = `sess-${Date.now()}`;

        const response = await fetch(
            `${this.kagentBaseUrl}/api/v1/namespaces/${request.namespace}/agents/${agentId}/sessions/${sessionId}/messages`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: request.task,
                    model_config: request.model ? { model: request.model } : undefined,
                    max_tokens: request.maxTokens,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`kagent API error: ${response.status} ${await response.text()}`);
        }

        // Stream SSE response
        const steps: KagentStep[] = [];
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let usage = { model: request.model ?? 'claude-haiku-4-5-20251001', inputTokens: 0, outputTokens: 0 };
        let result = '';

        if (reader) {
            let stepIndex = 0;
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        const step = this.parseKagentEvent(event);
                        if (step) {
                            steps.push(step);
                            onStep?.(step, stepIndex++);
                        }
                        if (event.usage) usage = { ...usage, ...event.usage };
                        if (event.result) result = event.result;
                    } catch {
                        // skip malformed
                    }
                }
            }
        }

        return {
            sessionId,
            agentId,
            status: 'completed',
            steps,
            result,
            usage,
        };
    }

    private parseKagentEvent(event: Record<string, unknown>): KagentStep | null {
        const type = event.type as string;
        if (!type) return null;

        const now = new Date().toISOString();

        if (type === 'thought' || type === 'reasoning') {
            return { type: 'reason', content: event.content as string, timestamp: now };
        }
        if (type === 'tool_call') {
            return {
                type: 'act',
                tool: event.tool_name as string,
                input: event.arguments as Record<string, unknown>,
                output: event.result as string,
                timestamp: now,
                durationMs: event.duration_ms as number,
            };
        }
        if (type === 'observation') {
            return { type: 'observe', content: event.content as string, timestamp: now };
        }
        return null;
    }

    async createNamespace(namespace: string): Promise<void> {
        if (!this.isAvailable) {
            this.logger.warn(`Skipping namespace creation (kagent unavailable): ${namespace}`);
            return;
        }
        await fetch(`${this.kagentBaseUrl}/api/v1/namespaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: namespace }),
        });
        this.logger.log(`Created namespace: ${namespace}`);
    }

    isKagentAvailable(): boolean {
        return this.isAvailable;
    }
}
