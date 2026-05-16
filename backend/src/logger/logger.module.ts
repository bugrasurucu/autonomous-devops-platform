import { Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { LoggerController } from './logger.controller';
import { LogStreamService } from './log-stream.service';
import { LogStreamController } from './log-stream.controller';

@Module({
    controllers: [LoggerController, LogStreamController],
    providers: [AppLoggerService, LogStreamService],
    exports: [AppLoggerService, LogStreamService],
})
export class LoggerModule { }
