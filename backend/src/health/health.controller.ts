import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /**
   * Liveness probe — always returns 200 if the process is alive.
   * K8s uses this to decide whether to restart the container.
   */
  @Get()
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'orbitron-api',
    };
  }

  /**
   * Readiness probe — returns 200 only when the DB connection is healthy.
   * K8s uses this to decide whether to route traffic to this pod.
   */
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (err: any) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err.message,
      };
    }
  }
}
