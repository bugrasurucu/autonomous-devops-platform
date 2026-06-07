import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

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

    async listChannels(userId: string) {
        const channels = await this.prisma.notificationChannel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return channels.map(this.deserializeChannel);
    }

    async createChannel(
        userId: string,
        body: {
            name: string;
            type: 'slack' | 'webhook' | 'email' | 'pagerduty';
            config: Record<string, string>;
            enabledOn?: string[];
        },
    ) {
        const enabledOn = body.enabledOn ?? ['incident.created', 'incident.resolved', 'deploy.failed'];
        const channel = await this.prisma.notificationChannel.create({
            data: {
                userId,
                name: body.name,
                type: body.type,
                config: JSON.stringify(body.config),
                enabledOn: JSON.stringify(enabledOn),
                enabled: true,
            },
        });
        this.logger.log(`[${userId}] Created ${channel.type} channel: ${channel.name}`);
        return this.deserializeChannel(channel);
    }

    async updateChannel(userId: string, id: string, patch: any) {
        const dataToUpdate: any = { ...patch };
        if (patch.config) dataToUpdate.config = JSON.stringify(patch.config);
        if (patch.enabledOn) dataToUpdate.enabledOn = JSON.stringify(patch.enabledOn);

        try {
            const channel = await this.prisma.notificationChannel.update({
                where: { id, userId },
                data: dataToUpdate,
            });
            return this.deserializeChannel(channel);
        } catch (error) {
            throw new NotFoundException('Channel not found');
        }
    }

    async deleteChannel(userId: string, id: string): Promise<{ ok: boolean }> {
        try {
            await this.prisma.notificationChannel.delete({
                where: { id, userId },
            });
            return { ok: true };
        } catch (error) {
            throw new NotFoundException('Channel not found');
        }
    }

    // ── Test ─────────────────────────────────────────────────────

    async testChannel(userId: string, id: string): Promise<{ ok: boolean; message: string }> {
        const channel = await this.prisma.notificationChannel.findFirst({
            where: { id, userId },
        });
        if (!channel) throw new NotFoundException('Channel not found');

        const testPayload = {
            event: 'test',
            text: `🧪 This is a test notification from Orbitron — channel "${channel.name}" is working!`,
            timestamp: new Date().toISOString(),
        };

        try {
            await this.dispatch(this.deserializeChannel(channel), 'test', testPayload);
            return { ok: true, message: 'Test notification sent successfully' };
        } catch (err: any) {
            return { ok: false, message: err.message };
        }
    }

    // ── Event listeners ──────────────────────────────────────────

    @OnEvent('incident.created')
    async onIncidentCreated(payload: IncidentEvent) {
        const channels = await this.getChannelsFor(payload.userId, 'incident.created');
        const text = `🚨 *New ${payload.severity.toUpperCase()} Incident*: ${payload.title}`;
        await this.fanOut(channels, 'incident.created', { ...payload, text });
    }

    @OnEvent('incident.resolved')
    async onIncidentResolved(payload: IncidentEvent) {
        const channels = await this.getChannelsFor(payload.userId, 'incident.resolved');
        const resolutionText = payload.resolution ? `\n> ${payload.resolution}` : '';
        const text = `✅ *Incident Resolved*: ${payload.title}${resolutionText}`;
        await this.fanOut(channels, 'incident.resolved', { ...payload, text });
    }

    @OnEvent('deploy.failed')
    async onDeployFailed(payload: DeployEvent) {
        const channels = await this.getChannelsFor(payload.userId, 'deploy.failed');
        const text = `❌ *Deployment Failed*: ${payload.projectName} on ${payload.region ?? 'us-east-1'}`;
        await this.fanOut(channels, 'deploy.failed', { ...payload, text });
    }

    @OnEvent('deploy.success')
    async onDeploySuccess(payload: DeployEvent) {
        const channels = await this.getChannelsFor(payload.userId, 'deploy.success');
        const text = `🚀 *Deployment Successful*: ${payload.projectName} is live on ${payload.region ?? 'us-east-1'}`;
        await this.fanOut(channels, 'deploy.success', { ...payload, text });
    }

    // ── Internal helpers ─────────────────────────────────────────

    private deserializeChannel(channel: any) {
        return {
            ...channel,
            config: JSON.parse(channel.config || '{}'),
            enabledOn: JSON.parse(channel.enabledOn || '[]'),
        };
    }

    private async getChannelsFor(userId: string, event: string) {
        const channels = await this.prisma.notificationChannel.findMany({
            where: { userId, enabled: true },
        });
        return channels.map(this.deserializeChannel).filter(c => c.enabledOn.includes(event));
    }

    private async fanOut(channels: any[], event: string, data: any) {
        for (const ch of channels) {
            try {
                await this.dispatch(ch, event, data);
                this.logger.log(`[${ch.userId}] Sent ${event} via ${ch.type}:${ch.name}`);
            } catch (err: any) {
                this.logger.error(`[${ch.userId}] Failed ${ch.type}:${ch.name} — ${err.message}`);
            }
        }
    }

    private async dispatch(channel: any, event: string, data: any): Promise<void> {
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
