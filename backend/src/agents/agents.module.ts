import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { KagentBridgeModule } from '../kagent-bridge/kagent-bridge.module';
import { TokenBudgetModule } from '../token-budget/token-budget.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [KagentBridgeModule, TokenBudgetModule, TenantsModule],
    controllers: [AgentsController],
    providers: [AgentsService],
    exports: [AgentsService],
})
export class AgentsModule { }
