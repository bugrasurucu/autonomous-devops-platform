import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);
    private readonly encryptionKey: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.encryptionKey = this.config.get('ENCRYPTION_KEY', 'devops-platform-encryption-key-2026');
    }

    getOAuthUrl(): string {
        const clientId = this.config.get('GITHUB_CLIENT_ID', '');
        const redirectUri = this.config.get('GITHUB_REDIRECT_URI', 'http://localhost:3001/api/github/callback');
        const scope = 'repo read:user';
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    }

    async exchangeCode(userId: string, code: string): Promise<{ username: string }> {
        const clientId = this.config.get('GITHUB_CLIENT_ID', '');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET', '');

        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });

        const tokenData: any = await tokenRes.json();
        if (tokenData.error || !tokenData.access_token) {
            throw new UnauthorizedException('GitHub OAuth failed: ' + (tokenData.error_description || 'Unknown error'));
        }

        const accessToken: string = tokenData.access_token;

        // Get GitHub user info
        const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DevOps-Platform' },
        });
        const ghUser: any = await userRes.json();

        // Store encrypted token
        const encrypted = this.encrypt(accessToken);
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubToken: encrypted, githubUsername: ghUser.login },
        });

        this.logger.log(`GitHub connected for user ${userId}: @${ghUser.login}`);
        return { username: ghUser.login };
    }

    async getStatus(userId: string): Promise<{ connected: boolean; username?: string }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.githubToken) return { connected: false };
        return { connected: true, username: user.githubUsername ?? undefined };
    }

    async disconnect(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubToken: null, githubUsername: null },
        });
    }

    async listRepos(userId: string, search?: string): Promise<any[]> {
        const token = await this.getDecryptedToken(userId);
        const url = 'https://api.github.com/user/repos?per_page=100&sort=updated&type=owner';
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'DevOps-Platform' },
        });

        if (!res.ok) throw new UnauthorizedException('GitHub API call failed');
        const repos: any[] = await res.json();

        return repos
            .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()))
            .map((r) => ({
                id: r.id,
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                language: r.language,
                stars: r.stargazers_count,
                private: r.private,
                defaultBranch: r.default_branch,
                updatedAt: r.updated_at,
                url: r.html_url,
                cloneUrl: r.clone_url,
            }));
    }

    async getRepo(userId: string, owner: string, repo: string): Promise<any> {
        const token = await this.getDecryptedToken(userId);
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'DevOps-Platform' },
        });
        if (!res.ok) throw new UnauthorizedException('Repo not found or no access');
        const data: any = await res.json();

        return {
            fullName: data.full_name,
            description: data.description,
            language: data.language,
            defaultBranch: data.default_branch,
            cloneUrl: data.clone_url,
        };
    }

    private async getDecryptedToken(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.githubToken) throw new UnauthorizedException('GitHub not connected');
        return this.decrypt(user.githubToken);
    }

    private encrypt(text: string): string {
        return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    }

    private decrypt(encrypted: string): string {
        const bytes = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}
