import { Module } from '@nestjs/common';
import { TokenBudgetService } from './token-budget.service';
import { TokenBudgetController } from './token-budget.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [TenantsModule],
    providers: [TokenBudgetService],
    controllers: [TokenBudgetController],
    exports: [TokenBudgetService],
})
export class TokenBudgetModule {}
