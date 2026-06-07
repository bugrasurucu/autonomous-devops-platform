import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwt: JwtService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockJwt = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockEmail = {
        sendWelcome: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwt },
                { provide: EmailService, useValue: mockEmail },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwt = module.get<JwtService>(JwtService);

        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user and return token', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                plan: 'free',
                passwordHash: 'hashed',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.register('test@example.com', 'password123', 'Test User');

            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.email).toBe('test@example.com');
            expect(result.user).not.toHaveProperty('passwordHash');
            expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
            expect(mockEmail.sendWelcome).toHaveBeenCalledWith('test@example.com', 'Test User');
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'test@example.com',
            });

            await expect(
                service.register('test@example.com', 'password123', 'Test User'),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login with valid credentials', async () => {
            const hashedPassword = bcrypt.hashSync('password123', 10);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                plan: 'free',
                passwordHash: hashedPassword,
            });

            const result = await service.login('test@example.com', 'password123');

            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw UnauthorizedException for wrong email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login('wrong@example.com', 'password123'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            const hashedPassword = bcrypt.hashSync('correct-password', 10);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                passwordHash: hashedPassword,
            });

            await expect(
                service.login('test@example.com', 'wrong-password'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getProfile', () => {
        it('should return user profile without passwordHash', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test',
                plan: 'free',
                passwordHash: 'secret',
            });

            const profile = await service.getProfile('user-1');

            expect(profile.email).toBe('test@example.com');
            expect(profile).not.toHaveProperty('passwordHash');
            expect(profile.planLimits).toBeDefined();
        });
    });

    describe('upgradePlan', () => {
        it('should upgrade user plan', async () => {
            mockPrisma.user.update.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test',
                plan: 'pro',
                passwordHash: 'secret',
            });

            const result = await service.upgradePlan('user-1', 'pro');

            expect(result.user.plan).toBe('pro');
            expect(result.token).toBe('mock-jwt-token');
        });

        it('should reject invalid plan', async () => {
            await expect(
                service.upgradePlan('user-1', 'invalid-plan'),
            ).rejects.toThrow(ConflictException);
        });
    });
});
