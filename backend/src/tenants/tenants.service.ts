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

    async inviteMember(orgId: string, invitedUserId: string, role: 'admin' | 'member' | 'viewer' = 'member') {
        return this.prisma.organizationMember.create({
            data: { orgId, userId: invitedUserId, role },
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
}
