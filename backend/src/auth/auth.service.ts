import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { signOAuthState, verifyOAuthState, encryptSecret, decryptSecret } from '../common/crypto.util';

/** Fields that must never leave the API boundary. */
const SENSITIVE_USER_FIELDS = [
    'passwordHash',
    'githubToken',
    'twoFactorSecret',
    'twoFactorLastStep',
    'twoFactorRecoveryHashes',
] as const;

function oauthStateSecret(): string {
    return process.env.JWT_SECRET || 'orbitron-local-dev-jwt-secret-only';
}

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

    async login(email: string, password: string, totpCode?: string) {
        const user: any = await this.prisma.user.findUnique({ where: { email } });
        // OAuth-only accounts have an empty passwordHash and must not be loggable via password.
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const valid = bcrypt.compareSync(password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.twoFactorEnabled) {
            if (!totpCode) {
                throw new UnauthorizedException({ statusCode: 401, message: '2FA_REQUIRED', twoFactorRequired: true });
            }
            if (!(await this.consumeSecondFactor(user, totpCode))) {
                await this.prisma.auditLog.create({
                    data: { userId: user.id, action: 'auth.2fa_failed', resource: user.email, metadata: '{}' },
                }).catch(() => {});
                throw new UnauthorizedException({ statusCode: 401, message: 'Invalid 2FA code', twoFactorRequired: true });
            }
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

    /**
     * Direct plan change WITHOUT payment. Only allowed when Stripe is not configured AND
     * self-service plan changes are explicitly enabled (self-hosted / local dev), or for admins.
     * Otherwise plan changes must go through Stripe checkout + webhook.
     */
    private async assertPlanChangeAllowed(userId: string, plan: string) {
        if (plan === 'free') return; // downgrades are always allowed
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const adminEmails = (process.env.ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        if (user && adminEmails.includes(user.email.toLowerCase())) return;

        const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
        const selfServiceAllowed =
            process.env.ALLOW_SELF_SERVICE_PLAN_CHANGE === 'true' ||
            (process.env.NODE_ENV !== 'production' && process.env.ALLOW_SELF_SERVICE_PLAN_CHANGE !== 'false');
        if (stripeConfigured || !selfServiceAllowed) {
            throw new ForbiddenException('Paid plan upgrades must be completed via Stripe checkout (POST /api/billing/checkout).');
        }
    }

    async upgradePlan(userId: string, plan: string) {
        const validPlans = ['free', 'starter', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
            throw new ConflictException('Invalid plan: ' + plan);
        }
        await this.assertPlanChangeAllowed(userId, plan);
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

        if (user.passwordHash) {
            if (!currentPassword) {
                throw new UnauthorizedException('Current password is required');
            }
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
        const safeUser: Record<string, any> = { ...user };
        for (const f of SENSITIVE_USER_FIELDS) delete safeUser[f];
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
        const state = signOAuthState('github-login', oauthStateSecret());
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
     * Faz 7 (H2): RFC 6238 TOTP 2FA — per-user random secret, AES-256-GCM encrypted at rest,
     * replay-protected (last used time-step persisted), single-use hashed recovery codes,
     * and enforced on password login once enabled.
     */
    private encKey(): string {
        return process.env.ENCRYPTION_KEY || 'devops-platform-encryption-key-2026';
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

    private hashRecoveryCode(code: string): string {
        return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    }

    /**
     * Returns the matched time-step if `code` is valid (±1 step window) and newer than the last
     * accepted step (replay protection); otherwise null.
     */
    private matchTotpStep(secretB64: string, code: string, lastStep?: number | null): number | null {
        const clean = String(code || '').replace(/\s/g, '');
        if (!/^\d{6}$/.test(clean)) return null;
        const secret = Buffer.from(secretB64, 'base64');
        const now = Math.floor(Date.now() / 1000 / 30);
        for (const step of [now - 1, now, now + 1]) {
            const expected = Buffer.from(this.generateTotpCode(secret, step));
            const provided = Buffer.from(clean);
            if (expected.length === provided.length && crypto.timingSafeEqual(expected, provided)) {
                if (lastStep != null && step <= lastStep) return null;
                return step;
            }
        }
        return null;
    }

    async setupTwoFactor(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if ((user as any).twoFactorEnabled) {
            throw new ConflictException('2FA is already enabled. Disable it first to re-enroll.');
        }

        const secretBuf = crypto.randomBytes(20);
        const base32Secret = this.toBase32(secretBuf);
        const otpauthUri = `otpauth://totp/Orbitron:${encodeURIComponent(user.email)}?secret=${base32Secret}&issuer=Orbitron&algorithm=SHA1&digits=6&period=30`;
        const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: encryptSecret(secretBuf.toString('base64'), this.encKey()),
                twoFactorEnabled: false,
                twoFactorLastStep: null,
                twoFactorRecoveryHashes: JSON.stringify(recoveryCodes.map((c) => this.hashRecoveryCode(c))),
            } as any,
        });

        // The secret & recovery codes are shown ONCE; the current code is never returned.
        return {
            algorithm: 'RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30s)',
            secret: base32Secret,
            otpauthUri,
            recoveryCodes,
            enabled: false,
            next: 'POST /api/auth/2fa/verify with a code from your authenticator app to activate 2FA',
        };
    }

    async verifyTwoFactor(userId: string, code: string) {
        const user: any = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.twoFactorSecret) throw new ConflictException('2FA setup has not been started');

        const secretB64 = decryptSecret(user.twoFactorSecret, this.encKey());
        const step = this.matchTotpStep(secretB64, code, user.twoFactorLastStep);
        if (step === null) throw new UnauthorizedException('Invalid or already-used 2FA code');

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true, twoFactorLastStep: step } as any,
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: user.twoFactorEnabled ? 'auth.2fa_verified' : 'auth.2fa_enabled',
                resource: user.email,
                metadata: JSON.stringify({ method: 'TOTP-RFC6238' }),
            },
        }).catch(() => {});

        return { verified: true, enabled: true, method: 'TOTP-RFC6238-SHA1' };
    }

    async disableTwoFactor(userId: string, code: string) {
        const user: any = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.twoFactorEnabled) return { enabled: false };
        if (!(await this.consumeSecondFactor(user, code))) {
            throw new UnauthorizedException('Invalid 2FA or recovery code');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorLastStep: null,
                twoFactorRecoveryHashes: null,
            } as any,
        });
        await this.prisma.auditLog.create({
            data: { userId, action: 'auth.2fa_disabled', resource: user.email, metadata: '{}' },
        }).catch(() => {});
        return { enabled: false };
    }

    async getTwoFactorStatus(userId: string) {
        const user: any = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const remaining = user.twoFactorRecoveryHashes ? JSON.parse(user.twoFactorRecoveryHashes).length : 0;
        return { enabled: !!user.twoFactorEnabled, recoveryCodesRemaining: remaining };
    }

    /** Accepts either a TOTP code (replay-protected) or a single-use recovery code. */
    private async consumeSecondFactor(user: any, code?: string): Promise<boolean> {
        if (!code || !user.twoFactorSecret) return false;
        const secretB64 = decryptSecret(user.twoFactorSecret, this.encKey());
        const step = this.matchTotpStep(secretB64, code, user.twoFactorLastStep);
        if (step !== null) {
            await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorLastStep: step } as any });
            return true;
        }
        const hashes: string[] = user.twoFactorRecoveryHashes ? JSON.parse(user.twoFactorRecoveryHashes) : [];
        const h = this.hashRecoveryCode(code);
        const idx = hashes.indexOf(h);
        if (idx >= 0) {
            hashes.splice(idx, 1);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { twoFactorRecoveryHashes: JSON.stringify(hashes) } as any,
            });
            await this.prisma.auditLog.create({
                data: { userId: user.id, action: 'auth.2fa_recovery_code_used', resource: user.email, metadata: JSON.stringify({ remaining: hashes.length }) },
            }).catch(() => {});
            return true;
        }
        return false;
    }

    async githubLogin(code: string, state?: string) {
        // CSRF / login-fixation protection: the state must be one we signed in getGithubOAuthUrl().
        if (!state || verifyOAuthState(state, oauthStateSecret()) !== 'github-login') {
            throw new UnauthorizedException('Invalid or expired OAuth state');
        }
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
        const rest: Record<string, any> = { ...user };
        for (const f of SENSITIVE_USER_FIELDS) delete rest[f];
        const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
        return { ...rest, githubConnected: !!user.githubToken || !!user.githubUsername, planLimits };
    }
}
