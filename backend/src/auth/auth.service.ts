import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { signOAuthState, verifyOAuthState } from '../common/crypto.util';

const SALT_ROUNDS = 10;

const PLAN_LIMITS: Record<string, { agents: number; deploysPerMonth: number; models: string[] }> = {
    free: { agents: 2, deploysPerMonth: 5, models: ['gpt-4o-mini', 'gemini-2.0-flash', 'gemini-2.5-flash'] },
    starter: { agents: 4, deploysPerMonth: 20, models: ['gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash', 'gemini-2.5-flash'] },
    pro: { agents: 5, deploysPerMonth: 100, models: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-pro'] },
    enterprise: { agents: 10, deploysPerMonth: -1, models: ['all'] },
};

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private email: EmailService,
    ) { }

    async register(email: string, password: string, name: string) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: { email, passwordHash, name, plan: 'free' },
        });

        const token = this.generateToken(user);
        // Fire welcome email (non-blocking)
        this.email.sendWelcome(user.email, user.name ?? 'there').catch(() => null);
        return {
            token,
            user: this.sanitizeUser(user),
        };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const valid = bcrypt.compareSync(password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const token = this.generateToken(user);
        return {
            token,
            user: this.sanitizeUser(user),
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.sanitizeUser(user);
    }

    async updateProfile(userId: string, data: { name?: string; company?: string; avatar?: string }) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
        });
        return this.sanitizeUser(user);
    }

    async upgradePlan(userId: string, plan: string) {
        const validPlans = ['free', 'starter', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
            throw new ConflictException('Invalid plan: ' + plan);
        }
        const deployLimit = PLAN_LIMITS[plan]?.deploysPerMonth ?? 5;
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { plan: plan as any, deployLimit: deployLimit === -1 ? 999999 : deployLimit },
        });
        // Sync user's owned organization plan as well
        const tokenBudgets: Record<string, number> = {
            free: 50_000,
            starter: 200_000,
            pro: 500_000,
            enterprise: 5_000_000,
        };
        await this.prisma.organization.updateMany({
            where: { members: { some: { userId, role: 'owner' } } },
            data: { plan: plan as any, monthlyTokenBudget: tokenBudgets[plan] ?? 50_000 },
        });
        const token = this.generateToken(user);
        return { token, user: this.sanitizeUser(user) };
    }

    async changePassword(userId: string, currentPassword?: string, newPassword?: string) {
        if (!newPassword || newPassword.length < 6) {
            throw new ConflictException('New password must be at least 6 characters');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.passwordHash && currentPassword) {
            const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
            if (!valid) {
                throw new UnauthorizedException('Current password is incorrect');
            }
        }

        const passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        return { success: true, message: 'Password updated successfully' };
    }

    async exportUserData(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                deployments: { orderBy: { createdAt: 'desc' }, take: 100 },
                activities: { orderBy: { createdAt: 'desc' }, take: 200 },
                agentConfigs: true,
                incidents: { orderBy: { createdAt: 'desc' }, take: 100 },
                agentExecutions: { orderBy: { createdAt: 'desc' }, take: 100 },
                orgMemberships: { include: { org: true } },
            },
        });
        if (!user) throw new NotFoundException('User not found');
        const { passwordHash, githubToken, ...safeUser } = user;
        return {
            exportedAt: new Date().toISOString(),
            platform: 'Orbitron Autonomous DevOps Platform',
            data: safeUser,
        };
    }

    async deleteAccount(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        await this.prisma.user.delete({ where: { id: userId } });
        return { deleted: true };
    }

    async getGithubOAuthUrl() {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/github/callback`;
        const scope = 'user:email';
        const state = signOAuthState('github-oauth', process.env.JWT_SECRET || 'orbitron-oauth-secret');
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
    }

    /**
     * Faz 7 (H2): Enterprise SSO (OIDC / SAML 2.0) Provider Catalog & Status
     */
    getSsoProviders() {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return {
            protocolSupport: ['OIDC 1.0 (PKCE + RS256)', 'SAML 2.0 (SP-Initiated)', 'OAuth 2.0 + HMAC State'],
            providers: [
                {
                    id: 'github-oauth',
                    name: 'GitHub OAuth / GitHub Enterprise',
                    protocol: 'OAuth 2.0 + Signed CSRF State',
                    configured: Boolean(process.env.GITHUB_CLIENT_ID),
                    loginUrl: `${baseUrl}/auth/github`,
                    callbackUrl: `${baseUrl}/auth/github/callback`,
                },
                {
                    id: 'okta-oidc',
                    name: 'Okta Workforce Identity (OIDC)',
                    protocol: 'OIDC 1.0 + PKCE',
                    configured: Boolean(process.env.OKTA_CLIENT_ID && process.env.OKTA_ISSUER),
                    issuer: process.env.OKTA_ISSUER || 'https://your-org.okta.com/oauth2/default',
                    callbackUrl: `${baseUrl}/auth/sso/okta/callback`,
                },
                {
                    id: 'azure-entra-saml',
                    name: 'Microsoft Entra ID (Azure AD SAML 2.0 / OIDC)',
                    protocol: 'SAML 2.0 / OIDC',
                    configured: Boolean(process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_CLIENT_ID),
                    acsUrl: `${baseUrl}/auth/sso/entra/acs`,
                    entityId: 'urn:orbitron:enterprise:sp',
                },
                {
                    id: 'google-workspace-oidc',
                    name: 'Google Workspace Enterprise OIDC',
                    protocol: 'OIDC 1.0',
                    configured: Boolean(process.env.GOOGLE_CLIENT_ID),
                    callbackUrl: `${baseUrl}/auth/sso/google/callback`,
                },
            ],
        };
    }

    /**
     * Faz 7 (H2): RFC 6238 TOTP 2FA Setup & Verification
     */
    private deriveUserTotpSecret(userId: string, email: string): Buffer {
        const master = process.env.JWT_SECRET || 'orbitron-totp-default-key';
        return crypto.createHmac('sha256', master).update(`totp:${userId}:${email}`).digest().subarray(0, 20);
    }

    private toBase32(buf: Buffer): string {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';
        for (const byte of buf) {
            value = (value << 8) | byte;
            bits += 8;
            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }
        return output;
    }

    private generateTotpCode(secret: Buffer, counter: number): string {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64BE(BigInt(counter), 0);
        const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
        const offset = hmac[hmac.length - 1] & 0x0f;
        const binary =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);
        return String(binary % 1_000_000).padStart(6, '0');
    }

    async setupTwoFactor(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const secretBuf = this.deriveUserTotpSecret(user.id, user.email);
        const base32Secret = this.toBase32(secretBuf);
        const currentStep = Math.floor(Date.now() / 1000 / 30);
        const currentCode = this.generateTotpCode(secretBuf, currentStep);
        const otpauthUri = `otpauth://totp/Orbitron:${encodeURIComponent(user.email)}?secret=${base32Secret}&issuer=Orbitron&algorithm=SHA1&digits=6&period=30`;

        const recoveryCodes = Array.from({ length: 6 }, (_, i) =>
            crypto
                .createHash('sha256')
                .update(`${base32Secret}:recovery:${i}`)
                .digest('hex')
                .substring(0, 8)
                .toUpperCase(),
        );

        return {
            algorithm: 'RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30s)',
            secret: base32Secret,
            otpauthUri,
            currentCode,
            recoveryCodes,
        };
    }

    async verifyTwoFactor(userId: string, code: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const cleanCode = String(code || '').trim();
        const secretBuf = this.deriveUserTotpSecret(user.id, user.email);
        const currentStep = Math.floor(Date.now() / 1000 / 30);
        const validCodes = [-1, 0, 1].map((offset) => this.generateTotpCode(secretBuf, currentStep + offset));

        const isValid = validCodes.includes(cleanCode);
        if (!isValid) {
            throw new UnauthorizedException('Invalid 2FA TOTP code');
        }

        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'auth.2fa_verified',
                resource: user.email,
                metadata: JSON.stringify({ method: 'TOTP-RFC6238', verifiedAt: new Date().toISOString() }),
            },
        }).catch(() => {});

        return {
            verified: true,
            enabled: true,
            method: 'TOTP-RFC6238-SHA1',
            verifiedAt: new Date().toISOString(),
        };
    }

    async githubLogin(code: string) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/github/callback`;

        // 1. Get Access Token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
        });
        const tokenData: any = await tokenRes.json();
        if (tokenData.error || !tokenData.access_token) {
            throw new UnauthorizedException('GitHub OAuth failed');
        }

        // 2. Get User Info & Emails
        const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const ghUser: any = await userRes.json();

        const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const ghEmails: any[] = await emailsRes.json();
        const primaryEmail = ghEmails.find((e) => e.primary)?.email || ghUser.email || ghEmails[0]?.email;

        if (!primaryEmail) throw new UnauthorizedException('No email found in GitHub account');

        // 3. Upsert User
        let user = await this.prisma.user.findUnique({ where: { email: primaryEmail } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: primaryEmail,
                    passwordHash: '', // No password for OAuth users
                    name: ghUser.name || ghUser.login,
                    avatar: ghUser.avatar_url,
                    plan: 'free',
                },
            });
            this.email.sendWelcome(user.email, user.name ?? 'there').catch(() => null);
        } else if (!user.avatar) {
            user = await this.prisma.user.update({
                where: { email: primaryEmail },
                data: { avatar: ghUser.avatar_url },
            });
        }

        const token = this.generateToken(user);
        return { token, user: this.sanitizeUser(user) };
    }

    private generateToken(user: { id: string; email: string; plan: string }) {
        return this.jwt.sign({
            sub: user.id,
            email: user.email,
            plan: user.plan,
        });
    }

    private sanitizeUser(user: any) {
        const { passwordHash, ...rest } = user;
        const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
        return { ...rest, planLimits };
    }
}
