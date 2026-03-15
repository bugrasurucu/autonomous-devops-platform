import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
}
