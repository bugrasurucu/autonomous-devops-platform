import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TokenBudgetService } from './token-budget.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from '../tenants/tenants.service';

@Controller('token-usage')
@UseGuards(JwtAuthGuard)
export class TokenBudgetController {
    constructor(
        private tokenBudget: TokenBudgetService,
        private tenants: TenantsService,
    ) {}

    @Get()
    async getUsage(@Request() req: any) {
        const org = await this.tenants.getOrCreateOrgForUser(req.user.userId);
        return this.tokenBudget.getUsageBreakdown(org.id);
    }
}
