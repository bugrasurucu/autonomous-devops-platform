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
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

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
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class AppModule { }
