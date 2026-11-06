import { Logger } from '@nestjs/common';

const INSECURE_DEFAULTS = new Set([
    'change-me-in-production',
    'mission-control-saas-2026-secret-key',
    'devops-platform-encryption-key-2026',
    'your-super-secret-jwt-key',
]);

/**
 * Validates critical environment variables on startup.
 * In production (`NODE_ENV === 'production'`), missing or placeholder secrets halt boot immediately.
 * In development, logs clear security warnings while providing deterministic local dev keys.
 */
export function validateRuntimeEnv(env: Record<string, any>): Record<string, any> {
    const logger = new Logger('EnvValidation');
    const isProd = env.NODE_ENV === 'production';

    const jwtSecret = env.JWT_SECRET;
    const encryptionKey = env.ENCRYPTION_KEY;

    if (!jwtSecret || INSECURE_DEFAULTS.has(jwtSecret)) {
        if (isProd) {
            throw new Error(
                'FATAL SECURITY ERROR: JWT_SECRET must be set to a strong, non-default value in production.',
            );
        }
        logger.warn('JWT_SECRET is using a local development fallback. Set a strong JWT_SECRET before deploying.');
        env.JWT_SECRET = jwtSecret || 'orbitron-local-dev-jwt-secret-only';
    }

    if (!encryptionKey || INSECURE_DEFAULTS.has(encryptionKey)) {
        if (isProd) {
            throw new Error(
                'FATAL SECURITY ERROR: ENCRYPTION_KEY must be set to a strong, non-default value in production.',
            );
        }
        logger.warn('ENCRYPTION_KEY is using a local development fallback. Set ENCRYPTION_KEY before deploying.');
        env.ENCRYPTION_KEY = encryptionKey || 'devops-platform-encryption-key-2026';
    }

    if (!env.DATABASE_URL) {
        if (isProd) {
            throw new Error('FATAL CONFIG ERROR: DATABASE_URL is required in production.');
        }
        logger.warn('DATABASE_URL not explicitly set in env; relying on Prisma .env resolution.');
    }

    return env;
}

