import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { AgentsModule } from '../agents/agents.module';
import { KagentBridgeModule } from '../kagent-bridge/kagent-bridge.module';
import { TokenBudgetModule } from '../token-budget/token-budget.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [AgentsModule, KagentBridgeModule, TokenBudgetModule, TenantsModule],
    controllers: [DeploymentsController],
    providers: [DeploymentsService],
    exports: [DeploymentsService],
})
export class DeploymentsModule { }
