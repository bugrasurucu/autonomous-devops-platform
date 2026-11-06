import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

const PLAN_LIMITS: Record<string, number> = {
    free: 120,          // 120 req / min
    starter: 300,       // 300 req / min
    pro: 1000,          // 1000 req / min
    enterprise: 100000, // effectively unlimited
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

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Skip rate limiting for webhooks, health probes, or SSE streams
        if (
            !request?.url ||
            request.url.startsWith('/api/billing/webhook') ||
            request.url.startsWith('/api/health') ||
            request.url.startsWith('/api/logs/stream')
        ) {
            return true;
        }

        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const user = request.user;
        const plan = user?.plan || 'free';

        const identifier = user ? `user:${user.id}` : `ip:${ip}`;
        const key = `ratelimit:${identifier}`;
        const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const windowInSeconds = 60;

        if (this.redis && this.redisAvailable) {
            try {
                const currentCount = await this.redis.incr(key);
                if (currentCount === 1) {
                    await this.redis.expire(key, windowInSeconds);
                }
                if (currentCount > limit) {
                    throw new HttpException('Too Many Requests. Please upgrade your plan or wait.', HttpStatus.TOO_MANY_REQUESTS);
                }
                return true;
            } catch (err) {
                if (err instanceof HttpException) throw err;
                this.redisAvailable = false;
            }
        }

        // In-memory fallback when Redis is not running
        const now = Date.now();
        const entry = this.memoryCounters.get(key);
        if (!entry || now > entry.expiresAt) {
            this.memoryCounters.set(key, { count: 1, expiresAt: now + windowInSeconds * 1000 });
            return true;
        }
        entry.count += 1;
        if (entry.count > limit) {
            throw new HttpException('Too Many Requests. Please upgrade your plan or wait.', HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
}
