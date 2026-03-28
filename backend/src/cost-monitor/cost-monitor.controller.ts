import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { CostMonitorService } from './cost-monitor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cost')
@UseGuards(JwtAuthGuard)
export class CostMonitorController {
    constructor(private costMonitorService: CostMonitorService) { }

    @Get('tiers')
    getTiers() {
        return this.costMonitorService.getTiers();
    }

    @Get('free-tier')
    getFreeTier() {
        return this.costMonitorService.getAwsFreeTier();
    }

    @Get('estimates')
    getCostEstimates() {
        return this.costMonitorService.getCostEstimates();
    }

    @Get('usage')
    getUsage(@Request() req: any) {
        return this.costMonitorService.getMonthlyUsage(req.user.userId);
    }

    @Get('metrics')
    getMetrics(@Request() req: any) {
        return this.costMonitorService.getMetrics(req.user.userId);
    }

    @Get('suggestions')
    getSuggestions(@Request() req: any) {
        return this.costMonitorService.getSmartSuggestions(req.user.userId);
    }

    @Get('scaling/history')
    getScalingHistory(@Request() req: any) {
        return this.costMonitorService.getScalingHistory(req.user.userId);
    }

    @Post('scale')
    applyScaling(@Request() req: any, @Body() body: { action: string }) {
        return this.costMonitorService.applyScaling(req.user.userId, body.action);
    }
}
