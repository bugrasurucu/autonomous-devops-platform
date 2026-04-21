import { Module } from '@nestjs/common';
import { KagentBridgeService } from './kagent-bridge.service';
import { KagentBridgeController } from './kagent-bridge.controller';

@Module({
    controllers: [KagentBridgeController],
    providers: [KagentBridgeService],
    exports: [KagentBridgeService],
})
export class KagentBridgeModule {}

