import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
    constructor(private statsService: StatsService) { }

    @Get()
    getStats(@Request() req: any) {
        return this.statsService.getStats(req.user.userId);
    }
}
