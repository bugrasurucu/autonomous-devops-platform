import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;

        // Only log mutations
        if (method === 'GET' || method === 'OPTIONS') {
            return next.handle();
        }

        const url = req.url;
        const ip = req.ip || req.connection?.remoteAddress;
        const user = req.user;
        const userId = user?.id || 'anonymous';
        
        // Don't log passwords or sensitive data in body
        const safeBody = { ...req.body };
        if (safeBody.password) delete safeBody.password;
        if (safeBody.token) delete safeBody.token;
        if (safeBody.secret) delete safeBody.secret;

        return next.handle().pipe(
            tap({
                next: async (data) => {
                    // Action succeeded
                    try {
                        const data: any = {
                            action: `${method} ${url}`,
                            resource: url.split('/')[2] || 'unknown',
                            metadata: JSON.stringify({ body: safeBody, status: 'success' }),
                            ipAddress: ip,
                        };
                        if (userId !== 'anonymous') data.userId = userId;

                        await this.prisma.auditLog.create({
                            data
                        });
                    } catch (e) {
                        // Silently fail audit logging to not break the app
                        console.error('Failed to write audit log', e);
                    }
                },
                error: async (error) => {
                    // Action failed
                    try {
                        const data: any = {
                            action: `${method} ${url}`,
                            resource: url.split('/')[2] || 'unknown',
                            metadata: JSON.stringify({ body: safeBody, status: 'failed', error: error.message }),
                            ipAddress: ip,
                        };
                        if (userId !== 'anonymous') data.userId = userId;

                        await this.prisma.auditLog.create({
                            data
                        });
                    } catch (e) {}
                }
            }),
        );
    }
}
