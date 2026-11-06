import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { encryptSecret, decryptSecret } from '../common/crypto.util';

const SUPPORTED_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'pro', desc: 'Most capable OpenAI model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'free', desc: 'Fast and economical' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'pro', desc: 'Best for code and analysis' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', tier: 'free', desc: 'Lightning fast' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', tier: 'free', desc: 'Fastest next-gen multimodal reasoning' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', tier: 'free', desc: 'Ultra fast multimodal' },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'google', tier: 'pro', desc: 'Advanced reasoning' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', tier: 'pro', desc: 'Open-source reasoning' },
    { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral', tier: 'enterprise', desc: 'European AI' },
];

const PLAN_LIMITS: Record<string, { agents: number; deploysPerMonth: number; models: string[] }> = {
    free: { agents: 2, deploysPerMonth: 5, models: ['gpt-4o-mini', 'gemini-2.5-flash', 'gemini-2.0-flash', 'claude-3-haiku'] },
    starter: { agents: 4, deploysPerMonth: 20, models: ['gpt-4o', 'gpt-4o-mini', 'gemini-2.5-flash', 'gemini-2.0-flash', 'claude-3-haiku'] },
    pro: { agents: 5, deploysPerMonth: 100, models: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'claude-3-haiku', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-pro', 'deepseek-r1'] },
    enterprise: { agents: 10, deploysPerMonth: -1, models: ['all'] },
};

@Injectable()
export class SettingsService {
    private readonly encryptionKey: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.encryptionKey = this.config.get('ENCRYPTION_KEY', 'devops-platform-encryption-key-2026');
    }

    getModels(userPlan: string) {
        const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
        return SUPPORTED_MODELS.map((m) => ({
            ...m,
            available: limits.models.includes('all') || limits.models.includes(m.id),
        }));
    }

    async getAgentModels(userId: string) {
        const configs = await this.prisma.agentConfig.findMany({
            where: { userId },
        });
        return configs;
    }

    async updateAgentModel(
        userId: string,
        agentId: string,
        data: { model?: string; temperature?: number; maxTokens?: number; customPrompt?: string; enabled?: boolean },
    ) {
        return this.prisma.agentConfig.upsert({
            where: { userId_agentId: { userId, agentId } },
            update: data,
            create: { userId, agentId, ...data },
        });
    }

    async getApiKeys(userId: string) {
        const keys = await this.prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return keys.map((k) => ({
            ...k,
            encryptedKey: undefined,
            maskedKey: this.maskKey(this.decrypt(k.encryptedKey)),
        }));
    }

    async createApiKey(userId: string, provider: string, key: string, label?: string) {
        const encrypted = this.encrypt(key);
        return this.prisma.apiKey.create({
            data: {
                userId,
                provider,
                encryptedKey: encrypted,
                label: label || '',
            },
        });
    }

    async deleteApiKey(userId: string, keyId: string) {
        const key = await this.prisma.apiKey.findFirst({
            where: { id: keyId, userId },
        });
        if (!key) throw new NotFoundException('API key not found');

        await this.prisma.apiKey.delete({ where: { id: keyId } });
        return { deleted: true };
    }

    async getUsage(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { orgMemberships: true },
        });
        if (!user) throw new NotFoundException('User not found');

        const adminEmails = (this.config.get<string>('ADMIN_EMAILS', '') || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        const isOwnerOrAdmin =
            user.plan === 'enterprise' ||
            adminEmails.includes(user.email.toLowerCase()) ||
            user.orgMemberships?.some((m) => m.role === 'owner' || m.role === 'admin');
        const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

        return {
            plan: user.plan,
            deploysThisMonth: user.deployCount,
            deployLimit: isOwnerOrAdmin ? -1 : user.deployLimit,
            agentLimit: limits.agents,
        };
    }

    private encrypt(text: string): string {
        return encryptSecret(text, this.encryptionKey);
    }

    private decrypt(encrypted: string): string {
        try {
            return decryptSecret(encrypted, this.encryptionKey);
        } catch {
            return '***';
        }
    }

    private maskKey(key: string): string {
        if (key.length <= 8) return '****';
        return key.substring(0, 4) + '****' + key.substring(key.length - 4);
    }
}
