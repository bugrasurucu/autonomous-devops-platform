import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

const PLAN_TOKEN_BUDGETS: Record<Plan, number> = {
    free: 50_000,
    starter: 200_000,
    pro: 500_000,
    enterprise: 5_000_000,
};

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) {}

    async createOrganization(userId: string, name: string) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const k8sNamespace = `tenant-${slug}-${Date.now()}`.substring(0, 63);

        const existing = await this.prisma.organization.findUnique({ where: { slug } });
        if (existing) throw new ConflictException('Organization slug already taken');

        const org = await this.prisma.organization.create({
            data: {
                name,
                slug,
                k8sNamespace,
                monthlyTokenBudget: PLAN_TOKEN_BUDGETS.free,
                members: {
                    create: { userId, role: 'owner' },
                },
            },
            include: { members: true },
        });

        return org;
    }

    async getOrganizationByUserId(userId: string) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: { userId },
            include: { org: true },
            orderBy: { createdAt: 'asc' },
        });
        return membership?.org ?? null;
    }

    async getOrganizationById(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
        });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    async inviteMember(orgId: string, emailOrUserId: string, role: 'admin' | 'member' | 'viewer' = 'member') {
        const cleaned = (emailOrUserId || '').trim();
        if (!cleaned) {
            throw new ConflictException('Email or User ID is required');
        }

        let targetUserId = cleaned;
        if (cleaned.includes('@')) {
            const normalizedEmail = cleaned.toLowerCase();
            let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (!user) {
                const namePart = normalizedEmail.split('@')[0].replace(/[._-]/g, ' ');
                const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                user = await this.prisma.user.create({
                    data: {
                        email: normalizedEmail,
                        passwordHash: '',
                        name: displayName || 'Team Member',
                        plan: 'free',
                    },
                });
            }
            targetUserId = user.id;
        } else {
            const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }
        }

        const existingMember = await this.prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId, userId: targetUserId } },
        });
        if (existingMember) {
            throw new ConflictException('User is already a member of this organization');
        }

        return this.prisma.organizationMember.create({
            data: { orgId, userId: targetUserId, role },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    }

    async removeMember(orgId: string, userId: string) {
        return this.prisma.organizationMember.delete({
            where: { orgId_userId: { orgId, userId } },
        });
    }

    async updatePlan(orgId: string, plan: Plan) {
        return this.prisma.organization.update({
            where: { id: orgId },
            data: { plan, monthlyTokenBudget: PLAN_TOKEN_BUDGETS[plan] },
        });
    }

    async getOrCreateOrgForUser(userId: string) {
        const existing = await this.getOrganizationByUserId(userId);
        if (existing) return existing;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const baseName = user?.name ?? `org-${userId.substring(0, 8)}`;

        // Try base name first, then add unique suffix on conflict
        try {
            return await this.createOrganization(userId, baseName);
        } catch (e: any) {
            if (e?.status === 409 || e?.message?.includes('slug already taken')) {
                const suffix = userId.substring(0, 6);
                return this.createOrganization(userId, `${baseName}-${suffix}`);
            }
            throw e;
        }
    }

    /**
     * Faz 7 (H1): Environment-scoped Role-Based Access Control (RBAC) policy matrix
     */
    getRbacMatrix() {
        return {
            roles: [
                {
                    role: 'owner',
                    environments: ['development', 'staging', 'production'],
                    permissions: ['deploy.create', 'deploy.promote', 'deploy.rollback', 'deploy.destroy', 'billing.manage', 'team.manage', 'agents.configure'],
                },
                {
                    role: 'admin',
                    environments: ['development', 'staging', 'production'],
                    permissions: ['deploy.create', 'deploy.promote', 'deploy.rollback', 'deploy.destroy', 'team.manage', 'agents.configure'],
                },
                {
                    role: 'member',
                    environments: ['development', 'staging'],
                    permissions: ['deploy.create', 'deploy.rollback', 'agents.trigger'],
                },
                {
                    role: 'viewer',
                    environments: [],
                    permissions: ['metrics.read', 'logs.read', 'finops.read'],
                },
            ],
        };
    }

    /**
     * Faz 7 (H3): Query and export immutable Audit Log entries
     */
    async getAuditLogs(userId: string, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: Math.min(Math.max(limit, 1), 200),
        });
    }

    async exportAuditLogs(userId: string, format: 'json' | 'csv' = 'json') {
        const logs = await this.getAuditLogs(userId, 200);
        if (format === 'csv') {
            const header = 'id,action,resource,ipAddress,createdAt,metadata';
            const rows = logs.map((l) =>
                [
                    l.id,
                    l.action,
                    l.resource || '',
                    l.ipAddress || '',
                    l.createdAt.toISOString(),
                    `"${(l.metadata || '').replace(/"/g, '""')}"`,
                ].join(','),
            );
            return { format: 'csv', count: logs.length, data: [header, ...rows].join('\n') };
        }
        return { format: 'json', count: logs.length, data: logs };
    }
}
