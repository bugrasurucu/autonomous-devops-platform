import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

const PLAN_LIMITS = {
    free: 60,       // 60 req / min
    starter: 200,   // 200 req / min
    pro: 1000,      // 1000 req / min
    enterprise: 100000, // effectively unlimited
};

@Injectable()
export class RateLimitGuard implements CanActivate {
    private redis: Redis;

    constructor(private reflector: Reflector) {
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        // Skip rate limiting for webhooks or internal endpoints
        if (request.url.startsWith('/api/billing/webhook')) {
            return true;
        }

        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const user = request.user;
        const plan = user?.plan || 'free';
        
        // Use user ID if authenticated, otherwise use IP
        const identifier = user ? `user:${user.id}` : `ip:${ip}`;
        const key = `ratelimit:${identifier}`;
        
        const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const windowInSeconds = 60; // 1 minute window
        
        // Simple fixed window counter using Redis
        const currentCount = await this.redis.incr(key);
        
        if (currentCount === 1) {
            // Set expiry on first increment
            await this.redis.expire(key, windowInSeconds);
        }

        if (currentCount > limit) {
            throw new HttpException('Too Many Requests. Please upgrade your plan or wait.', HttpStatus.TOO_MANY_REQUESTS);
        }

        return true;
    }
}
