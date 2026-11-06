import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { FinopsService } from './finops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finops')
@UseGuards(JwtAuthGuard)
export class FinopsController {
    constructor(private finopsService: FinopsService) { }

    @Get()
    getFinOps(@Request() req: any) {
        return this.finopsService.getFinOps(req.user.userId);
    }

    @Get('opa-evaluate')
    evaluateOpa(@Request() req: any) {
        return this.finopsService.evaluateOpaPolicies(req.user.userId);
    }

    @Post('optimize/:id')
    applyOptimization(@Request() req: any, @Param('id') id: string) {
        return this.finopsService.applyOptimization(req.user.userId, id);
    }
}
