import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { encryptSecret, decryptSecret, signOAuthState, verifyOAuthState } from '../common/crypto.util';

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

    isOAuthConfigured(): boolean {
        const clientId = this.config.get('GITHUB_CLIENT_ID', '');
        return Boolean(clientId && clientId !== 'your_github_client_id');
    }

    getOAuthUrl(userId?: string): string {
        const clientId = this.config.get('GITHUB_CLIENT_ID', '');
        const redirectUri = this.config.get('GITHUB_REDIRECT_URI', 'http://localhost:3001/api/github/callback');
        const scope = 'repo read:user';
        const state = userId ? signOAuthState(userId, this.encryptionKey) : '';
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
    }

    verifyOAuthStateToken(state?: string): string | null {
        if (!state) return null;
        return verifyOAuthState(state, this.encryptionKey);
    }

    async connectWithTokenOrUsername(userId: string, payload: { username?: string; token?: string }): Promise<{ connected: boolean; username: string }> {
        const rawToken = payload.token?.trim();
        const rawUsername = payload.username?.trim().replace(/^@/, '');

        if (rawToken) {
            const userRes = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${rawToken}`, 'User-Agent': 'Orbitron-DevOps-Platform' },
            });
            if (!userRes.ok) {
                throw new UnauthorizedException('Invalid GitHub Personal Access Token');
            }
            const ghUser: any = await userRes.json();
            const encrypted = this.encrypt(rawToken);
            await this.prisma.user.update({
                where: { id: userId },
                data: { githubToken: encrypted, githubUsername: ghUser.login },
            });
            this.logger.log(`GitHub PAT connected for user ${userId}: @${ghUser.login}`);
            return { connected: true, username: ghUser.login };
        }

        if (rawUsername) {
            // Verify public GitHub profile or store username for public repo fetching
            let resolvedLogin = rawUsername;
            try {
                const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(rawUsername)}`, {
                    headers: { 'User-Agent': 'Orbitron-DevOps-Platform' },
                });
                if (userRes.ok) {
                    const ghUser: any = await userRes.json();
                    resolvedLogin = ghUser.login || rawUsername;
                }
            } catch {
                // Allow offline/fallback connection with provided username
            }
            const marker = this.encrypt(`PUBLIC_USER:${resolvedLogin}`);
            await this.prisma.user.update({
                where: { id: userId },
                data: { githubToken: marker, githubUsername: resolvedLogin },
            });
            this.logger.log(`GitHub public profile connected for user ${userId}: @${resolvedLogin}`);
            return { connected: true, username: resolvedLogin };
        }

        throw new UnauthorizedException('Please provide a GitHub username or Personal Access Token');
    }

    async exchangeCode(userId: string, code: string): Promise<{ username: string }> {
        const clientId = this.config.get('GITHUB_CLIENT_ID', '');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET', '');

        // Exchange code for access token
        const redirectUri = this.config.get('GITHUB_REDIRECT_URI', 'http://localhost:3001/api/github/callback');
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
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

    async getStatus(userId: string): Promise<{ connected: boolean; username?: string; oauthConfigured?: boolean }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const oauthConfigured = this.isOAuthConfigured();
        if (!user?.githubToken && !user?.githubUsername) return { connected: false, oauthConfigured };
        return { connected: true, username: user.githubUsername ?? undefined, oauthConfigured };
    }

    async disconnect(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubToken: null, githubUsername: null },
        });
    }

    async listRepos(userId: string, search?: string): Promise<any[]> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.githubToken && !user?.githubUsername) {
            throw new UnauthorizedException('GitHub not connected');
        }

        const decrypted = user.githubToken ? this.decrypt(user.githubToken) : `PUBLIC_USER:${user.githubUsername}`;
        const isPublicUserMode = decrypted.startsWith('PUBLIC_USER:');
        const username = isPublicUserMode ? decrypted.replace('PUBLIC_USER:', '') : user.githubUsername;

        const url = isPublicUserMode
            ? `https://api.github.com/users/${encodeURIComponent(username || 'bugrasurucu')}/repos?per_page=100&sort=updated`
            : 'https://api.github.com/user/repos?per_page=100&sort=updated&type=owner';

        const headers: Record<string, string> = { 'User-Agent': 'Orbitron-DevOps-Platform' };
        if (!isPublicUserMode && decrypted) {
            headers.Authorization = `Bearer ${decrypted}`;
        }

        const res = await fetch(url, { headers });

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
        return encryptSecret(text, this.encryptionKey);
    }

    private decrypt(encrypted: string): string {
        return decryptSecret(encrypted, this.encryptionKey);
    }
}
