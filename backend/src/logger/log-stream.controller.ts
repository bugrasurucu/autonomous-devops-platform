import { Controller, Get, Req, Res, Query, Sse, MessageEvent, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { LogStreamService } from './log-stream.service';

@Controller('logs')
export class LogStreamController {
    private readonly jwt = new JwtService({
        secret: process.env.JWT_SECRET || 'orbitron-local-dev-jwt-secret-only',
    });

    constructor(private readonly logStream: LogStreamService) {}

    /**
     * SSE endpoint — open a persistent connection to receive live log events.
     * EventSource API cannot set Authorization headers, so we accept token via query param
     * and verify it here (previously this stream was readable without authentication).
     * Usage: new EventSource('/api/logs/stream?token=JWT_HERE')
     */
    @Sse('stream')
    stream(@Req() req: Request, @Res() res: Response, @Query('token') token?: string): Observable<MessageEvent> {
        const headerToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const raw = token || headerToken;
        try {
            if (!raw) throw new Error('missing token');
            this.jwt.verify(raw);
        } catch {
            throw new UnauthorizedException('A valid JWT is required for the live log stream');
        }
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        return this.logStream.getStream().pipe(
            map(log => ({
                data: JSON.stringify(log),
                id: log.id,
                type: 'log',
            })),
        );
    }

    /**
     * REST fallback — status check.
     */
    @Get('recent')
    getRecent() {
        return { message: 'Use /api/logs/stream for live logs', status: 'ok' };
    }
}
