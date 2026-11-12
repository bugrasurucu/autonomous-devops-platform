import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

const PLAN_LIMITS: Record<string, number> = {
    free: 5000,         // 5000 req / min
    starter: 10000,     // 10000 req / min
    pro: 50000,         // 50000 req / min
    enterprise: 500000, // effectively unlimited
};

@Injectable()
export class RateLimitGuard implements CanActivate {
    private redis: Redis | null = null;
    private redisAvailable = false;
    private memoryCounters = new Map<string, { count: number; expiresAt: number }>();

    constructor(private reflector: Reflector) {
        try {
            const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                retryStrategy: () => null, // Do not endlessly retry when running without Redis
            });
            client.on('ready', () => {
                this.redisAvailable = true;
            });
            client.on('error', () => {
                this.redisAvailable = false;
            });
            client.connect().catch(() => {
                this.redisAvailable = false;
            });
            this.redis = client;
        } catch {
            this.redisAvailable = false;
        }
    }

    /** Brute-force sensitive endpoints — always rate-limited per IP, in every environment. */
    private static readonly AUTH_PATHS = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/2fa/verify',
        '/api/auth/2fa/disable',
        '/api/auth/change-password',
    ];
    private static readonly AUTH_LIMIT_PER_MIN = 20;
    private static readonly GET_LIMIT_PER_MIN = 1200;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (!request?.url) return true;

        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const path: string = String(request.url).split('?')[0];

        // 1) Auth endpoints: strict per-IP limit, never bypassed (prevents credential / TOTP brute force).
        if (request.method === 'POST' && RateLimitGuard.AUTH_PATHS.includes(path)) {
            await this.hit(`ratelimit:auth:${ip}:${path}`, RateLimitGuard.AUTH_LIMIT_PER_MIN);
            return true;
        }

        // 2) Unmetered infrastructure endpoints (webhooks are signature-verified, probes are cheap).
        if (
            path.startsWith('/api/billing/webhook') ||
            path.startsWith('/api/health') ||
            path.startsWith('/api/logs/stream')
        ) {
            return true;
        }

        // 3) Local development: skip metering so dashboard polling never gets throttled.
        const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        if (process.env.NODE_ENV !== 'production' || isLoopback) {
            return true;
        }

        // 4) Production: GET polling gets a generous but finite budget; mutations are plan-metered.
        if (request.method === 'GET') {
            await this.hit(`ratelimit:get:${ip}`, RateLimitGuard.GET_LIMIT_PER_MIN);
            return true;
        }
        const user = request.user;
        const plan = user?.plan || 'free';
        const identifier = user ? `user:${user.id}` : `ip:${ip}`;
        await this.hit(`ratelimit:${identifier}`, PLAN_LIMITS[plan] || PLAN_LIMITS.free);
        return true;
    }

    private async hit(key: string, limit: number, windowInSeconds = 60): Promise<void> {
        if (this.redis && this.redisAvailable) {
            try {
                const currentCount = await this.redis.incr(key);
                if (currentCount === 1) {
                    await this.redis.expire(key, windowInSeconds);
                }
                if (currentCount > limit) {
                    throw new HttpException('Too Many Requests. Please wait and try again.', HttpStatus.TOO_MANY_REQUESTS);
                }
                return;
            } catch (err) {
                if (err instanceof HttpException) throw err;
                this.redisAvailable = false;
            }
        }

        // In-memory fallback when Redis is not running
        const now = Date.now();
        if (this.memoryCounters.size > 10_000) {
            for (const [k, v] of this.memoryCounters) if (now > v.expiresAt) this.memoryCounters.delete(k);
        }
        const entry = this.memoryCounters.get(key);
        if (!entry || now > entry.expiresAt) {
            this.memoryCounters.set(key, { count: 1, expiresAt: now + windowInSeconds * 1000 });
            return;
        }
        entry.count += 1;
        if (entry.count > limit) {
            throw new HttpException('Too Many Requests. Please wait and try again.', HttpStatus.TOO_MANY_REQUESTS);
        }
    }
}
