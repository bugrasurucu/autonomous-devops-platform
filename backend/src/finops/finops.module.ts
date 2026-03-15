import { Module } from '@nestjs/common';
import { FinopsController } from './finops.controller';
import { FinopsService } from './finops.service';

@Module({
    controllers: [FinopsController],
    providers: [FinopsService],
})
export class FinopsModule { }
