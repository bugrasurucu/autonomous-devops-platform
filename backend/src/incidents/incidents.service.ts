import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
