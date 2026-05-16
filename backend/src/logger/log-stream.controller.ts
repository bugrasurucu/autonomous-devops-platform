import { Controller, Get, Req, Res, Query, Sse, MessageEvent } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { LogStreamService } from './log-stream.service';

@Controller('logs')
export class LogStreamController {
    constructor(private readonly logStream: LogStreamService) {}

    /**
     * SSE endpoint — open a persistent connection to receive live log events.
     * EventSource API cannot set Authorization headers, so we accept token via query param.
     * Usage: new EventSource('/api/logs/stream?token=JWT_HERE')
     */
    @Sse('stream')
    stream(@Req() req: Request, @Res() res: Response, @Query('token') _token?: string): Observable<MessageEvent> {
        // TODO: Validate _token for production use
        // For now: open to authenticated users (frontend passes JWT)
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
