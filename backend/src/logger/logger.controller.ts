import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('errors')
@UseGuards(JwtAuthGuard)
export class LoggerController {
    constructor(private appLogger: AppLoggerService) { }

    @Get()
    getErrors(@Query('count') count?: string) {
        return this.appLogger.getErrors(count ? parseInt(count) : 20);
    }

    @Delete()
    clearErrors() {
        this.appLogger.clearErrors();
        return { cleared: true };
    }
}
