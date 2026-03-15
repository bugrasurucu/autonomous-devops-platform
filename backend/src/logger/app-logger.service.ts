import { Injectable, Logger } from '@nestjs/common';

export interface ErrorEntry {
    id: string;
    message: string;
    stack?: string;
    timestamp: string;
    context?: string;
}

@Injectable()
export class AppLoggerService {
    private readonly logger = new Logger(AppLoggerService.name);
    private errorBuffer: ErrorEntry[] = [];
    private readonly maxErrors = 100;

    logError(message: string, stack?: string, context?: string) {
        const entry: ErrorEntry = {
            id: `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            message,
            stack,
            timestamp: new Date().toISOString(),
            context,
        };

        this.errorBuffer.unshift(entry);
        if (this.errorBuffer.length > this.maxErrors) {
            this.errorBuffer = this.errorBuffer.slice(0, this.maxErrors);
        }

        this.logger.error(`[${context}] ${message}`, stack);
        return entry;
    }

    getErrors(count = 20): ErrorEntry[] {
        return this.errorBuffer.slice(0, count);
    }

    clearErrors() {
        this.errorBuffer = [];
    }
}
