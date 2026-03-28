import { Module } from '@nestjs/common';
import { CostMonitorService } from './cost-monitor.service';
import { CostMonitorController } from './cost-monitor.controller';

@Module({
    controllers: [CostMonitorController],
    providers: [CostMonitorService],
    exports: [CostMonitorService],
})
export class CostMonitorModule { }
