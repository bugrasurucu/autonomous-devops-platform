import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
    imports: [AgentsModule],
    controllers: [DeploymentsController],
    providers: [DeploymentsService],
    exports: [DeploymentsService],
})
export class DeploymentsModule { }
