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
        setInterval(() => this.emitHeartbeat(), 5000);
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
        this.eventEmitter.emit('log.stream', event);
        return event;
    }

    /** Returns an observable of all log events for SSE streaming */
    getStream(): Observable<LogEvent> {
        return this.subject.asObservable();
    }

    /** Demo heartbeat to simulate live system logs */
    private heartbeatIndex = 0;
    private readonly HEARTBEAT_LOGS: { level: LogEvent['level']; source: string; message: string }[] = [
        { level: 'info',    source: 'kagent',         message: 'CRD sync — 4 agents healthy' },
        { level: 'info',    source: 'system',         message: `Health check OK — API latency ${Math.round(Math.random() * 20 + 10)}ms` },
        { level: 'success', source: 'pipeline-agent', message: 'GitHub Actions workflow completed — all checks passed' },
        { level: 'warn',    source: 'finops-agent',   message: `Budget at ${Math.round(Math.random() * 30 + 30)}% — within threshold` },
        { level: 'info',    source: 'sre-agent',      message: 'CloudWatch scan: no anomalies detected' },
        { level: 'info',    source: 'infra-agent',    message: 'Terraform plan: 0 to add, 0 to change, 0 to destroy' },
        { level: 'success', source: 'sre-agent',      message: 'SAAV loop iteration complete — all metrics nominal' },
        { level: 'info',    source: 'system',         message: `DB pool: ${Math.round(Math.random() * 8 + 2)}/20 connections active` },
    ];

    private emitHeartbeat() {
        const tmpl = this.HEARTBEAT_LOGS[this.heartbeatIndex % this.HEARTBEAT_LOGS.length];
        this.heartbeatIndex++;
        this.emit(tmpl.level, tmpl.source, tmpl.message);
    }
}
