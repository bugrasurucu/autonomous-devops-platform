import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
    providers: [TenantsService],
    controllers: [TenantsController],
    exports: [TenantsService],
})
export class TenantsModule {}
