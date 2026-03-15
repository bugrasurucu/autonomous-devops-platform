import { Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { LoggerController } from './logger.controller';

@Module({
    controllers: [LoggerController],
    providers: [AppLoggerService],
    exports: [AppLoggerService],
})
export class LoggerModule { }
