import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';

export interface LogEvent {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success' | 'debug';
    source: string;
    message: string;
}

@Injectable()
export class LogStreamService implements OnModuleInit {
    private readonly subject = new Subject<LogEvent>();
    private counter = 0;

    constructor(private eventEmitter: EventEmitter2) {}

    onModuleInit() {
        // Emit periodic heartbeat logs to keep connections alive + demo activity
        setInterval(() => this.emitHeartbeat(), 6000);
    }

    /** Emit a log event — call this from any service */
    emit(level: LogEvent['level'], source: string, message: string) {
        const event: LogEvent = {
            id: `log-${Date.now()}-${this.counter++}`,
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
        };
        this.subject.next(event);
        return event;
    }

    /** Returns an observable of all log events for SSE streaming */
    getStream(): Observable<LogEvent> {
        return this.subject.asObservable();
    }

    // ── Bridge backend events into SSE stream ─────────────────────────

    @OnEvent('activity.new')
    onActivityNew(payload: any) {
        const msg = payload?.text ?? payload?.message ?? `Activity: ${payload?.type ?? 'unknown'}`;
        const level: LogEvent['level'] =
            payload?.type?.includes('failed') || payload?.type?.includes('error')
                ? 'error'
                : payload?.type?.includes('complete')
                ? 'success'
                : payload?.type?.includes('budget')
                ? 'warn'
                : 'info';
        this.emit(level, payload?.agentId ?? 'system', msg);
    }

    @OnEvent('deployment.created')
    onDeploymentCreated(payload: any) {
        this.emit('info', 'deploy', `Deployment started: ${payload?.projectName ?? 'unknown'} → ${payload?.region ?? 'us-east-1'}`);
    }

    @OnEvent('deployment.completed')
    onDeploymentCompleted(payload: any) {
        const level = payload?.status === 'success' ? 'success' : 'error';
        this.emit(level, 'deploy', `Deployment ${payload?.status ?? 'finished'}: ${payload?.projectName ?? 'unknown'} [${payload?.deployId ?? payload?.deploymentId ?? ''}]`);
    }

    @OnEvent('deploy.success')
    onDeploySuccess(payload: any) {
        this.emit('success', 'deploy', `Deployment succeeded: ${payload?.projectName ?? 'unknown'} (${payload?.environment ?? 'production'} / ${payload?.region ?? 'us-east-1'})`);
    }

    @OnEvent('deploy.failed')
    onDeployFailed(payload: any) {
        this.emit('error', 'deploy', `Deployment failed: ${payload?.projectName ?? 'unknown'} — ${payload?.error ?? 'stage failure'}`);
    }

    @OnEvent('agent.triggered')
    onAgentTriggered(payload: any) {
        this.emit('info', payload?.agentId ?? 'agent', `Agent triggered — task: ${payload?.task ?? 'default'}`);
    }

    @OnEvent('agent.trigger')
    onAgentTrigger(payload: any) {
        this.emit('info', payload?.agentId ?? 'agent', `Auto-triggering ${payload?.agentId ?? 'agent'} — ${payload?.task ?? 'autonomous task'}`);
    }

    @OnEvent('agent.step')
    onAgentStep(payload: any) {
        const step = payload?.step;
        if (!step) return;
        const tool = step.tool ?? step.toolName;
        const output = step.output ?? step.toolOutput;
        const content = step.content ?? step.thought;
        const idx = (payload?.stepIndex ?? step.step ?? 0) + 1;
        const msg = tool
            ? `[Step ${idx}] Tool ${tool} → ${output ? String(output).slice(0, 120) : 'executed'}`
            : `[Step ${idx}] ${content ? String(content).slice(0, 140) : 'reasoning...'}`;
        this.emit('debug', payload?.agentId ?? 'agent', msg);
    }

    @OnEvent('incident.created')
    onIncidentCreated(payload: any) {
        this.emit('warn', 'sre-agent', `Incident created: ${payload?.title ?? 'unknown'} [${payload?.severity ?? 'medium'}]`);
    }

    @OnEvent('incident.resolved')
    onIncidentResolved(payload: any) {
        this.emit('success', 'sre-agent', `Incident resolved: ${payload?.title ?? 'unknown'} — SAAV loop complete`);
    }

    // ── Heartbeat ─────────────────────────────────────────────────────

    private heartbeatIndex = 0;
    private readonly HEARTBEAT_LOGS: { level: LogEvent['level']; source: string; message: string }[] = [
        { level: 'info',    source: 'kagent',         message: 'CRD sync — 4 agents healthy' },
        { level: 'info',    source: 'system',         message: 'Health check OK — API latency <20ms' },
        { level: 'success', source: 'pipeline-agent', message: 'GitHub Actions workflow completed — all checks passed' },
        { level: 'warn',    source: 'finops-agent',   message: 'Budget monitoring active — within threshold' },
        { level: 'info',    source: 'sre-agent',      message: 'CloudWatch scan: no anomalies detected' },
        { level: 'info',    source: 'infra-agent',    message: 'Terraform plan: 0 to add, 0 to change, 0 to destroy' },
        { level: 'success', source: 'sre-agent',      message: 'SAAV loop iteration complete — all metrics nominal' },
        { level: 'info',    source: 'system',         message: 'DB pool: 4/20 connections active' },
    ];

    private emitHeartbeat() {
        const tmpl = this.HEARTBEAT_LOGS[this.heartbeatIndex % this.HEARTBEAT_LOGS.length];
        this.heartbeatIndex++;
        this.emit(tmpl.level, tmpl.source, tmpl.message);
    }
}
