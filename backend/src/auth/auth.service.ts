import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const SALT_ROUNDS = 10;

const PLAN_LIMITS = {
    free: { agents: 2, deploysPerMonth: 5, models: ['gpt-4o-mini', 'gemini-2.0-flash'] },
    pro: { agents: 5, deploysPerMonth: 50, models: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-2.0-flash', 'gemini-2.0-pro'] },
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
        const validPlans = ['free', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
            throw new ConflictException('Invalid plan: ' + plan);
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { plan: plan as any },
        });
        const token = this.generateToken(user);
        return { token, user: this.sanitizeUser(user) };
    }

    async getGithubOAuthUrl() {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/github/callback`;
        const scope = 'user:email';
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
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
