import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
    let controller: HealthController;
    let prisma: PrismaService;

    const mockPrisma = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('liveness', () => {
        it('should return status ok with timestamp', () => {
            const result = controller.liveness();

            expect(result.status).toBe('ok');
            expect(result.service).toBe('orbitron-api');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('readiness', () => {
        it('should return ready when database is connected', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            const result = await controller.readiness();

            expect(result.status).toBe('ready');
            expect(result.database).toBe('connected');
        });

        it('should return not_ready when database is disconnected', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

            const result = await controller.readiness();

            expect(result.status).toBe('not_ready');
            expect(result.database).toBe('disconnected');
            expect(result.error).toBe('Connection refused');
        });
    });
});
