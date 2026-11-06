import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatsController {
    constructor(private statsService: StatsService) { }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.statsService.getStats(req.user.userId);
    }

    @Get('activities')
    getActivities(@Request() req: any, @Query('limit') limit?: string) {
        return this.statsService.getActivities(
            req.user.userId,
            limit ? parseInt(limit) : 30,
        );
    }
}
