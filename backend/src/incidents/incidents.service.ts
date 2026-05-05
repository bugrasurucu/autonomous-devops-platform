import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SIMULATED_INCIDENTS = [
    { title: 'CPU spike detected on api-service', description: 'CPU usage exceeded 95% threshold for 5 consecutive minutes. Auto-scaling triggered.', severity: 'critical' },
    { title: 'Memory leak in worker-pool', description: 'Heap memory growing 2MB/min. Worker processes consuming 89% of available RAM.', severity: 'high' },
    { title: 'Database connection pool exhausted', description: 'PostgreSQL connection pool at 100% capacity. Queries queuing, p99 latency > 5s.', severity: 'critical' },
    { title: 'Increased error rate on /api/deploy', description: '502 Bad Gateway errors at 12% of requests. Upstream timeout from kagent bridge.', severity: 'high' },
    { title: 'SSL certificate expiring soon', description: 'TLS certificate for api.orbitron.dev expires in 7 days. Auto-renewal may have failed.', severity: 'medium' },
    { title: 'Disk I/O saturation on db-primary', description: 'Disk utilization at 97%. Write throughput degraded. Consider adding read replicas.', severity: 'high' },
    { title: 'RabbitMQ queue depth spike', description: 'agent-tasks queue depth reached 10,000 messages. Consumer lag increasing.', severity: 'medium' },
];

@Injectable()
export class IncidentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string, limit = 20) {
        return this.prisma.incident.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async create(userId: string, title: string, description?: string, severity?: string) {
        return this.prisma.incident.create({
            data: {
                userId,
                title,
                description: description || null,
                severity: severity || 'medium',
                status: 'active',
            },
        });
    }

    async simulate(userId: string) {
        const template = SIMULATED_INCIDENTS[Math.floor(Math.random() * SIMULATED_INCIDENTS.length)];
        return this.create(userId, template.title, template.description, template.severity);
    }

    async resolve(userId: string, id: string, resolution?: string) {
        const incident = await this.prisma.incident.findFirst({
            where: { id, userId },
        });
        if (!incident) throw new NotFoundException('Incident not found');

        return this.prisma.incident.update({
            where: { id },
            data: {
                status: 'resolved',
                resolution: resolution || 'Manually resolved',
                resolvedAt: new Date(),
            },
        });
    }

    async getStats(userId: string) {
        const [active, resolved, total] = await Promise.all([
            this.prisma.incident.count({ where: { userId, status: 'active' } }),
            this.prisma.incident.count({ where: { userId, status: 'resolved' } }),
            this.prisma.incident.count({ where: { userId } }),
        ]);
        return { active, resolved, total };
    }
}

