import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// ── Channel types ────────────────────────────────────────────────

export interface NotificationChannel {
    id: string;
    userId: string;
    name: string;
    type: 'slack' | 'webhook' | 'email' | 'pagerduty';
    config: Record<string, string>;   // webhookUrl | email | routingKey
    enabledOn: string[];              // 'incident.created' | 'incident.resolved' | 'deploy.failed'
    enabled: boolean;
    createdAt: Date;
}

// In-memory store (production → move to DB table)
const CHANNEL_STORE: Record<string, NotificationChannel[]> = {};

// ── Event payloads ───────────────────────────────────────────────

interface IncidentEvent {
    userId: string;
    incidentId: string;
    title: string;
    severity: string;
    status?: string;
    resolution?: string;
}

interface DeployEvent {
    userId: string;
    deployId: string;
    projectName: string;
    status: string;
    region?: string;
}

// ── Service ─────────────────────────────────────────────────────

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly email: EmailService,
    ) { }

    // ── CRUD ────────────────────────────────────────────────────

    listChannels(userId: string): NotificationChannel[] {
        return (CHANNEL_STORE[userId] ?? []).filter(c => !c['_deleted']);
    }

    createChannel(
        userId: string,
        body: {
            name: string;
            type: 'slack' | 'webhook' | 'email' | 'pagerduty';
            config: Record<string, string>;
            enabledOn?: string[];
        },
    ): NotificationChannel {
        const channel: NotificationChannel = {
            id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId,
            name: body.name,
            type: body.type,
            config: body.config,
            enabledOn: body.enabledOn ?? ['incident.created', 'incident.resolved', 'deploy.failed'],
            enabled: true,
            createdAt: new Date(),
        };
        if (!CHANNEL_STORE[userId]) CHANNEL_STORE[userId] = [];
        CHANNEL_STORE[userId].push(channel);
        this.logger.log(`[${userId}] Created ${channel.type} channel: ${channel.name}`);
        return channel;
    }

    updateChannel(userId: string, id: string, patch: Partial<NotificationChannel>): NotificationChannel {
        const channels = CHANNEL_STORE[userId] ?? [];
        const idx = channels.findIndex(c => c.id === id);
        if (idx === -1) throw new NotFoundException('Channel not found');
        channels[idx] = { ...channels[idx], ...patch };
        return channels[idx];
    }

    deleteChannel(userId: string, id: string): { ok: boolean } {
        const channels = CHANNEL_STORE[userId] ?? [];
        const idx = channels.findIndex(c => c.id === id);
        if (idx === -1) throw new NotFoundException('Channel not found');
        channels.splice(idx, 1);
        return { ok: true };
    }

    // ── Test ─────────────────────────────────────────────────────

    async testChannel(userId: string, id: string): Promise<{ ok: boolean; message: string }> {
        const channel = (CHANNEL_STORE[userId] ?? []).find(c => c.id === id);
        if (!channel) throw new NotFoundException('Channel not found');

        const testPayload = {
            event: 'test',
            text: `🧪 This is a test notification from Orbitron — channel "${channel.name}" is working!`,
            timestamp: new Date().toISOString(),
        };

        try {
            await this.dispatch(channel, 'test', testPayload);
            return { ok: true, message: 'Test notification sent successfully' };
        } catch (err: any) {
            return { ok: false, message: err.message };
        }
    }

    // ── Event listeners ──────────────────────────────────────────

    @OnEvent('incident.created')
    async onIncidentCreated(payload: IncidentEvent) {
        const channels = this.getChannelsFor(payload.userId, 'incident.created');
        const text = `🚨 *New ${payload.severity.toUpperCase()} Incident*: ${payload.title}`;
        await this.fanOut(channels, 'incident.created', { ...payload, text });
    }

    @OnEvent('incident.resolved')
    async onIncidentResolved(payload: IncidentEvent) {
        const channels = this.getChannelsFor(payload.userId, 'incident.resolved');
        const text = `✅ *Incident Resolved*: ${payload.title}${payload.resolution ? `\n> ${payload.resolution}` : ''}`;
        await this.fanOut(channels, 'incident.resolved', { ...payload, text });
    }

    @OnEvent('deploy.failed')
    async onDeployFailed(payload: DeployEvent) {
        const channels = this.getChannelsFor(payload.userId, 'deploy.failed');
        const text = `❌ *Deployment Failed*: ${payload.projectName} on ${payload.region ?? 'us-east-1'}`;
        await this.fanOut(channels, 'deploy.failed', { ...payload, text });
    }

    @OnEvent('deploy.success')
    async onDeploySuccess(payload: DeployEvent) {
        const channels = this.getChannelsFor(payload.userId, 'deploy.success');
        const text = `🚀 *Deployment Successful*: ${payload.projectName} is live on ${payload.region ?? 'us-east-1'}`;
        await this.fanOut(channels, 'deploy.success', { ...payload, text });
    }

    // ── Internal helpers ─────────────────────────────────────────

    private getChannelsFor(userId: string, event: string): NotificationChannel[] {
        return (CHANNEL_STORE[userId] ?? []).filter(
            c => c.enabled && c.enabledOn.includes(event),
        );
    }

    private async fanOut(channels: NotificationChannel[], event: string, data: any) {
        for (const ch of channels) {
            try {
                await this.dispatch(ch, event, data);
                this.logger.log(`[${ch.userId}] Sent ${event} via ${ch.type}:${ch.name}`);
            } catch (err: any) {
                this.logger.error(`[${ch.userId}] Failed ${ch.type}:${ch.name} — ${err.message}`);
            }
        }
    }

    private async dispatch(channel: NotificationChannel, event: string, data: any): Promise<void> {
        switch (channel.type) {
            case 'slack':
                await this.sendSlack(channel.config.webhookUrl, data.text ?? JSON.stringify(data));
                break;
            case 'webhook':
                await this.sendWebhook(channel.config.webhookUrl, { event, ...data });
                break;
            case 'pagerduty':
                await this.sendPagerDuty(channel.config.routingKey, data);
                break;
            case 'email':
                await this.sendEmail(channel.config.email, event, data);
                break;
        }
    }

    private async sendSlack(webhookUrl: string, text: string): Promise<void> {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                username: 'Orbitron',
                icon_emoji: ':robot_face:',
            }),
        });
        if (!res.ok) throw new Error(`Slack returned ${res.status}`);
    }

    private async sendWebhook(url: string, payload: object): Promise<void> {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Orbitron-Event': 'true' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
    }

    private async sendPagerDuty(routingKey: string, data: any): Promise<void> {
        const res = await fetch('https://events.pagerduty.com/v2/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                routing_key: routingKey,
                event_action: data.status === 'resolved' ? 'resolve' : 'trigger',
                payload: {
                    summary: data.title ?? data.text ?? 'Orbitron Alert',
                    severity: data.severity ?? 'warning',
                    source: 'orbitron',
                    timestamp: new Date().toISOString(),
                },
            }),
        });
        if (!res.ok) throw new Error(`PagerDuty returned ${res.status}`);
    }

    private async sendEmail(to: string, event: string, data: any): Promise<void> {
        // Uses existing EmailService — fire-and-forget
        await (this.email as any).send?.(
            to,
            `[Orbitron] ${event.replace('.', ' ')} — ${data.title ?? data.projectName ?? ''}`,
            `<p>${data.text ?? JSON.stringify(data)}</p>`,
        );
    }
}
