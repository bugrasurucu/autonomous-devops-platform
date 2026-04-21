import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { SettingsModule } from './settings/settings.module';
import { FinopsModule } from './finops/finops.module';
import { IncidentsModule } from './incidents/incidents.module';
import { GatewayModule } from './gateway/events.module';
import { LoggerModule } from './logger/logger.module';
import { GithubModule } from './github/github.module';
import { CostMonitorModule } from './cost-monitor/cost-monitor.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { TenantsModule } from './tenants/tenants.module';
import { TokenBudgetModule } from './token-budget/token-budget.module';
import { KagentBridgeModule } from './kagent-bridge/kagent-bridge.module';
import { EmailModule } from './email/email.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    AgentsModule,
    DeploymentsModule,
    SettingsModule,
    FinopsModule,
    IncidentsModule,
    GatewayModule,
    LoggerModule,
    GithubModule,
    CostMonitorModule,
    TenantsModule,
    TokenBudgetModule,
    KagentBridgeModule,
    BillingModule,
    EmailModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class AppModule { }
